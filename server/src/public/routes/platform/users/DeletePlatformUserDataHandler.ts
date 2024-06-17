import type { Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import type { UUID } from 'common/types/index.ts';
import { FileEntity } from 'server/src/entity/file/FileEntity.ts';
import { LinkedUsersEntity } from 'server/src/entity/linked_users/LinkedUsersEntity.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import { validateExternalID } from 'server/src/public/routes/platform/types.ts';
import { validate } from 'server/src/public/routes/platform/validatorFunction.ts';

import {
  ApiCallerError,
  forwardHandlerExceptionsToNext,
} from 'server/src/public/routes/platform/util.ts';

/**
 * This handler removes the user along with any data that could identify them
 * and associated data such as messages, attachments etc sent by the user.
 */
async function deleteUserDataHandler(req: Request, res: Response) {
  const platformApplicationID = req.appID;
  const { permanently_delete, ...rest } = validate.DeleteUserVariables(
    req.body,
  );
  // Check that all properties are destructured
  const _: Record<string, never> = rest;

  if (!platformApplicationID || !permanently_delete) {
    throw new ApiCallerError('invalid_request');
  }

  const externalID = req.params.userID;
  validateExternalID(externalID, 'userID');

  const userToBeDeleted = await UserEntity.findOne({
    where: {
      externalID,
      platformApplicationID,
    },
  });

  if (!userToBeDeleted) {
    throw new ApiCallerError('invalid_user_id', {
      message: `Invalid user id: ${externalID}.`,
    });
  }

  // We first wipe data from the s3 buckets which are message attachments/files
  const userToBeDeletedUserID = userToBeDeleted.id;

  const linkedUsers = await LinkedUsersEntity.findAll({
    where: {
      sourceUserID: userToBeDeletedUserID,
    },
  });

  const linkedUserIDs = linkedUsers.map((user) => user.linkedUserID);

  const orgMemberEntities = await OrgMembersEntity.findAll({
    where: { userID: userToBeDeletedUserID },
  });

  const orgIDsUserIsMemberOf = orgMemberEntities.map(
    (orgMember) => orgMember.orgID,
  );

  const failedDeletionFileIDs: string[] = [];

  const allUsers = [userToBeDeletedUserID, ...linkedUserIDs];
  const filesToBeDeleted = await FileEntity.findAll({
    where: {
      userID: allUsers,
    },
  });

  const headers = {
    method: 'DELETE',
  };

  await Promise.all(
    filesToBeDeleted.map(async (file) => {
      // We don't run this part in tests
      if (!process.env.JEST_WORKER_ID) {
        const deletionURL = await file.getDeleteURL();
        const deleteResponse = await fetch(deletionURL, headers);

        if (!deleteResponse.ok) {
          failedDeletionFileIDs.push(file.id);
        }
      }

      // destroy file regardless of if the delete response is ok
      await file.destroy();
    }),
  );

  await getSequelize().transaction(async (transaction) => {
    // Deleting messages where the user or linked slack user is the author
    // and the message belongs to one of the orgs the user is in
    // We don't check within the slack user's org as a slack user can be linked
    // to multiple platform users
    const threadIDsFromDeletedMessages = await getSequelize().query<{
      threadID: UUID;
    }>(
      `
        DELETE FROM cord.messages
        WHERE "sourceID" = ANY($1)
        AND "orgID" = ANY($2)
        RETURNING "threadID";
        `,
      {
        bind: [allUsers, orgIDsUserIsMemberOf],
        transaction,
        type: QueryTypes.SELECT,
      },
    );

    const threadIDs = new Set(
      threadIDsFromDeletedMessages.map((data) => data.threadID),
    );

    // Delete any threads that no longer have any messages
    await getSequelize().query(
      `
      DELETE FROM cord.threads t
      WHERE t.id = ANY ($1)
      AND NOT EXISTS(
        SELECT 1 FROM cord.messages
        WHERE "threadID" = t.id
        );
    `,
      { bind: [[...threadIDs]], transaction },
    );

    await userToBeDeleted.destroy({ transaction });
  });

  anonymousLogger().info('User deleted', {
    platformApplicationID,
    externalID,
    usersDeleted: userToBeDeletedUserID,
  });

  res.status(200).json({
    success: true,
    message: 'User deleted.',
    userID: externalID,
    failedDeletionFileIDs,
  });
}
export default forwardHandlerExceptionsToNext(deleteUserDataHandler);
