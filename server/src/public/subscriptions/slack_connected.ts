import { assertViewerHasUser } from 'server/src/auth/index.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { LinkedUsersEntity } from 'server/src/entity/linked_users/LinkedUsersEntity.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import { liveQueryWithRestartEvent } from 'server/src/public/subscriptions/util/restart_subscription.ts';

export const SlackConnectedLiveQueryResolver: Resolvers['Subscription']['slackConnectedLiveQuery'] =
  {
    resolve: (value) => value,
    subscribe: async (_root, args, context) => {
      const userID = assertViewerHasUser(context.session.viewer);
      const orgID = args.orgID;
      return await liveQueryWithRestartEvent({
        events: [
          ['org-member-removed', { orgID }],
          ['org-member-added', { orgID }],
          ['org-user-identity', { orgID }],
        ],
        initialData: async () => {
          return await isSlackConnected(context, userID, orgID);
        },
        eventData: async (_event) => {
          return await isSlackConnected(context, userID, orgID);
        },
        subscriptionName: 'SlackConnectedLiveQueryResolver',
        userID,
      });
    },
  };

async function isSlackConnected(
  context: RequestContext,
  userID: string,
  orgID: string,
) {
  const org = await context.loaders.orgLoader.loadOrg(orgID);
  const response = {
    isOrgConnected: false,
    isUserConnected: false,
  };

  if (!org) {
    return response;
  }

  const linkedOrg = await org.getLinkedOrg();

  if (!linkedOrg) {
    return response;
  }

  response.isOrgConnected = true;

  // Check if the user is linked
  const linkedUser = await LinkedUsersEntity.findOne({
    where: {
      sourceOrgID: org.id,
      linkedOrgID: linkedOrg.id,
      sourceUserID: userID,
    },
  });
  response.isUserConnected = Boolean(linkedUser);

  return response;
}
