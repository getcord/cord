import type { Attributes, WhereOptions } from 'sequelize';
import type { NotificationEntity } from 'server/src/entity/notification/NotificationEntity.ts';
import { Counter } from 'server/src/logging/prometheus.ts';

export const deletedCounter = Counter({
  name: 'NotificationEntityDeleted',
  help: 'Count of NotificationEntity deleted',
  labelNames: ['appID'],
});

/**
 * Since NotificationEntity rows with an aggregation key are
 * aggregated/displayed as one Notification in the UI, if the user does
 * something to that Notification (e.g., marks it as read or deletes it), we
 * need to do that thing to all of the NotificationEntity rows which might go
 * into it. This generates a sequelize `where` clause which finds all such rows.
 */
export function whereAggregatedNotificationEntity(
  notif: NotificationEntity,
): WhereOptions<Attributes<NotificationEntity>> {
  return notif.aggregationKey === null
    ? { id: notif.id }
    : {
        aggregationKey: notif.aggregationKey,
        recipientID: notif.recipientID,
      };
}
