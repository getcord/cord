import type { Request, Response } from 'express';

import {
  forwardHandlerExceptionsToNext,
  ApiCallerError,
} from 'server/src/public/routes/platform/util.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import type { NotificationChannels } from 'common/types/index.ts';
import { validate } from 'server/src/public/routes/platform/validatorFunction.ts';
import { UserPreferenceMutator } from 'server/src/entity/user_preference/UserPreferenceMutator.ts';
import { NOTIFICATION_CHANNELS } from 'common/const/UserPreferenceKeys.ts';
import { createViewerAndContext } from 'server/src/util/createViewerAndContext.ts';

async function updateUserPreferencesHanlder(req: Request, res: Response) {
  const platformApplicationID = req.appID;
  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_access_token');
  }

  const externalID = req.params.userID;

  const { key, value, ...rest } = validate.UpdateUserPreferenceVariables(
    req.body,
  );
  // Check that all properties are destructured
  const _: Record<string, never> = rest;

  if (key !== NOTIFICATION_CHANNELS) {
    throw new ApiCallerError('invalid_field', {
      message: 'The only valid key for now is "notification_channels".',
    });
  }

  const user = await UserEntity.findOne({
    where: {
      externalID,
      platformApplicationID,
    },
  });
  if (!user) {
    throw new ApiCallerError('user_not_found');
  }

  const context = await createViewerAndContext(
    platformApplicationID,
    user,
    'api',
  );
  const notificationChannels: Partial<NotificationChannels> = {
    ...(value.sendViaEmail !== undefined && { email: value.sendViaEmail }),
    ...(value.sendViaSlack !== undefined && { slack: value.sendViaSlack }),
  };
  await new UserPreferenceMutator(context.session.viewer).setPreferenceForUser(
    user.id,
    key,
    notificationChannels,
  );

  return res.status(200).json({
    success: true,
    message: `✅ You successfully updated user ${externalID} preferences`,
  });
}

export default forwardHandlerExceptionsToNext(updateUserPreferencesHanlder);
