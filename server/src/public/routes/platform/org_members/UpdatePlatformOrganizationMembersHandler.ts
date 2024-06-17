import type { Request, Response } from 'express';

import { QueryTypes } from 'sequelize';
import {
  forwardHandlerExceptionsToNext,
  ApiCallerError,
} from 'server/src/public/routes/platform/util.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { AuthProviderType } from 'server/src/auth/index.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import type { UUID } from 'common/types/index.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { validate } from 'server/src/public/routes/platform/validatorFunction.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';
import { restartSomeUserSubscriptions } from 'server/src/public/subscriptions/util/restart_subscription.ts';
import { asyncLocalStorage } from 'server/src/logging/performance.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';

function validateAllContained(ids: string[], users: UserEntity[]) {
  const toFind = new Set<string>(ids);
  for (const p of users) {
    toFind.delete(p.externalID);
  }
  if (toFind.size !== 0) {
    throw new ApiCallerError('user_not_found', {
      // Todo - this doesn't make sense in all the contexts this fn is called
      message: `Platform user ${
        toFind.values().next().value
      } not found. If you wanted to create a new user, add user_details to your request. Refer to https://docs.cord.com/reference/authentication#JSON-user-details for details.`,
    });
  }
}

async function updateOrganizationMembersHandler(req: Request, res: Response) {
  const platformApplicationID = req.appID;
  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_access_token');
  }

  const externalID = req.params.orgID;

  await updateOrganizationMembers(platformApplicationID, externalID, req.body);

  return res.status(200).json({
    success: true,
    message: '✅ You successfully updated group members',
  });
}

export async function updateOrganizationMembers(
  platformApplicationID: UUID,
  externalID: string,
  data: any,
) {
  const org = await OrgEntity.findOne({
    where: {
      externalID,
      externalProvider: AuthProviderType.PLATFORM,
      platformApplicationID,
    },
  });

  if (!org) {
    // Todo - this error doesn't make sense in the context of all the places this fn is used
    throw new ApiCallerError('group_not_found', {
      message: `Platform group ${externalID} not found. If you wanted to create a new group, add group_details to your request. Refer to https://docs.cord.com/reference/authentication#JSON-group-details for details.`,
    });
  }

  const {
    add: origAdd,
    remove: origRemove,
    ...rest
  } = validate.UpdatePlatformGroupMembersVariables(data);
  // Check that all properties are destructured
  const _: Record<string, never> = rest;

  const add = origAdd?.map((member) => member.toString()) ?? []; // Incase numbers exist
  const remove = origRemove?.map((member) => member.toString()) ?? []; // Incase numbers exist

  if (add.some((x) => remove.includes(x))) {
    const duplicated = add.find((x) => remove.includes(x));
    throw new ApiCallerError('invalid_field', {
      message: `Platform member ${duplicated} both added and removed.`,
    });
  }

  const [added, removed] = await getSequelize().transaction(
    async (transaction) => {
      const users = await UserEntity.findAll({
        where: {
          externalID: [...add, ...remove],
          platformApplicationID: org.platformApplicationID,
          externalProvider: AuthProviderType.PLATFORM,
        },
        transaction,
      });

      validateAllContained(add, users);
      validateAllContained(remove, users);

      const usersToAdd = users.filter((user) => add.includes(user.externalID));
      const usersToDelete = users.filter((user) =>
        remove.includes(user.externalID),
      );

      const [insertResult, deleteResult] = await Promise.all([
        usersToAdd.length > 0
          ? // NOTE(flooey): We can't really use bind variables here, which would
            // be safer, but these are internal IDs, so they are always UUIDs and
            // can't cause SQL injection problems
            getSequelize().query(
              `
              INSERT INTO org_members VALUES ${usersToAdd
                .map((user) => `('${user.id}', '${org.id}')`)
                .join(',')}
              ON CONFLICT DO NOTHING
              RETURNING "userID"
            `,
              { transaction, type: QueryTypes.RAW },
            )
          : Promise.resolve([[], 0]),
        usersToDelete.length > 0
          ? getSequelize().query(
              `
          DELETE FROM org_members
            WHERE "orgID" = $1
              AND "userID" = ANY($2)
            RETURNING "userID"
        `,
              {
                transaction,
                type: QueryTypes.RAW,
                bind: [org.id, usersToDelete.map((user) => user.id)],
              },
            )
          : Promise.resolve([[], 0]),
      ]);
      const actuallyAdded = insertResult[0] as { userID: UUID }[];
      const actuallyRemoved = deleteResult[0] as { userID: UUID }[];
      return [
        actuallyAdded.map((u) => u.userID),
        actuallyRemoved.map((u) => u.userID),
      ];
    },
  );

  const operationID = asyncLocalStorage?.getStore()?.operationID;

  anonymousLogger().debug('UpdatePlatformOrganizationMembers stats', {
    appID: platformApplicationID,
    added: added.length,
    removed: removed.length,
    ...(operationID && { operationID }),
  });

  restartSomeUserSubscriptions([...added, ...removed]);

  const app = await ApplicationEntity.findByPk(platformApplicationID);

  // TODO: Temporary load alleviation - Customer '43fdeae8-4b68-4e36-a58d-56085f8e2497'
  // is sending very large updates that overwhelm our pubsub
  if (app?.customerID !== '43fdeae8-4b68-4e36-a58d-56085f8e2497') {
    added.map((userID) => {
      backgroundPromise(publishPubSubEvent('user-identity', { userID }));
      backgroundPromise(
        publishPubSubEvent('org-member-added', { orgID: org.id }, { userID }),
      );
    });
    removed.map((userID) => {
      backgroundPromise(publishPubSubEvent('user-identity', { userID }));
      backgroundPromise(
        publishPubSubEvent('org-member-removed', { orgID: org.id }, { userID }),
      );
    });
  }
}

export default forwardHandlerExceptionsToNext(updateOrganizationMembersHandler);
