import type { Request, Response } from 'express';
import { assertViewerHasUser } from 'server/src/auth/index.ts';
import {
  forwardHandlerExceptionsToNext,
  ApiCallerError,
} from 'server/src/public/routes/platform/util.ts';
import { assertRequestHasContext } from 'server/src/RequestContext.ts';
import { executeViewerIdentityQuery } from 'server/src/schema/operations.ts';
import type { ViewerUserData } from '@cord-sdk/types';
import { userToUserData } from 'common/util/convertToExternal/user.ts';
import { NOTIFICATION_CHANNELS } from 'common/const/UserPreferenceKeys.ts';
import { defaultNotificationPreference } from 'common/util/notifications.ts';
import type { NotificationChannels } from 'common/types/index.ts';

async function getClientViewerHandler(req: Request, res: Response) {
  const context = assertRequestHasContext(req);
  const userID = assertViewerHasUser(context.session.viewer);

  const user = await context.loaders.userLoader.loadUser(userID);

  if (!user) {
    throw new ApiCallerError('user_not_found', { code: 404 });
  }

  const [data, loadedPreferences] = await Promise.all([
    executeViewerIdentityQuery({
      context,
      variables: {
        _externalOrgID: undefined,
      },
    }),
    context.loaders.userPreferenceLoader.loadPreferenceValueForViewer<NotificationChannels>(
      NOTIFICATION_CHANNELS,
    ),
  ]);

  const identity = data.viewerIdentity;
  const preferences = {
    ...defaultNotificationPreference,
    ...loadedPreferences,
  };

  const result: ViewerUserData = {
    ...userToUserData(identity.user),
    organizationID: identity.organization?.externalID ?? null,
    groupID: identity.organization?.externalID ?? null,
    notificationPreferences: {
      sendViaEmail: preferences.email,
      sendViaSlack: preferences.slack,
    },
    isSlackConnected: identity.isSlackConnected,
    organizationIsSlackConnected: Boolean(
      identity.organization?.linkedOrganization,
    ),
    groupIsSlackConnected: Boolean(identity.organization?.linkedOrganization),
    groups: identity.organizations.map((org) => org.externalID),
  };

  return res.status(200).json(result);
}

export default forwardHandlerExceptionsToNext(getClientViewerHandler);
