import type { Request, Response } from 'express';
import { NotificationEntity } from 'server/src/entity/notification/NotificationEntity.ts';
import {
  deletedCounter,
  whereAggregatedNotificationEntity,
} from 'server/src/public/mutations/notifications/utils.ts';
import {
  ApiCallerError,
  forwardHandlerExceptionsToNext,
} from 'server/src/public/routes/platform/util.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';

async function deleteNotificationHandler(req: Request, res: Response) {
  const platformApplicationID = req.appID;

  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_request');
  }

  const notif = await NotificationEntity.findOne({
    where: { platformApplicationID, externalID: req.params.notificationID },
  });
  if (!notif) {
    throw new ApiCallerError('notification_not_found');
  }

  const affectedCount = await NotificationEntity.destroy({
    where: whereAggregatedNotificationEntity(notif),
  });

  deletedCounter.inc({ appID: platformApplicationID }, affectedCount);

  backgroundPromise(
    publishPubSubEvent(
      'notification-deleted',
      { userID: notif.recipientID },
      { notificationID: notif.id },
    ),
  );

  res.status(200).json({
    success: true,
    message: `💀 You successfully deleted notification ${req.params.notificationID}`,
  });
}

export default forwardHandlerExceptionsToNext(deleteNotificationHandler);
