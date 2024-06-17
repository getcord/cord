import { assertViewerHasUser } from 'server/src/auth/index.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { liveQuery } from 'server/src/public/subscriptions/util/live_query.ts';
import type { JsonObjectReducerData } from 'common/util/jsonObjectReducer.ts';
import { UserPreferenceEntity } from 'server/src/entity/user_preference/UserPreferenceEntity.ts';

export const preferencesLiveQuerySubscriptionResolver: Resolvers['Subscription']['preferencesLiveQuery'] =
  {
    resolve: (parent) => parent,

    subscribe: (_root, _args, context) => {
      const userID = assertViewerHasUser(context.session.viewer);

      return liveQuery(
        [['user-preference-updated', { userID }]],
        async (): Promise<JsonObjectReducerData> => {
          // This is on connection, send down all the preferences
          const rows = await UserPreferenceEntity.findAll({
            where: { userID },
          });

          return {
            data: Object.fromEntries(
              rows.map(({ key, value }) => [key, value]),
            ),
          };
        },
        async (event): Promise<JsonObjectReducerData> => {
          // This is an update, so send just the diff
          const key = event.payload.key;

          const row = await UserPreferenceEntity.findOne({
            where: {
              userID,
              key,
            },
          });

          if (row) {
            return {
              update: { [row.key]: row.value },
            };
          } else {
            return {
              delete: [key],
            };
          }
        },
      );
    },
  };
