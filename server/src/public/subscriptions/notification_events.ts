import { pubSubAsyncIterator } from 'server/src/pubsub/index.ts';
import { assertViewerHasUser } from 'server/src/auth/index.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import {
  NotificationAddedTypeName,
  NotificationDeletedTypeName,
  NotificationReadStateUpdatedTypeName,
} from 'common/types/index.ts';
import { withFilter } from 'server/src/public/subscriptions/util/with_filter.ts';

export const notificationEventsSubscriptionResolver: Resolvers['Subscription']['notificationEvents'] =
  {
    resolve: (payload) => payload,
    subscribe: async (_root, args, context) => {
      const { filter } = args;
      const userID = assertViewerHasUser(context.session.viewer);

      return withFilter(
        () =>
          pubSubAsyncIterator(
            // this must map to the NotificationEvents type definition in mapping.ts
            ['notification-added', { userID }],
            ['notification-read-state-updated', { userID }],
            ['notification-deleted', { userID }],
          ),
        async ({ name, payload }) => {
          if (!payload) {
            return false;
          }

          if (name !== 'notification-added') {
            return true;
          }

          const matchesFilter =
            await context.loaders.notificationLoader.notificationMatchesFilter(
              payload.notificationID,
              filter
                ? {
                    metadata: filter.metadata ?? undefined,
                    location: filter.location
                      ? {
                          value: filter.location,
                          partialMatch: !!filter.partialMatch,
                        }
                      : undefined,
                    organizationID: filter.organizationID ?? undefined,
                  }
                : undefined,
            );

          if (!matchesFilter) {
            return false;
          }

          return true;
        },
      )();
    },
  };

export const notificationEventTypeResolver: Resolvers['NotificationEvent'] = {
  __resolveType: (event) => {
    switch (event.name) {
      case 'notification-added':
        return NotificationAddedTypeName;
      case 'notification-read-state-updated':
        return NotificationReadStateUpdatedTypeName;
      case 'notification-deleted':
        return NotificationDeletedTypeName;
    }
  },
};
