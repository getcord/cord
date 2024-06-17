import { Errors } from 'common/const/Errors.ts';
import { assertViewerHasUser } from 'server/src/auth/index.ts';

import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { ClientFacingError } from 'server/src/util/ClientFacingError.ts';

export const notificationSummaryResolver: Resolvers['NotificationSummary'] = {
  unreadNotificationCount: async ({ filter }, _args, context) => {
    const userID = assertViewerHasUser(context.session.viewer);

    const filterGroupID = filter?.groupID ?? filter?.organizationID;
    if (filterGroupID) {
      const userCanAccess =
        await context.loaders.orgMembersLoader.viewerCanAccessOrgExternalID(
          filterGroupID,
        );

      if (!userCanAccess) {
        throw new ClientFacingError(Errors.USER_NOT_IN_GROUP);
      }
    }
    return await context.loaders.notificationLoader.loadUnreadNotificationCount(
      userID,
      {
        metadata: filter?.metadata ?? undefined,
        location: filter?.location ?? undefined,
        organizationID: filter?.organizationID ?? undefined,
      },
    );
  },
};
