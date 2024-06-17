import { QueryTypes } from 'sequelize';
import {
  assertViewerHasOrgs,
  assertViewerHasUser,
} from 'server/src/auth/index.ts';
import type {
  Resolvers,
  UserLiveQueryData,
} from 'server/src/schema/resolverTypes.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { liveQueryWithRestartEvent } from 'server/src/public/subscriptions/util/restart_subscription.ts';
import { withThrottle } from 'server/src/public/subscriptions/util/with_throttle.ts';

const THROTTLE_MS = 2000;

export const userLiveQueryResolver: Resolvers['Subscription']['userLiveQuery'] =
  {
    resolve: (data) => data,
    subscribe: async (_root, args, context) => {
      // Don't assert we have this, because we almost always do except for
      // admin.cord.com, where we log in as Slack users and this is null. But in
      // that case the user updates we're looking for are *also* Slack users,
      // who *also* have a null platform app ID, so it's fine to pass through to
      // the query.
      const platformApplicationID =
        context.session.viewer.platformApplicationID ?? null;

      const userID = assertViewerHasUser(context.session.viewer);
      const orgIDs = assertViewerHasOrgs(context.session.viewer);
      const iterable = await liveQueryWithRestartEvent({
        events: orgIDs.map((orgID) => ['org-user-identity', { orgID }]),
        initialData: async (): Promise<UserLiveQueryData> => {
          return {
            users: args.since
              ? // Find every active user that's been updated since the given
                // timestamp
                await context.sequelize.query<UserEntity>(
                  `
                  SELECT users.* FROM users, org_members
                  WHERE users."updatedTimestamp" >= $1
                    AND users.state != 'deleted'
                    AND users.id = org_members."userID"
                    AND users."platformApplicationID" = $2
                    AND org_members."orgID" = ANY($3)
                    LIMIT 1000;
                `,
                  {
                    bind: [new Date(args.since), platformApplicationID, orgIDs],
                    type: QueryTypes.SELECT,
                    model: UserEntity,
                  },
                )
              : [],
            upto: new Date().getTime(),
          };
        },
        eventData: async (event): Promise<UserLiveQueryData> => {
          const user = await context.loaders.userLoader.loadUserInAnyViewerOrg(
            event.payload.userID,
          );
          return {
            users: user ? [user] : [],
            upto: new Date().getTime(),
          };
        },
        userID,
        subscriptionName: 'userLiveQueryResolver',
      });

      return withThrottle(
        () => iterable[Symbol.asyncIterator](),
        THROTTLE_MS,
        // If this is an update about a single user, throttle it, otherwise let
        // it through (by returning a unique symbol) since we don't ever want to
        // skip an empty or multi-user update
        (data) => (data.users.length === 1 ? data.users[0].id : Symbol()),
      )();
    },
  };
