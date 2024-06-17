import { assertViewerHasUser } from 'server/src/auth/index.ts';
import { NotificationEntity } from 'server/src/entity/notification/NotificationEntity.ts';
import { buildNotification } from 'server/src/notifications/fetch.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const notificationReadStateUpdatedResolver: Resolvers['NotificationReadStateUpdated'] =
  {
    notification: async ({ payload: { notificationID } }, _, context) => {
      assertViewerHasUser(context.session.viewer);

      const notificationEntity =
        await NotificationEntity.findByPk(notificationID);

      if (!notificationEntity) {
        throw new Error(
          `Notification not found despite receiving subscription event ${notificationID}`,
        );
      }

      const notification = await buildNotification(context, [
        notificationEntity,
      ]);

      if (!notification) {
        throw new Error(
          `Something went wrong when preparing notification for NotificationEntity ${notificationID}`,
        );
      }

      return notification;
    },
  };
