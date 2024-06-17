import {
  assertViewerHasPlatformApplicationID,
  assertViewerHasUser,
} from 'server/src/auth/index.ts';
import { NotificationEntity } from 'server/src/entity/notification/NotificationEntity.ts';
import { incCounterWithAppID } from 'server/src/logging/prometheus.ts';
import {
  deletedCounter,
  whereAggregatedNotificationEntity,
} from 'server/src/public/mutations/notifications/utils.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';

export const deleteNotificationResolver: Resolvers['Mutation']['deleteNotification'] =
  async (_, args, context) => {
    const userID = assertViewerHasUser(context.session.viewer);
    const platformApplicationID = assertViewerHasPlatformApplicationID(
      context.session.viewer,
    );

    const notif = args.byExternalID
      ? await NotificationEntity.findOne({
          where: { externalID: args.notificationID, platformApplicationID },
        })
      : await NotificationEntity.findByPk(args.notificationID);

    if (!notif || notif.recipientID !== userID) {
      return {
        success: false,
        failureDetails: { code: '404', message: 'No such notification' },
      };
    }

    const affectedCount = await NotificationEntity.destroy({
      where: whereAggregatedNotificationEntity(notif),
    });

    incCounterWithAppID(
      context.session.viewer,
      deletedCounter,
      {},
      affectedCount,
    );

    backgroundPromise(
      publishPubSubEvent(
        'notification-deleted',
        { userID },
        { notificationID: notif.id },
      ),
    );

    return { success: true, failureDetails: null };
  };
