import { assertViewerHasUser } from 'server/src/auth/index.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { withRestartEvent } from 'server/src/public/subscriptions/util/restart_subscription.ts';

export const inboxSubscriptionResolver: Resolvers['Subscription']['inbox'] = {
  resolve: async (_, _args, context) => {
    assertViewerHasUser(context.session.viewer);
    return {};
  },
  subscribe: (_root, _args, context) => {
    const userID = assertViewerHasUser(context.session.viewer);
    return withRestartEvent({
      events: [['inbox-updated', { userID }]],
      userID,
      subscriptionName: 'inboxSubscriptionResolver',
    })();
  },
};
