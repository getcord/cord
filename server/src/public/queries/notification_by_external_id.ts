import { assertViewerHasUser } from 'server/src/auth/index.ts';
import { NotificationEntity } from 'server/src/entity/notification/NotificationEntity.ts';
import { buildNotification } from 'server/src/notifications/fetch.ts';
import { whereAggregatedNotificationEntity } from 'server/src/public/mutations/notifications/utils.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const notificationByExternalIDResolver: Resolvers['Query']['notificationByExternalID'] =
  async (_, args, context) => {
    const userID = assertViewerHasUser(context.session.viewer);
    const externalID = args.externalID;

    const notifEntity = await NotificationEntity.findOne({
      where: {
        externalID,
        recipientID: userID,
      },
    });

    if (!notifEntity) {
      return null;
    }

    // The ID they request might be part of an aggregation, so fetch all of the
    // potential aggregates. In case the ID is an aggregate in the middle of
    // that aggregation, make sure to force the external ID of the result to
    // what was originally asked for, otherwise the result is very confusing.
    const aggregateEntities = await NotificationEntity.findAll({
      where: whereAggregatedNotificationEntity(notifEntity),
    });
    const gqlNotif = await buildNotification(context, aggregateEntities);
    return gqlNotif ? { ...gqlNotif, externalID } : null;
  };
