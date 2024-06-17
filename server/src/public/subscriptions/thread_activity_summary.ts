import { toPageContext } from 'common/types/index.ts';
import {
  assertViewerHasOrgs,
  assertViewerHasUser,
} from 'server/src/auth/index.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { withFilter } from 'server/src/public/subscriptions/util/with_filter.ts';
import { withThrottle } from 'server/src/public/subscriptions/util/with_throttle.ts';
import { withRestartEvent } from 'server/src/public/subscriptions/util/restart_subscription.ts';
import { updateMightBeRelevant } from 'server/src/entity/thread/ThreadLoader.ts';
import type { ThreadCollectionFilter } from 'server/src/entity/thread/ThreadLoader.ts';
import type { PubSubEvent } from 'server/src/pubsub/index.ts';

const ACTIVITY_THROTTLE_MS = 500;

export const threadActivitySummarySubscriptionResolver: Resolvers['Subscription']['threadActivitySummary'] =
  {
    subscribe: async (_root, args, context) => {
      const userID = assertViewerHasUser(context.session.viewer);
      const orgIDs = assertViewerHasOrgs(context.session.viewer);
      const filter: ThreadCollectionFilter = {
        location: toPageContext(args.pageContext)?.data,
        partialMatch: args.partialMatch ?? undefined,
        metadata: args.metadata ?? undefined,
        viewer: args.viewer ?? undefined,
        resolved: args.resolved ?? undefined,
      };

      return withThrottle(
        withFilter(
          withRestartEvent({
            events: [
              ...orgIDs.flatMap(
                (orgID) =>
                  [
                    ['page-thread-added-with-location', { orgID }],
                    ['thread-filterable-properties-updated', { orgID }],
                  ] as const,
              ),
              ['inbox-updated', { userID }],
            ],
            userID,
            subscriptionName: 'threadActivitySummarySubscriptionResolver',
          }),
          async ({ payload, name }) => {
            if (!payload || !('threadID' in payload)) {
              if (name !== 'inbox-updated') {
                context.logger.error(
                  `Unexpected empty payload for event ${name}`,
                );
              }
              return true;
            }
            if (name === 'thread-filterable-properties-updated') {
              return updateMightBeRelevant(
                context.logger,
                filter,
                payload as PubSubEvent<'thread-filterable-properties-updated'>['payload'],
                userID,
              );
            }

            return await context.loaders.threadLoader.threadMatchesFilter(
              payload.threadID,
              filter,
            );
          },
        ),
        ACTIVITY_THROTTLE_MS,
      )();
    },

    resolve: (_root, args, context) =>
      context.loaders.threadLoader.loadThreadActivitySummary({
        location: toPageContext(args.pageContext)?.data,
        partialMatch: args.partialMatch ?? undefined,
        metadata: args.metadata ?? undefined,
        viewer: args.viewer ?? undefined,
        resolved: args.resolved ?? undefined,
      }),
  };
