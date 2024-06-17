import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import {
  PageThreadAddedTypeName,
  ThreadFilterablePropertiesMatchTypeName,
  ThreadFilterablePropertiesUnmatchTypeName,
  PageThreadDeletedTypename,
} from 'common/types/index.ts';
import {
  assertViewerHasOrgs,
  assertViewerHasUser,
} from 'server/src/auth/index.ts';
import { withFilter } from 'server/src/public/subscriptions/util/with_filter.ts';
import { withRestartEvent } from 'server/src/public/subscriptions/util/restart_subscription.ts';
import { withTransformation } from 'server/src/public/subscriptions/util/with_transformation.ts';
import { updateMightBeRelevant } from 'server/src/entity/thread/ThreadLoader.ts';
import type { ThreadCollectionFilter } from 'server/src/entity/thread/ThreadLoader.ts';
import type { PubSubEvent } from 'server/src/pubsub/index.ts';

export const pageEventsWithLocationSubscriptionResolver: Resolvers['Subscription']['pageEventsWithLocation'] =
  {
    resolve: (payload) => payload,
    subscribe: async (_root, args, context) => {
      const orgIDs = assertViewerHasOrgs(context.session.viewer);
      const userID = assertViewerHasUser(context.session.viewer);
      const filter: ThreadCollectionFilter = {
        location: args.location ?? undefined,
        partialMatch: args.partialMatch ?? undefined,
        metadata: args.filter?.metadata ?? undefined,
        viewer: args.filter?.viewer ?? undefined,
        resolved: args.resolved ?? undefined,
      };
      return withFilter(
        withTransformation(
          withRestartEvent({
            events: orgIDs.flatMap(
              (orgID) =>
                [
                  ['page-thread-added-with-location', { orgID }],
                  ['thread-filterable-properties-updated', { orgID }],
                  ['page-thread-deleted', { orgID }],
                ] as const,
            ),
            userID,
            subscriptionName: 'pageEventsWithLocationSubscriptionResolver',
          }),
          async ({ payload, name }) => {
            if (name !== 'thread-filterable-properties-updated') {
              return { payload, name };
            }

            return {
              payload,
              name,
              matchedFilters:
                await context.loaders.threadLoader.threadMatchesFilter(
                  payload.threadID,
                  filter,
                ),
            };
          },
        ),
        async ({ name, payload }) => {
          if (!payload) {
            return false;
          }

          if (name === 'thread-filterable-properties-updated') {
            return updateMightBeRelevant(
              context.logger,
              filter,
              payload as PubSubEvent<'thread-filterable-properties-updated'>['payload'],
              userID,
            );
          }

          if (name === 'page-thread-deleted') {
            return true;
          }

          return await context.loaders.threadLoader.threadMatchesFilter(
            payload.threadID,
            filter,
          );
        },
      )();
    },
  };

export const pageEventTypeResolver: Resolvers['PageEvent'] = {
  __resolveType: (event) => {
    switch (event.name) {
      case 'page-thread-added-with-location':
        return PageThreadAddedTypeName;
      case 'page-thread-deleted':
        return PageThreadDeletedTypename;
      case 'thread-filterable-properties-updated':
        // If you want to use this, make sure you transform the data to get
        // this key. See example in page_events_with_location
        if ('matchedFilters' in event && event['matchedFilters']) {
          return ThreadFilterablePropertiesMatchTypeName;
        } else {
          return ThreadFilterablePropertiesUnmatchTypeName;
        }
    }
  },
};
