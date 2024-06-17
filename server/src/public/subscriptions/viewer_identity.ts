import { assertViewerHasUser } from 'server/src/auth/index.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { liveQueryWithRestartEvent } from 'server/src/public/subscriptions/util/restart_subscription.ts';
import { withThrottle } from 'server/src/public/subscriptions/util/with_throttle.ts';

const THROTTLE_MS = 1000;

export const viewerIdentityLiveQueryResolver: Resolvers['Subscription']['viewerIdentityLiveQuery'] =
  {
    resolve: (value) => value,
    subscribe: async (_root, _args, context) => {
      const userID = assertViewerHasUser(context.session.viewer);
      const iterable = await liveQueryWithRestartEvent({
        events: [['user-identity', { userID }]],
        initialData: () => ({}),
        eventData: (_event) => ({}),
        userID,
        subscriptionName: 'viewerIdentityLiveQueryResolver',
      });
      return withThrottle(
        () => iterable[Symbol.asyncIterator](),
        THROTTLE_MS,
      )();
    },
  };
