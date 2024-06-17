import {
  assertViewerHasPlatformApplicationID,
  assertViewerHasUser,
} from 'server/src/auth/index.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import {
  OrgMemberAddedTypeName,
  OrgMemberRemovedTypeName,
} from 'common/types/index.ts';
import { withRestartEvent } from 'server/src/public/subscriptions/util/restart_subscription.ts';

export const orgMembersUpdatedSubscriptionResolver: Resolvers['Subscription']['orgMembersByExternalIDUpdated'] =
  {
    resolve: (payload) => payload,
    subscribe: async (_root, { externalOrgID }, context) => {
      const platformApplicationID = assertViewerHasPlatformApplicationID(
        context.session.viewer,
      );

      const userID = assertViewerHasUser(context.session.viewer);

      const org = await context.loaders.orgLoader.loadPlatformOrg(
        platformApplicationID,
        externalOrgID,
      );

      if (!org) {
        throw new Error('Org not found');
      }

      return withRestartEvent({
        // this must map to the OrgMemberEvent type definition in mapping.ts
        events: [
          ['org-member-added', { orgID: org.id }],
          ['org-member-removed', { orgID: org.id }],
        ],
        userID,
        subscriptionName: 'orgMembersUpdatedSubscriptionResolver',
      })();
    },
  };

export const orgMemberEventTypeResolver: Resolvers['OrgMemberEvent'] = {
  __resolveType: (event) => {
    switch (event.name) {
      case 'org-member-added':
        return OrgMemberAddedTypeName;
      case 'org-member-removed':
        return OrgMemberRemovedTypeName;
    }
  },
};
