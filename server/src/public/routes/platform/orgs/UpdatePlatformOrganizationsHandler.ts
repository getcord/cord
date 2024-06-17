import type { Request, Response } from 'express';

import {
  createPlatformOrganization,
  forwardHandlerExceptionsToNext,
  ApiCallerError,
  updatePlatformOrganizationMembers,
} from 'server/src/public/routes/platform/util.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { AuthProviderType } from 'server/src/auth/index.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { validateExternalID } from 'server/src/public/routes/platform/types.ts';
import type { UUID } from 'common/types/index.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';
import {
  getSchemaDescription,
  validate,
} from 'server/src/public/routes/platform/validatorFunction.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';
import { restartSomeUserSubscriptions } from 'server/src/public/subscriptions/util/restart_subscription.ts';

async function updateOrganizationHandler(req: Request, res: Response) {
  const platformApplicationID = req.appID;
  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_access_token');
  }

  const externalID = req.params.orgID;

  const { isCreated } = await updateOrganization(
    platformApplicationID,
    externalID,
    req.body,
  );

  return res.status(200).json({
    success: true,
    message: `✅ You successfully ${
      isCreated ? 'created' : 'updated'
    } group ${externalID}`,
  });
}

export async function updateOrganization(
  platformApplicationID: UUID,
  externalID: string,
  data: any,
) {
  validateExternalID(externalID, 'orgID');
  const application = await ApplicationEntity.findByPk(platformApplicationID);

  const { name, status, members, metadata, ...rest } =
    validate.UpdatePlatformGroupVariables(data);
  // Check that all properties are destructured
  const _: Record<string, never> = rest;

  const org = await OrgEntity.findOne({
    where: {
      externalID,
      externalProvider: AuthProviderType.PLATFORM,
      platformApplicationID,
    },
  });

  let addedMembers: UUID[] = [];
  let deletedMembers: UUID[] = [];
  let newOrg: OrgEntity;

  if (org) {
    await getSequelize().transaction(async (transaction) => {
      await OrgEntity.update(
        { name, state: status === 'deleted' ? 'inactive' : 'active', metadata },
        {
          where: {
            externalID,
            externalProvider: AuthProviderType.PLATFORM,
            platformApplicationID,
          },
          transaction,
        },
      );

      if (members) {
        const { added, deleted } = await updatePlatformOrganizationMembers(
          org,
          members,
          transaction,
        );
        addedMembers = added;
        deletedMembers = deleted;
      }
      if (await application?.isSupportChatEnabled()) {
        await OrgMembersEntity.upsert(
          {
            userID: application!.supportBotID!,
            orgID: org.id,
          },
          { transaction },
        );
      }
    });
  } else {
    if (!name) {
      throw new ApiCallerError('missing_field', {
        message:
          'Invalid UpdatePlatformGroupVariables:\n' +
          'Group does not exist, "name" is a required field to create a new group.' +
          (getSchemaDescription('UpdatePlatformOrganizationVariables') ?? ''),
      });
    }
    await getSequelize().transaction(async (transaction) => {
      newOrg = await createPlatformOrganization(
        platformApplicationID,
        externalID,
        name,
        status,
        metadata,
        transaction,
      );

      if (members) {
        const { added } = await updatePlatformOrganizationMembers(
          newOrg,
          members,
          transaction,
        );
        addedMembers = added;
      }

      if (await application?.isSupportChatEnabled()) {
        await OrgMembersEntity.create(
          {
            userID: application!.supportBotID!,
            orgID: newOrg.id,
          },
          { transaction },
        );
      }
      const orgsCount = await OrgEntity.count({
        where: { platformApplicationID },
      });
      if (orgsCount === 0) {
        transaction.afterCommit(async () => {
          await publishPubSubEvent('console-getting-started-updated', {
            applicationID: platformApplicationID,
          });
        });
      }
    });
  }

  // TODO: temporary: org causing load issues
  if (org?.id !== 'ac2ba2c5-f4ad-425b-ab53-2a0970c0b5cc') {
    restartSomeUserSubscriptions([...addedMembers, ...deletedMembers]);
  }

  addedMembers.forEach((userID) => {
    backgroundPromise(publishPubSubEvent('user-identity', { userID }));
    backgroundPromise(
      publishPubSubEvent(
        'org-member-added',
        { orgID: org?.id ?? newOrg.id },
        { userID },
      ),
    );
  });
  deletedMembers.forEach((userID) => {
    backgroundPromise(publishPubSubEvent('user-identity', { userID }));
    backgroundPromise(
      publishPubSubEvent(
        'org-member-removed',
        { orgID: org?.id ?? newOrg.id },
        { userID },
      ),
    );
  });

  return { isCreated: !org };
}

export default forwardHandlerExceptionsToNext(updateOrganizationHandler);
