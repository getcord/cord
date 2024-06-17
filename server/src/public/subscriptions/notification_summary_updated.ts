import { assertViewerHasUser } from 'server/src/auth/index.ts';
import { pubSubAsyncIterator } from 'server/src/pubsub/index.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { withFilter } from 'server/src/public/subscriptions/util/with_filter.ts';
import { withTransformation } from 'server/src/public/subscriptions/util/with_transformation.ts';
import { notificationFilterInputToNotificationListFilter } from 'server/src/public/queries/notification_summary.ts';

export const notificationSummaryUpdatedSubscriptionResolver: Resolvers['Subscription']['notificationSummaryUpdated'] =
  {
    resolve: (payload) => payload,

    subscribe: (_root, args, context) => {
      const userID = assertViewerHasUser(context.session.viewer);

      return withFilter(
        withTransformation(
          () =>
            pubSubAsyncIterator(
              ['notification-added', { userID }],
              ['notification-deleted', { userID }],
              ['notification-read-state-updated', { userID }],
            ),
          ({ payload, name }) => ({
            filter: notificationFilterInputToNotificationListFilter(
              args.filter,
            ),
            payload,
            name,
          }),
        ),
        async ({ filter, name, payload }) => {
          if (!payload) {
            return false;
          }

          if (name !== 'notification-added') {
            return true;
          }

          const matchesFilter =
            await context.loaders.notificationLoader.notificationMatchesFilter(
              payload.notificationID,
              filter,
            );

          if (!matchesFilter) {
            return false;
          }

          return true;
        },
      )();
    },
  };
