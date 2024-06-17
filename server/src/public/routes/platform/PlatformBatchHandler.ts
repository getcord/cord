import type { Request, Response } from 'express';
import { Op, Sequelize } from 'sequelize';

import { AuthProviderType, Viewer } from 'server/src/auth/index.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';

import {
  forwardHandlerExceptionsToNext,
  ApiCallerError,
} from 'server/src/public/routes/platform/util.ts';
import type { ElementOf, UUID } from 'common/types/index.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { combine, isDefined } from 'common/util/index.ts';
import { pluralize } from '@cord-sdk/react/common/util.ts';
import {
  removeEmptyStringEmailIfExists,
  validate,
} from 'server/src/public/routes/platform/validatorFunction.ts';
import { UserMutator } from 'server/src/entity/user/UserMutator.ts';
import { deprecated } from 'server/src/logging/deprecate.ts';

async function batchHandler(req: Request, res: Response) {
  const platformApplicationID = req.appID;
  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_access_token');
  }

  const {
    groups,
    organizations: organizationsInput,
    users,
    ...rest
  } = validate.BatchAPIVariables(req.body);
  // Check that all properties are destructured
  const _: Record<string, never> = rest;

  const organizations = groups ?? organizationsInput;

  if (users?.some((u) => u.first_name)) {
    deprecated('PlatformBatchHandler:first_name', platformApplicationID);
  }
  if (users?.some((u) => u.last_name)) {
    deprecated('PlatformBatchHandler:last_name', platformApplicationID);
  }
  if (organizationsInput) {
    deprecated('PlatformBatchHandler:organizations', platformApplicationID);
  }

  const externalUserIndex = new Map<string, string>();
  await getSequelize().transaction(async (transaction) => {
    if (users) {
      const usersIndex = new Map<string, ElementOf<typeof users>>();
      const userIDs: string[] = [];

      for (const u of users) {
        usersIndex.set(u.id.toString(), u);
        userIDs.push(u.id.toString());
      }

      const existingUsers = await UserEntity.findAll({
        where: {
          externalID: userIDs,
          externalProvider: AuthProviderType.PLATFORM,
          platformApplicationID,
        },
        transaction,
      });

      const existingUserIDs = new Set<string>();

      for (const userEntity of existingUsers) {
        const data = userEntity.externalID
          ? usersIndex.get(userEntity.externalID)
          : undefined;

        if (data) {
          existingUserIDs.add(userEntity.externalID);
          externalUserIndex.set(userEntity.externalID, userEntity.id);

          const { id: _id, ...fields } = data;

          // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
          const validatedInput = removeEmptyStringEmailIfExists(
            validate.UpdatePlatformUserVariables(fields),
          );
          const {
            name,
            short_name,
            email,
            profile_picture_url,
            status,
            metadata,
          } = validatedInput;

          await userEntity.update(
            {
              name,
              ...(isDefined(name) &&
                name !== userEntity.name && {
                  nameUpdatedTimestamp: Sequelize.fn('now'),
                }),
              screenName: short_name,
              profilePictureURL: profile_picture_url,
              ...(isDefined(profile_picture_url) &&
                profile_picture_url !== userEntity.profilePictureURL && {
                  profilePictureURLUpdatedTimestamp: Sequelize.fn('now'),
                }),
              email,
              state: status,
              metadata: metadata ?? undefined,
            },
            { transaction },
          );
        }
      }

      const newUserIDs = userIDs.filter((id) => !existingUserIDs.has(id));

      const newUsersInput = newUserIDs.map((id) =>
        validate.CreatePlatformUserVariables(usersIndex.get(id)),
      );

      const userEntities = await new UserMutator(
        Viewer.createServiceViewer(),
        null,
      ).rawBulkCreate(
        newUsersInput.map(
          ({ id, name, short_name, email, profile_picture_url, metadata }) => ({
            name,
            screenName: short_name,
            nameUpdatedTimestamp: isDefined(name)
              ? (Sequelize.fn('now') as any as Date)
              : null,
            email,
            profilePictureURL: profile_picture_url,
            profilePictureURLUpdatedTimestamp: isDefined(profile_picture_url)
              ? (Sequelize.fn('now') as any as Date)
              : null,
            externalID: id.toString(),
            externalProvider: AuthProviderType.PLATFORM,
            platformApplicationID,
            state: 'active',
            metadata: metadata ?? undefined,
          }),
        ),
        transaction,
      );

      for (const userEntity of userEntities) {
        if (userEntity.externalID !== null) {
          externalUserIndex.set(userEntity.externalID, userEntity.id);
        }
      }
    }

    if (organizations) {
      const organizationsIndex = new Map<
        string,
        ElementOf<typeof organizations>
      >();

      const organizationIDs: string[] = [];

      for (const o of organizations) {
        organizationsIndex.set(o.id.toString(), o);
        organizationIDs.push(o.id.toString());
      }

      const existingOrganizations = await OrgEntity.findAll({
        where: {
          externalID: organizationIDs,
          externalProvider: AuthProviderType.PLATFORM,
          platformApplicationID,
        },
        transaction,
      });

      const existingOrganizationIDs = new Set<string>();

      await Promise.all(
        existingOrganizations.map((organizationEntity) => {
          const data = organizationEntity.externalID
            ? organizationsIndex.get(organizationEntity.externalID)
            : undefined;

          if (data) {
            existingOrganizationIDs.add(organizationEntity.externalID);

            const { id: _id, ...fields } = data;
            const { name, status, metadata } =
              validate.UpdatePlatformOrganizationVariables(fields);

            return organizationEntity.update(
              {
                name,
                state: status
                  ? status === 'deleted'
                    ? 'inactive'
                    : 'active'
                  : undefined,
                metadata,
              },
              { transaction },
            );
          } else {
            return undefined;
          }
        }),
      );

      const application = await ApplicationEntity.findByPk(
        platformApplicationID,
        { transaction },
      );

      const newOrganizationsData = organizationIDs
        .filter((id) => !existingOrganizationIDs.has(id))
        .map((id) =>
          validate.CreatePlatformOrganizationVariables(
            organizationsIndex.get(id),
          ),
        )
        .map((data) => ({
          name: data.name,
          externalID: data.id.toString(),
          externalProvider: AuthProviderType.PLATFORM,
          platformApplicationID,
          state: 'active' as const,
          metadata: data.metadata,
        }));

      const newlyCreatedOrgs = await OrgEntity.bulkCreate(
        newOrganizationsData,
        {
          transaction,
          updateOnDuplicate: ['name', 'state', 'externalProvider', 'metadata'],
          conflictWhere: { platformApplicationID: { [Op.ne]: null } },
        },
      );

      if (await application?.isSupportChatEnabled()) {
        await OrgMembersEntity.bulkCreate(
          newlyCreatedOrgs.map((newOrg) => {
            return {
              userID: application!.supportBotID!,
              orgID: newOrg.id,
            };
          }),
          { transaction },
        );
      }

      // update org members
      const allMemberIDs = new Set<string>();
      organizations.forEach((org) => {
        if (org.members) {
          org.members.forEach((member) => {
            allMemberIDs.add(member.toString());
          });
        }
      });

      const [allMemberUsers, allOrgs] = await Promise.all([
        UserEntity.findAll({
          where: {
            externalID: [...allMemberIDs],
            externalProvider: AuthProviderType.PLATFORM,
            platformApplicationID,
          },
          attributes: ['id', 'externalID'],
          transaction,
        }),
        OrgEntity.findAll({
          where: {
            externalID: organizations.map(({ id }) => id.toString()),
            externalProvider: AuthProviderType.PLATFORM,
            platformApplicationID,
          },
          attributes: ['id', 'externalID'],
          transaction,
        }),
      ]);

      // If we don't get a UserEntity back for each user id
      // Determine who is missing and throw error to inform caller
      if (allMemberIDs.size !== allMemberUsers.length) {
        const userIDSet = new Set(
          allMemberUsers.map((user) => user.externalID),
        );
        const missingMembers = new Set<string>();
        [...allMemberIDs].forEach((member) => {
          if (!userIDSet.has(member)) {
            missingMembers.add(member);
          }
        });
        if (missingMembers.size > 0) {
          throw new ApiCallerError('user_not_found', {
            message: `Platform ${
              missingMembers.size > 1 ? 'users' : 'user'
            } ${combine('and', [...missingMembers])} not found.`,
          });
        }
      }

      const externalIDToUserIDs = new Map<string, UUID>(
        allMemberUsers.map((user) => [user.externalID, user.id]),
      );

      const orgsIndex = new Map(
        allOrgs.map(({ id, externalID }) => [externalID, id]),
      );

      const deleteConditions: { [orgID: string]: string[] } = {};
      const createData: any[] = [];

      for (const organization of organizations) {
        const members = organization.members?.map((member) =>
          member.toString(),
        );
        const orgID = orgsIndex.get(organization.id.toString());
        if (!members || !orgID) {
          continue;
        }

        const userIDs = Array.from(
          new Set(
            members.map(
              (externalID: string) => externalIDToUserIDs.get(externalID) ?? '',
            ),
          ),
        );

        if (await application?.isSupportChatEnabled()) {
          userIDs.push(application!.supportBotID!);
        }

        deleteConditions[orgID] = userIDs;

        for (const userID of userIDs) {
          createData.push({
            userID,
            orgID,
          });
        }
      }

      await Promise.all([
        OrgMembersEntity.bulkCreate(createData, {
          ignoreDuplicates: true,
          transaction,
        }),
        OrgMembersEntity.destroy({
          where: {
            [Op.or]: Object.entries(deleteConditions).map(
              ([orgID, userIDs]) => ({
                orgID,
                userID: { [Op.notIn]: userIDs },
              }),
            ),
          },
          transaction,
        }),
      ]);
    }
  });
  const usersUpdated = users?.length ?? 0;
  const orgsUpdated = organizations?.length ?? 0;
  return res.json({
    success: true,
    message: `✅ You successfully batch updated ${pluralize(
      usersUpdated,
      'user',
    )} and ${pluralize(orgsUpdated, 'group')}`,
  });
}

export default forwardHandlerExceptionsToNext(batchHandler);
