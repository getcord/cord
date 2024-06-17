import type { Request, Response } from 'express';

import type { NotificationPreferences } from '@cord-sdk/types';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import {
  ApiCallerError,
  forwardHandlerExceptionsToNext,
} from 'server/src/public/routes/platform/util.ts';
import { UserPreferenceEntity } from 'server/src/entity/user_preference/UserPreferenceEntity.ts';
import { NOTIFICATION_CHANNELS } from 'common/const/UserPreferenceKeys.ts';
import type { NotificationChannels } from 'common/types/index.ts';
import { defaultNotificationPreference } from 'common/util/notifications.ts';

async function listUserPreferencesHandler(req: Request, res: Response) {
  const platformApplicationID = req.appID;

  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_request');
  }

  const user = await UserEntity.findOne({
    where: { platformApplicationID, externalID: req.params.userID },
  });
  if (!user) {
    throw new ApiCallerError('user_not_found');
  }

  const preference = await UserPreferenceEntity.findOne({
    where: { userID: user.id, key: NOTIFICATION_CHANNELS },
  });

  const value = preference?.value as NotificationChannels;
  const notificationPreferences: NotificationPreferences = preference?.value
    ? {
        sendViaEmail: !!value.email,
        sendViaSlack: !!value.slack,
      }
    : {
        sendViaSlack: defaultNotificationPreference.slack,
        sendViaEmail: defaultNotificationPreference.email,
      };
  return res
    .status(200)
    .json({ [NOTIFICATION_CHANNELS]: notificationPreferences });
}

export default forwardHandlerExceptionsToNext(listUserPreferencesHandler);
