import type { Request, Response } from 'express';
import { Viewer } from 'server/src/auth/index.ts';
import { NotificationMutator } from 'server/src/entity/notification/NotificationMutator.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { validateExternalID } from 'server/src/public/routes/platform/types.ts';
import {
  ApiCallerError,
  forwardHandlerExceptionsToNext,
} from 'server/src/public/routes/platform/util.ts';
import { validate } from 'server/src/public/routes/platform/validatorFunction.ts';
import { deprecated } from 'server/src/logging/deprecate.ts';

async function createNotificationHandler(req: Request, res: Response) {
  const platformApplicationID = req.appID;

  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_request');
  }

  const {
    actor_id: actorExternalIDsnake,
    actorID: actorExternalIDcamel,
    recipient_id: recipientExternalIDsnake,
    recipientID: recipientExternalIDcamel,
    template,
    url,
    metadata,
    type: _type,
    extraClassnames,
    iconUrl,
    ...rest
  } = validate.CreateNotificationVariables(req.body);

  // Check that all properties in CreateNotificationVariables are destructured
  const _: Record<string, never> = rest;

  if (actorExternalIDsnake) {
    deprecated(
      'snake:CreateNotificationHandler:actor_id',
      platformApplicationID,
    );
  }

  if (recipientExternalIDsnake) {
    deprecated(
      'snake:CreateNotificationHandler:recipient_id',
      platformApplicationID,
    );
  }

  const actorExternalID = actorExternalIDcamel ?? actorExternalIDsnake;
  const recipientExternalID =
    recipientExternalIDcamel ?? recipientExternalIDsnake;

  if (!recipientExternalID) {
    throw new ApiCallerError('invalid_request', {
      message: 'Missing recipientID',
    });
  }

  actorExternalID && validateExternalID(actorExternalID, 'actor');
  validateExternalID(recipientExternalID, 'recipient');

  const [sender, recipient] = await Promise.all([
    actorExternalID
      ? await UserEntity.findOne({
          where: {
            externalID: actorExternalID,
            platformApplicationID,
          },
        })
      : null,
    UserEntity.findOne({
      where: {
        externalID: recipientExternalID,
        platformApplicationID,
      },
    }),
  ]);

  if (req.body.actor_id && !sender) {
    throw new ApiCallerError('invalid_user_id', {
      message: `Invalid recipient user id: ${recipientExternalID}.`,
    });
  }

  if (!recipient) {
    throw new ApiCallerError('invalid_user_id', {
      message: `Invalid recipient user id: ${recipientExternalID}.`,
    });
  }

  if (!sender && template.search('{{ ?actor ?}}') !== -1) {
    throw new ApiCallerError('invalid_field', {
      message: 'Invalid template: must contain {{actor}} variable',
    });
  }

  const mutator = new NotificationMutator(Viewer.createAnonymousViewer());
  const notif = await mutator.createExternal({
    platformApplicationID,
    recipientID: recipient.id,
    senderID: sender?.id,
    externalTemplate: template,
    iconUrl,
    externalURL: url,
    extraClassnames: extraClassnames,
    metadata: metadata,
  });

  // TODO(notifications): hook into existing "outbound" notif infrastructure to
  // send a Slack message and email.

  res.status(200).json({
    success: true,
    message: 'Notification created.',
    notificationID: notif.externalID,
  });
}

export default forwardHandlerExceptionsToNext(createNotificationHandler);
