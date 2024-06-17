import Ajv from 'ajv';
import addFormat from 'ajv-formats';
import type { Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import type { UUID } from '@cord-sdk/types/core.ts';

import {
  ApiCallerError,
  forwardHandlerExceptionsToNext,
} from 'server/src/public/routes/platform/util.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { AuthProviderType } from 'server/src/auth/index.ts';
import { LinkedOrgsEntity } from 'server/src/entity/linked_orgs/LinkedOrgsEntity.ts';

// We want to verify types on this input but do not want this to show in our
// general type information, so we build an AJV validator here to validate
// that the data is of the correct shape
type MigrationInput = {
  sourceApplicationID: UUID;
  sourceGroupID: string; // This is technically ID, but AJV will coerce it
  destinationApplicationID: UUID;
  destinationGroupID: string; // This is technically ID, but AJV will coerce it
};

const MigrationAJVSchema = {
  type: 'object',
  properties: {
    sourceApplicationID: { type: 'string', format: 'uuid' },
    sourceGroupID: { type: 'string' },
    destinationApplicationID: { type: 'string', format: 'uuid' },
    destinationGroupID: { type: 'string' },
  },
  required: [
    'sourceApplicationID',
    'sourceGroupID',
    'destinationApplicationID',
    'destinationGroupID',
  ],
  additionalProperties: false,
};

const ajv = new Ajv.default({
  verbose: true,
  coerceTypes: true,
});
addFormat.default(ajv, ['uuid']);

const validateInputAgainstSchema = ajv.compile(MigrationAJVSchema);

function validateMigrationInput(
  input: unknown,
): asserts input is MigrationInput {
  if (!validateInputAgainstSchema(input)) {
    throw new Error('Incorrect arguments to endpoint');
  }
}

async function ThoughtspotApplicationMigrationHandler(
  req: Request,
  res: Response,
) {
  const customerID = req.customerID;
  if (!customerID) {
    throw new ApiCallerError('invalid_request');
  }
  // We only support calling this from Thoughtspot currently
  if (customerID !== '43fdeae8-4b68-4e36-a58d-56085f8e2497') {
    res.sendStatus(404).end();
    return;
  }
  validateMigrationInput(req.body);

  const {
    sourceApplicationID,
    sourceGroupID,
    destinationApplicationID,
    destinationGroupID,
  } = req.body;

  const [sourceApp, sourceOrg, destinationApp, destinationOrg] =
    await Promise.all([
      ApplicationEntity.findOne({
        where: { id: sourceApplicationID, customerID },
      }),
      OrgEntity.findOne({
        where: {
          externalID: sourceGroupID,
          platformApplicationID: sourceApplicationID,
        },
      }),
      ApplicationEntity.findOne({
        where: { id: destinationApplicationID, customerID },
      }),
      // Maybe allow findOrCreate or only create
      OrgEntity.findOne({
        where: {
          externalID: destinationGroupID,
          platformApplicationID: destinationApplicationID,
        },
      }),
    ]);

  if (!sourceApp) {
    throw new ApiCallerError('project_not_found', {
      message: `Unable to load project : ${sourceApplicationID}`,
    });
  }
  if (!sourceOrg) {
    throw new ApiCallerError('group_not_found', {
      message: `Unable to load group : ${sourceGroupID}`,
    });
  }
  if (!destinationApp) {
    throw new ApiCallerError('project_not_found', {
      message: `Unable to load project : ${destinationApplicationID}`,
    });
  }
  if (destinationOrg) {
    throw new ApiCallerError('group_already_exists', {
      message: `Destination group (${destinationGroupID}) already exists`,
    });
  }
  const possibleLinkedOrg = await LinkedOrgsEntity.findOne({
    where: { sourceOrgID: sourceOrg.id },
  });
  if (possibleLinkedOrg) {
    throw new ApiCallerError('invalid_request', {
      message: `This endpoint does not support migrating groups that are linked with Slack`,
    });
  }

  // The easy case is we are just moving an org from one id to another in the
  // same application.  In this case we just add a new external id to the
  // existing org and everything just works
  if (sourceApplicationID === destinationApplicationID) {
    await sourceOrg.update({ externalID: destinationGroupID });
  } else {
    // here be dragons
    let bindVariables: (string | number)[] = [sourceApplicationID];

    const sequelize = getSequelize();
    await sequelize.transaction(
      // { deferrable: Sequelize.Deferrable.SET_DEFERRED, logging: console.log },
      { deferrable: 'SET CONSTRAINTS ALL DEFERRED;' },
      async (transaction) => {
        const usersInMoreThanOneOrg = await sequelize.query<{
          externalID: string;
        }>(
          `
SELECT u."externalID"
FROM users u
INNER JOIN org_members om ON u.id=om."userID"
WHERE "platformApplicationID" = $1
GROUP BY u.id
HAVING count(1) > 1`,
          {
            type: QueryTypes.SELECT,
            bind: bindVariables,
            transaction,
          },
        );
        if (usersInMoreThanOneOrg.length) {
          throw new ApiCallerError('invalid_request', {
            message: `User(s) [${usersInMoreThanOneOrg
              .map((u) => u.externalID)
              .join(', ')}] exist in more than one group`,
          });
        }

        // Create a destination org in the destination application
        const newDestinationOrg = await OrgEntity.create(
          {
            state: 'active',
            name: destinationGroupID,
            externalID: destinationGroupID,
            externalProvider: AuthProviderType.PLATFORM,
            platformApplicationID: destinationApplicationID,
          },
          { transaction },
        );

        // Update the users to be in the new App ID
        bindVariables = [destinationApplicationID, sourceApplicationID];
        await sequelize.query(
          `
UPDATE users
SET "platformApplicationID" = $1
WHERE "platformApplicationID" = $2`,
          {
            bind: bindVariables,
            type: QueryTypes.UPDATE,
            transaction,
          },
        );

        // Update Org Membership
        bindVariables = [newDestinationOrg.id, sourceOrg.id];
        await sequelize.query(
          `
UPDATE org_members
SET "orgID" = $1
WHERE "orgID" = $2`,
          {
            bind: bindVariables,
            type: QueryTypes.UPDATE,
            transaction,
          },
        );

        // Update pages table
        await sequelize.query(
          `
UPDATE pages
SET "orgID" = $1
WHERE "orgID" = $2`,
          {
            bind: bindVariables,
            type: QueryTypes.UPDATE,
            transaction,
          },
        );

        // Update thread_participants
        await sequelize.query(
          `
UPDATE thread_participants
SET "orgID" = $1
WHERE "orgID" = $2`,
          {
            bind: bindVariables,
            type: QueryTypes.UPDATE,
            transaction,
          },
        );

        // Update page_visitors
        await sequelize.query(
          `
UPDATE page_visitors
SET "orgID" = $1
WHERE "orgID" = $2`,
          {
            bind: bindVariables,
            type: QueryTypes.UPDATE,
            transaction,
          },
        );

        // Update user_hidden_annotations
        await sequelize.query(
          `
UPDATE user_hidden_annotations
SET "orgID" = $1
WHERE "orgID" = $2`,
          {
            bind: bindVariables,
            type: QueryTypes.UPDATE,
            transaction,
          },
        );

        // Update email_notifications
        await sequelize.query(
          `
UPDATE email_notifications
SET "orgID" = $1, "threadOrgID" = $1
WHERE "orgID" = $2 AND "threadOrgID" = $2`,
          {
            bind: bindVariables,
            type: QueryTypes.UPDATE,
            transaction,
          },
        );

        // Update message_notifications
        await sequelize.query(
          `
UPDATE message_notifications
SET "targetOrgID" = $1, "sharerOrgID" = $1
WHERE "targetOrgID" = $2 AND "sharerOrgID" = $2`,
          {
            bind: bindVariables,
            type: QueryTypes.UPDATE,
            transaction,
          },
        );

        // Update Threads table
        bindVariables = [
          newDestinationOrg.id,
          destinationApplicationID,
          sourceOrg.id,
          sourceApplicationID,
        ];
        await sequelize.query(
          `
UPDATE threads
SET "orgID" = $1, "platformApplicationID" = $2
WHERE "orgID" = $3 AND "platformApplicationID" = $4`,
          {
            bind: bindVariables,
            type: QueryTypes.UPDATE,
            transaction,
          },
        );

        // Update messages
        await sequelize.query(
          `
UPDATE messages
SET "orgID" = $1, "platformApplicationID" = $2
WHERE "orgID" = $3 AND "platformApplicationID" = $4`,
          {
            bind: bindVariables,
            type: QueryTypes.UPDATE,
            transaction,
          },
        );

        // Update files
        bindVariables = [destinationApplicationID, newDestinationOrg.id];
        await sequelize.query(
          `
UPDATE files f
SET "platformApplicationID" = $1
FROM messages m
INNER JOIN message_attachments ma on m.id = ma."messageID"
WHERE f.id = (ma.data->>'fileID')::uuid AND m."orgID" = $2 AND m."platformApplicationID" = $1`,
          {
            bind: bindVariables,
            type: QueryTypes.UPDATE,
            transaction,
          },
        );

        // Update notifications
        await sequelize.query(
          `
UPDATE notifications n
SET "platformApplicationID" = $1
FROM org_members om1, org_members om2
WHERE n."recipientID" = om1."userID" AND n."senderID" = om2."userID"
AND om1."orgID" = om2."orgID" AND om1."orgID" = $2`,
          {
            bind: bindVariables,
            type: QueryTypes.UPDATE,
            transaction,
          },
        );

        // Currently skipping linked_orgs and linked_users because Thoughtspot
        // only has 4 (out of 738k) slack linked orgs
        // We return an error above if they try this with a slack linked org
        // so we can revisit this if needed
        // linked_orgs
        // linked_users

        // Skipping all the slack tables as well for the same reasons
        // slack_channels
        // slack_messages
        // slack_mirrored_threads
        // slack_mirrored_support_threads
      },
    );
  }
  return res.json({
    success: true,
    message: `✅ migration successful`,
  });
}
export default forwardHandlerExceptionsToNext(
  ThoughtspotApplicationMigrationHandler,
);
