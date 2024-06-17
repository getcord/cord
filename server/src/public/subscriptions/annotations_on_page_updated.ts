import { toPageContext } from 'common/types/index.ts';
import {
  assertViewerHasIdentity,
  assertViewerHasOrg,
  assertViewerHasUser,
} from 'server/src/auth/index.ts';
import { getAnnotationsOnPage } from 'server/src/public/queries/annotations_on_page.ts';
import { withRestartEvent } from 'server/src/public/subscriptions/util/restart_subscription.ts';
import type { PubSubEvent } from 'server/src/pubsub/index.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { getPageContextHash } from 'server/src/util/hash.ts';

export const annotationsOnPageUpdatedSubscriptionResolver: Resolvers['Subscription']['annotationsOnPageUpdated'] =
  {
    resolve: (
      event: PubSubEvent<'annotations-on-page-updated'>,
      args,
      context,
    ) => {
      const { orgID, userID } = assertViewerHasIdentity(context.session.viewer);
      return getAnnotationsOnPage(
        context,
        event.args.pageContextHash,
        userID,
        orgID,
        args.includeDeleted ?? false,
      );
    },

    subscribe: async (_root, args, context) => {
      const userID = assertViewerHasUser(context.session.viewer);
      const orgID = assertViewerHasOrg(context.session.viewer);
      const [pageContextHash] = getPageContextHash(
        toPageContext(args.pageContext),
      );
      return withRestartEvent({
        events: [['annotations-on-page-updated', { orgID, pageContextHash }]],
        userID,
        subscriptionName: 'annotationsOnPageUpdatedSubscriptionResolver',
      })();
    },
  };
