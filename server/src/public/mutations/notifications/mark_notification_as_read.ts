import { LogLevel } from 'common/types/index.ts';
import type { UUID } from 'common/types/index.ts';
import {
  assertViewerHasPlatformUser,
  assertViewerHasUser,
} from 'server/src/auth/index.ts';
import { NotificationEntity } from 'server/src/entity/notification/NotificationEntity.ts';
import { incCounterWithAppID } from 'server/src/logging/prometheus.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { createNotificationsQueryExpressionsFromFilters } from 'server/src/notifications/fetch.ts';
import {
  NotificationMutator,
  markedCounter,
} from 'server/src/entity/notification/NotificationMutator.ts';
import { logServerEvent } from 'server/src/entity/event/EventMutator.ts';

export const markNotificationAsReadResolver: Resolvers['Mutation']['markNotificationAsRead'] =
  async (_, args, context) => {
    const { userID, platformApplicationID } = assertViewerHasPlatformUser(
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

    const notificationMutator = new NotificationMutator(context.session.viewer);
    const affectedCount = await notificationMutator.markAsRead(notif);

    logServerEvent({
      session: context.session,
      type: 'notification-mark-as-read',
      logLevel: LogLevel.DEBUG,
      payload: { id: notif.id, type: notif.type, affected: affectedCount },
    });

    return { success: true, failureDetails: null };
  };

export const markNotificationAsUnreadResolver: Resolvers['Mutation']['markNotificationAsUnread'] =
  async (_, args, context) => {
    const { userID, platformApplicationID } = assertViewerHasPlatformUser(
      context.session.viewer,
    );

    const notif = await NotificationEntity.findOne({
      where: { externalID: args.notificationExternalID, platformApplicationID },
    });

    if (!notif || notif.recipientID !== userID) {
      return {
        success: false,
        failureDetails: { code: '404', message: 'No such notification' },
      };
    }

    const notificationMutator = new NotificationMutator(context.session.viewer);
    const affectedCount = await notificationMutator.markAsUnread(notif);

    logServerEvent({
      session: context.session,
      type: 'notification-mark-as-unread',
      logLevel: LogLevel.DEBUG,
      payload: { id: notif.id, type: notif.type, affected: affectedCount },
    });

    return { success: true, failureDetails: null };
  };

export const markAllNotificationsAsReadResolver: Resolvers['Mutation']['markAllNotificationsAsRead'] =
  async (_, args, context) => {
    const userID = assertViewerHasUser(context.session.viewer);
    const readStatus = 'unread';
    const {
      bindVariables: partialBind,
      extraJoins,
      extraCondition,
    } = await createNotificationsQueryExpressionsFromFilters({
      filter: {
        metadata: args.filter?.metadata ?? undefined,
        location: args.filter?.location
          ? {
              value: args.filter.location,
              partialMatch: !!args.filter.partialMatch,
            }
          : undefined,
        organizationID: args.filter?.organizationID ?? undefined,
      },
      platformApplicationID: context.session.viewer.platformApplicationID,
      ltCreatedTimestamp: undefined,
      limit: undefined,
      viewer: context.session.viewer,
    });
    const bindVariables = [...partialBind, userID, readStatus];
    const notificationFilter = `WHERE n."recipientID" = $${
      bindVariables.length - 1
    } AND n."readStatus" = $${bindVariables.length}`;

    const [affectedRows, __]: [{ id: UUID }[], any] =
      (await getSequelize().query(
        `
       UPDATE notifications notifs
       SET "readStatus" = 'read'
       FROM (
        SELECT n.id as id from notifications n 
        ${extraJoins}
        ${notificationFilter}
        ${extraCondition}

       ) as sub
      WHERE notifs.id = sub.id
       RETURNING notifs."id";`,
        {
          bind: bindVariables,
        },
      )) as [any[], any];

    backgroundPromise(
      Promise.all(
        affectedRows.map((row) =>
          publishPubSubEvent(
            'notification-read-state-updated',
            { userID },
            { notificationID: row.id },
          ),
        ),
      ),
      context.logger,
    );

    incCounterWithAppID(
      context.session.viewer,
      markedCounter,
      {},
      affectedRows.length,
    );

    return { success: true, failureDetails: null };
  };
