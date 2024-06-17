import type { Request, Response } from 'express';
import {
  createPlatformUser,
  forwardHandlerExceptionsToNext,
  ApiCallerError,
} from 'server/src/public/routes/platform/util.ts';
import { AuthProviderType, Viewer } from 'server/src/auth/index.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { validateExternalID } from 'server/src/public/routes/platform/types.ts';
import type { UUID } from 'common/types/index.ts';
import {
  publishPubSubEvent,
  publishUserIdentityUpdate,
} from 'server/src/pubsub/index.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import {
  removeEmptyStringEmailIfExists,
  validate,
} from 'server/src/public/routes/platform/validatorFunction.ts';
import { UserMutator } from 'server/src/entity/user/UserMutator.ts';
import { deprecated } from 'server/src/logging/deprecate.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';

async function updateUserHandler(req: Request, res: Response) {
  const platformApplicationID = req.appID;
  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_access_token');
  }

  const externalID = req.params.userID;

  const result = await updateUser(platformApplicationID, externalID, req.body);

  return res.status(200).json({
    success: true,
    message: `✅ You successfully ${
      result.isCreated ? 'created' : 'updated'
    } user ${externalID}`,
  });
}

export async function updateUser(
  platformApplicationID: UUID,
  externalID: string,
  data: any,
): Promise<{ isCreated: boolean }> {
  validateExternalID(externalID, 'userID');
  const result = await getSequelize().transaction(async (transaction) => {
    const {
      name,
      shortName,
      short_name,
      email,
      profilePictureURL,
      profile_picture_url,
      status,
      metadata,
      first_name,
      last_name,
      addGroups,
      removeGroups,
      ...rest
    } = removeEmptyStringEmailIfExists(
      validate.UpdatePlatformUserVariables(data),
    );
    // Check that all properties are destructured
    const _: Record<string, never> = rest;

    if (profile_picture_url) {
      deprecated(
        'snake:UpdatePlatformUserHandler:profile_picture_url',
        platformApplicationID,
      );
    }
    if (first_name) {
      deprecated('UpdatePlatformUserHandler:first_name', platformApplicationID);
    }
    if (last_name) {
      deprecated('UpdatePlatformUserHandler:last_name', platformApplicationID);
    }

    let user = await UserEntity.findOne({
      where: {
        externalID,
        platformApplicationID,
        externalProvider: AuthProviderType.PLATFORM,
      },
      transaction,
    });
    const isCreated = !user;

    if (user) {
      const didUpdate = await new UserMutator(
        Viewer.createServiceViewer(),
        null,
      ).updateUser(
        user,
        {
          name: name ?? undefined,
          email: email ?? undefined,
          screenName: shortName ?? short_name ?? undefined,
          profilePictureURL: profilePictureURL ?? profile_picture_url,
          state: status,
          metadata: metadata ?? undefined,
        },
        transaction,
      );

      if (didUpdate) {
        transaction.afterCommit(async () => {
          await publishUserIdentityUpdate({
            userID: user!.id,
            platformApplicationID,
          });
        });
      }
    } else {
      user = await createPlatformUser(
        null,
        platformApplicationID,
        externalID,
        email,
        name,
        shortName ?? short_name,
        profilePictureURL ?? profile_picture_url,
        status,
        metadata,
        transaction,
      );
    }

    if (addGroups?.length || removeGroups?.length) {
      const u = user; // Help TS know that this can't change anymore
      const add = addGroups ?? [];
      const remove = removeGroups ?? [];
      const addSet = new Set(add);
      const removeSet = new Set(remove);
      if (remove.some((g) => addSet.has(g))) {
        throw new ApiCallerError('invalid_field', {
          message: 'Adding and removing the same group is invalid.',
        });
      }
      const [addOrgs, removeOrgs] = await Promise.all([
        OrgEntity.findAll({
          where: { platformApplicationID, externalID: add },
          transaction,
        }),
        OrgEntity.findAll({
          where: { platformApplicationID, externalID: remove },
          transaction,
        }),
      ]);
      if (addSet.size !== addOrgs.length) {
        // Some to-be-added group wasn't found
        for (const org of addOrgs) {
          addSet.delete(org.externalID);
        }
        throw new ApiCallerError('group_not_found', {
          message: `Group ${addSet.values().next().value} not found.`,
        });
      }
      if (removeSet.size !== removeOrgs.length) {
        // Some to-be-removed group wasn't found
        for (const org of removeOrgs) {
          removeSet.delete(org.externalID);
        }
        throw new ApiCallerError('group_not_found', {
          message: `Group ${removeSet.values().next().value} not found.`,
        });
      }
      await Promise.all([
        OrgMembersEntity.bulkCreate(
          addOrgs.map((org) => ({
            userID: u.id,
            orgID: org.id,
          })),
          {
            ignoreDuplicates: true,
            transaction,
          },
        ),
        OrgMembersEntity.destroy({
          where: {
            userID: u.id,
            orgID: removeOrgs.map((org) => org.id),
          },
          transaction,
        }),
      ]);
    }

    if (isCreated) {
      const usersCount = await UserEntity.count({
        where: { platformApplicationID },
      });

      if (usersCount === 0) {
        transaction.afterCommit(async () => {
          await publishPubSubEvent('console-getting-started-updated', {
            applicationID: platformApplicationID,
          });
        });
      }
    }

    return { isCreated };
  });
  return result;
}

export default forwardHandlerExceptionsToNext(updateUserHandler);
