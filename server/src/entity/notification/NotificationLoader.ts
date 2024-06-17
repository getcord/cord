import { QueryTypes } from 'sequelize';

import type { NotificationListFilter, UUID } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { NotificationEntity } from 'server/src/entity/notification/NotificationEntity.ts';
import { createNotificationsQueryExpressionsFromFilters } from 'server/src/notifications/fetch.ts';

export class NotificationLoader {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  async loadUnreadNotificationCount(
    userID: UUID,
    filter?: NotificationListFilter,
  ) {
    const {
      bindVariables: partialBind,
      extraJoins,
      extraCondition,
    } = await createNotificationsQueryExpressionsFromFilters({
      filter,
      platformApplicationID: this.viewer.platformApplicationID,
      ltCreatedTimestamp: undefined,
      limit: undefined,
      viewer: this.viewer,
    });

    const bindVariables = [...partialBind, userID];
    const recipientFilter = `WHERE n."recipientID" = $${bindVariables.length}`;

    // To get an unread count correctly aggregated, we count the number of
    // distinct aggregation keys (to only count once the rows which will get
    // aggregated into a single Notification), except we need to count each null
    // aggregation key individually (since null means "do not aggregate", i.e.,
    // we do not aggregate all the nulls together despite them nominally sharing
    // a key).
    const result = await getSequelize().query<{ count: number }>(
      `SELECT COALESCE(
           COUNT(DISTINCT n."aggregationKey") +
             SUM(n."aggregationKey" IS NULL::int),
           0
         )::int AS count
         FROM "cord".notifications as n
         ${extraJoins}
         ${recipientFilter} AND n."readStatus" = 'unread'
         ${extraCondition}
        `,
      { bind: bindVariables, type: QueryTypes.SELECT },
    );

    return result[0].count;
  }

  async notificationMatchesFilter(
    notificationID: UUID,
    filter: NotificationListFilter | undefined,
  ) {
    const {
      bindVariables: partialBind,
      extraJoins,
      extraCondition,
    } = await createNotificationsQueryExpressionsFromFilters({
      filter,
      platformApplicationID: this.viewer.platformApplicationID,
      ltCreatedTimestamp: undefined,
      limit: undefined,
      viewer: this.viewer,
    });
    const bindVariables = [...partialBind, notificationID];
    const idFilter = `WHERE n."id" = $${bindVariables.length}`;

    const notification = await getSequelize().query(
      `
      SELECT n.id
      FROM notifications n
      ${extraJoins}
      ${idFilter}
      ${extraCondition}
      `,
      {
        bind: bindVariables,
        type: QueryTypes.SELECT,
        model: NotificationEntity,
      },
    );

    return notification.length > 0;
  }
}
