import { QueryTypes } from 'sequelize';
import { buildThreadActionNotification } from 'server/src/notifications/types/thread_action.ts';
import { getLocationFilter } from 'common/types/index.ts';
import type { UUID, NotificationListFilter } from 'common/types/index.ts';
import type { Notification } from 'server/src/schema/resolverTypes.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import { NotificationEntity } from 'server/src/entity/notification/NotificationEntity.ts';
import type {
  NotificationType,
  SpecificNotificationEntity,
} from 'server/src/entity/notification/NotificationEntity.ts';
import { buildExternalNotification } from 'server/src/notifications/types/external.ts';
import { buildReactionNotification } from 'server/src/notifications/types/reaction.ts';
import { buildReplyNotification } from 'server/src/notifications/types/reply.ts';
import { Counter, incCounterWithAppID } from 'server/src/logging/prometheus.ts';
import { isNotNull } from 'common/util/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { assertViewerHasUser } from 'server/src/auth/index.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { ApiCallerError } from 'server/src/public/routes/platform/util.ts';
import { OrgMembersLoader } from 'server/src/entity/org_members/OrgMembersLoader.ts';

const fetchedCounter = Counter({
  name: 'NotificationEntityFetched',
  help: 'Count of NotificationEntity fetched by notificationsResolver',
  labelNames: ['appID', 'type'],
});

const sentCounter = Counter({
  name: 'NotificationSentToClient',
  help: 'Count of GraphQL Notification objects returned to client from notificationsResolver',
  labelNames: ['appID'],
});

export async function fetchAndBuildNotifications(
  context: RequestContext,
  {
    ltCreatedTimestamp,
    limit,
    filter,
  }: {
    ltCreatedTimestamp: Date | undefined;
    limit: number | undefined;
    filter: NotificationListFilter | undefined;
  },
): Promise<{ entities: NotificationEntity[]; nodes: Notification[] }> {
  const userID = assertViewerHasUser(context.session.viewer);
  const {
    bindVariables: partialBind,
    extraJoins,
    extraCondition,
    limitCondition,
  } = await createNotificationsQueryExpressionsFromFilters({
    ltCreatedTimestamp,
    limit,
    filter,
    platformApplicationID: context.session.viewer.platformApplicationID,
    viewer: context.session.viewer,
  });
  const bindVariables = [...partialBind, userID];
  const recipientFilter = `WHERE n."recipientID" = $${bindVariables.length}`;

  const entities = await getSequelize().query(
    `
    SELECT n.*
    FROM notifications n
    ${extraJoins}
    ${recipientFilter}
    ${extraCondition}
    ORDER BY n."createdTimestamp" DESC
    ${limitCondition};`,
    {
      bind: bindVariables,
      type: QueryTypes.SELECT,
      model: NotificationEntity,
    },
  );

  entities.forEach((e) =>
    incCounterWithAppID(context.session.viewer, fetchedCounter, {
      type: e.type,
    }),
  );

  const aggregatedEntities = aggregateNotificationEntities(entities);

  const maybeNodes = await Promise.all(
    Array.from(aggregatedEntities.values()).map((notifEntities) =>
      buildNotification(context, notifEntities),
    ),
  );

  const nodes = maybeNodes.filter(isNotNull);
  incCounterWithAppID(context.session.viewer, sentCounter, {}, nodes.length);
  return { entities, nodes };
}

export async function buildNotification(
  context: RequestContext,
  notifs: NotificationEntity[],
): Promise<Notification | null> {
  try {
    // Unfortunately we can't move assertCorrectAggregation out here, because
    // being inside the switch affects TypeScript's type inference. Fundamentally
    // the type inference isn't smart enough to express what we want (some way to
    // tie the type of notifs[0].type to the type of *all* of notifs) so we do it
    // this way.
    const ty = notifs[0].type;
    switch (ty) {
      case 'reply':
        assertCorrectAggregation(notifs, ty);
        return await buildReplyNotification(context, notifs[0]);
      case 'reaction':
        assertCorrectAggregation(notifs, ty);
        return await buildReactionNotification(context, notifs);
      case 'external':
        assertCorrectAggregation(notifs, ty);
        return await buildExternalNotification(context, notifs[0]);
      case 'thread_action':
        assertCorrectAggregation(notifs, ty);
        return await buildThreadActionNotification(context, notifs[0]);
      default: {
        // Force a TypeScript error if we forgot a case above (so if you get an
        // error here, you forgot a case above). So the only way we ever get
        // here is if the server and the DB disagree about valid notif types
        // (e.g., when switching branches locally, or after a prod revert or
        // similar).
        const _: never = ty;
        throw new Error('Invalid notification type: ' + ty);
      }
    }
  } catch (e) {
    context.logger.logException('Failed to create notification', e, {
      notifID: notifs[0].id,
      notifType: notifs[0].type,
      userID: context.session.viewer.userID,
    });
    return null;
  }
}

function aggregateNotificationEntities(notifs: NotificationEntity[]) {
  // The Map type maintains insertion order, which is important to maintain
  // proper sorting. Assuming notifs is passed sorted in reverse chronological
  // order, this will mean aggregated notifications will end up in the list at
  // the timestamp of the newest notification, which is what we want.
  const m = new Map<UUID, NotificationEntity[]>();

  notifs.forEach((n) => {
    // For notifications with a null aggregation key, do not aggregate them,
    // i.e., pick a unique key (their id) which will never show up again.
    const key = n.aggregationKey ?? n.id;
    if (!m.has(key)) {
      m.set(key, []);
    }
    m.get(key)!.push(n);
  });

  return m;
}

const aggregates: { [x in NotificationType]?: boolean } = {
  reaction: true,
};

function assertCorrectAggregation<T extends NotificationType>(
  notifs: NotificationEntity[],
  ty: T,
): asserts notifs is SpecificNotificationEntity<T>[] {
  if (notifs.length > 1 && !aggregates[ty]) {
    throw new Error(
      `Notification type ${ty} should not be aggregated (has ${notifs.length})`,
    );
  }

  notifs.forEach((n) => {
    if (n.type !== ty) {
      throw new Error(
        `Invalid aggregation of ${ty}, found unexpected ${n.type}`,
      );
    }
  });
}

/**
 * @description Function to create SQL expressions from the provided notifications filters.
 * Since we need multiple joins and expressions to parse the filters and we fetch
 * notifications from multiple places, we can just use this instead of duplicating the code.
 *
 * @note this code assumes that the notifications table has been aliased to `n` in the main query.
 */
export async function createNotificationsQueryExpressionsFromFilters({
  ltCreatedTimestamp,
  limit,
  filter,
  platformApplicationID,
  viewer,
}: {
  ltCreatedTimestamp: Date | undefined;
  limit: number | undefined;
  filter: NotificationListFilter | undefined;
  platformApplicationID: string | undefined;
  viewer: Viewer;
}) {
  const bindVariables = [];
  // make sure we don't return notifications for deleted messages
  const extraConditions = ['m."deletedTimestamp" IS NULL'];
  // only create the joins if we need them
  let extraJoins = '';

  if (ltCreatedTimestamp) {
    bindVariables.push(JSON.stringify(ltCreatedTimestamp));
    extraConditions.push(
      `n."createdTimestamp" < $${bindVariables.length}::timestamp`,
    );
  }

  if (filter?.metadata) {
    bindVariables.push(JSON.stringify(filter?.metadata));
    extraConditions.push(`n."metadata" @> $${bindVariables.length}::jsonb`);
  }

  // since reaction notifications do not have a message ID, we
  // have to join on the message_reactions table to get the message id then
  // join on messages to get the org id for the filter
  extraJoins = `
      LEFT JOIN message_reactions mr ON n."reactionID" = mr.id
      LEFT JOIN messages m ON CASE 
        WHEN n."messageID" IS NULL THEN mr."messageID"
        ELSE n."messageID" END = m.id`;

  const orgMembersLoader = new OrgMembersLoader(viewer);
  const orgIDs = await orgMembersLoader.loadAllImmediateOrgIDsForUser();

  if (orgIDs.length === 0) {
    throw new ApiCallerError('group_not_found');
  }
  if (filter?.groupID || filter?.organizationID) {
    const org = await OrgEntity.findOne({
      where: {
        externalID: filter.groupID ?? filter.organizationID,
        platformApplicationID,
      },
    });
    if (!org) {
      throw new ApiCallerError('group_not_found');
    }

    if (!orgIDs.includes(org.id)) {
      throw new ApiCallerError('group_not_found');
    }
    bindVariables.push(org.id);
    extraConditions.push(
      `((m."orgID" = $${bindVariables.length} AND n."type" != 'external') OR n."type" = 'external')`,
    );
  } else {
    // We still want to only get notifications that the user can see, if any are type reply or reaction then
    // we also check the orgID. If they are type external then we do not check the org.
    bindVariables.push(orgIDs);
    extraConditions.push(
      `((m."orgID" = ANY($${bindVariables.length}) AND n."type" != 'external') OR n."type" = 'external')`,
    );
  }

  const locationFilter = getLocationFilter(filter?.location);
  if (locationFilter) {
    // We have to join on all the tables as in the org join above
    // to get thread data which contains pageContextHash.

    // As a result, if both organization and location filters are applied,
    // all necessary joins will still be done.
    // NOTE: if we're to add another JOIN clause for a separate filter,
    // we'll have to rethink this logic
    extraJoins = `
    LEFT JOIN message_reactions mr ON n."reactionID" = mr.id
    LEFT JOIN messages m ON CASE
      WHEN n."messageID" IS NULL THEN mr."messageID"
      ELSE n."messageID" END = m.id
    LEFT JOIN threads t ON m."threadID" = t.id
    INNER JOIN pages p ON (p."orgID" = t."orgID" AND p."contextHash" = t."pageContextHash")`;

    bindVariables.push(JSON.stringify(locationFilter.value));
    extraConditions.push(
      `p."contextData" ${locationFilter.partialMatch ? '@>' : '='} $${
        bindVariables.length
      }::jsonb`,
    );
  }

  let limitCondition = '';
  if (limit) {
    bindVariables.push(limit);
    limitCondition = `LIMIT $${bindVariables.length}`;
  }

  const extraCondition = `AND ${extraConditions.join(' AND ')}`;

  return { bindVariables, extraJoins, extraCondition, limitCondition };
}
