import type { Transaction, WhereOptions } from 'sequelize';
import { Op, QueryTypes, Sequelize } from 'sequelize';

import DataLoader from 'dataloader';
import { unique, isEmpty } from 'radash';
import {
  filteredBatchLoad,
  findFirstEntity,
} from 'server/src/util/filteredBatchLoad.ts';
import {
  locationEqual,
  locationMatches,
  metadataMatches,
} from 'common/types/index.ts';
import type {
  EntityMetadata,
  Location,
  Maybe,
  UUID,
} from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import {
  assertViewerHasUser,
  assertViewerHasOrgs,
  assertViewerHasPlatformApplicationID,
  viewerIsUsingOrgsAsFilter,
  assertViewerHasPlatformUser,
} from 'server/src/auth/index.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import type {
  SlackMirroredThreadInfo,
  ThreadSortInput,
  PageThreadsResult,
} from 'server/src/schema/resolverTypes.ts';
import { getSlackMessageURL } from 'server/src/slack/util.ts';
import { timestampSubquery } from 'server/src/entity/common.ts';
import {
  inKeyOrder,
  inKeyOrderGroupedCustom,
  inKeyOrderOrNullCustom,
} from 'server/src/entity/base/util.ts';
import type { RequestContextLoadersInternal } from 'server/src/RequestContextLoaders.ts';
import { isDefined } from 'common/util/index.ts';
import {
  FeatureFlags,
  flagsUserFromViewer,
  getTypedFeatureFlagValue,
} from 'server/src/featureflags/index.ts';
import { asyncFilter } from 'common/util/asyncFilter.ts';
import {
  adjustCounts,
  countedItems,
} from 'server/src/util/filteredApproximateCount.ts';
import type { ViewerThreadStatus } from '@cord-sdk/types';
import type { PubSubEvent } from 'server/src/pubsub/index.ts';
import type { Logger } from 'server/src/logging/Logger.ts';

export type ThreadCollectionFilter = {
  location?: Location;
  partialMatch?: boolean;
  metadata?: EntityMetadata;
  viewer?: ViewerThreadStatus[];
  resolved?: boolean;
};

export function updateMightBeRelevant(
  logger: Logger,
  filter: ThreadCollectionFilter,
  payload: PubSubEvent<'thread-filterable-properties-updated'>['payload'],
  userID: UUID,
): boolean {
  if (Object.keys(payload.changes).length === 0) {
    logger.warn('Got a thread-filterable-properties-updated with no changes', {
      threadID: payload.threadID,
    });
    return false;
  }

  if (payload.changes.orgID) {
    // Something changing orgID is always relevant
    return true;
  }

  return (
    (isDefined(filter.location) &&
      isDefined(payload.changes.location) &&
      matchesLocationFilter(payload.changes.location.old, filter) !==
        matchesLocationFilter(payload.changes.location.new, filter)) ||
    (isDefined(filter.metadata) &&
      isDefined(payload.changes.metadata) &&
      metadataMatches(payload.changes.metadata.old, filter.metadata) !==
        metadataMatches(payload.changes.metadata.new, filter.metadata)) ||
    (isDefined(filter.resolved) && isDefined(payload.changes.resolved)) ||
    (isDefined(filter.viewer) &&
      filter.viewer.includes('subscribed') &&
      isDefined(payload.changes.subscribers) &&
      (payload.changes.subscribers.added.includes(userID) ||
        payload.changes.subscribers.removed.includes(userID)))
  );
}

function matchesLocationFilter(
  location: Location,
  filter: ThreadCollectionFilter,
): boolean {
  if (!filter.location) {
    return true;
  }
  if (filter.partialMatch) {
    return locationMatches(location, filter.location);
  } else {
    return locationEqual(location, filter.location);
  }
}

export type ThreadCounts = {
  totalThreadCount: number;
  resolvedThreadCount: number;
  unreadThreadCount: number;
  unreadSubscribedThreadCount: number;
  newThreadCount: number;
  emptyThreadCount: number;
};

export class ThreadLoader {
  private threadByIDNoOrgCheckDataloader: DataLoader<UUID, ThreadEntity | null>;
  private messagesCountNoOrgCheckDataloader: DataLoader<UUID, number>;
  private messagesCountExcludingDeletedNoOrgCheckDataloader: DataLoader<
    UUID,
    number
  >;
  private newMessageCountDataloader: DataLoader<UUID, number>;
  private newReactionCountDataloader: DataLoader<UUID, number>;
  private messagesReplyCountDataloader: DataLoader<UUID, number>;
  private userMessagesCountDataloader: DataLoader<UUID, number>;
  private actionMessagesCountDataloader: DataLoader<UUID, number>;
  private firstUnseenMessageIDDataloader: DataLoader<UUID, UUID | null>;
  private replyingUserIDsDataloader: DataLoader<UUID, UUID[]>;
  private actionMessageReplyingUserIDsDataloader: DataLoader<UUID, UUID[]>;
  private slackMirroredThreadInfoDataloader: DataLoader<
    UUID,
    SlackMirroredThreadInfo | null
  >;
  private initialMessagesDataloader: DataLoader<
    [UUID, Maybe<number>],
    MessageEntity[]
  >;

  constructor(
    private viewer: Viewer,
    private loaders: () => RequestContextLoadersInternal,
  ) {
    this.threadByIDNoOrgCheckDataloader = new DataLoader(
      async (keys) => {
        // If we have a platformApplicationID, check that we match. If not
        // (Slack sync in particular), well I guess we just have to trust
        // things. (This will end up `undefined` which tells Sequelize "don't
        // actually care about this column".)
        const { platformApplicationID } = this.viewer;

        const threads = await ThreadEntity.findAll({
          where: {
            id: keys,
            ...(platformApplicationID && { platformApplicationID }),
          },
        });

        return inKeyOrder(threads, keys);
      },
      {
        cache: false,
      },
    );
    this.messagesCountNoOrgCheckDataloader = new DataLoader(
      async (keys) => {
        const counts = await MessageEntity.count({
          group: ['threadID'],
          where: { threadID: keys },
          attributes: [[Sequelize.literal(countedItems()), 'items']],
        });
        const adjustedCounts = await adjustCounts(
          counts,
          async (messageID: UUID) =>
            !!(await this.loaders().messageLoader.loadMessage(messageID)),
        );
        return inKeyOrderOrNullCustom(
          adjustedCounts,
          keys,
          (c) => c.threadID as UUID,
        ).map((c) => (c ? c.count : 0));
      },
      { cache: false },
    );

    this.messagesCountExcludingDeletedNoOrgCheckDataloader = new DataLoader(
      async (keys) => {
        const counts = await MessageEntity.count({
          group: ['threadID'],
          where: { threadID: keys, deletedTimestamp: { [Op.is]: null } },
          attributes: [[Sequelize.literal(countedItems()), 'items']],
        });
        const adjustedCounts = await adjustCounts(
          counts,
          async (messageID: UUID) =>
            !!(await this.loaders().messageLoader.loadMessage(messageID)),
        );
        return inKeyOrderOrNullCustom(
          adjustedCounts,
          keys,
          (c) => c.threadID as UUID,
        ).map((c) => (c ? c.count : 0));
      },
      { cache: false },
    );

    this.newMessageCountDataloader = new DataLoader(
      async (keys) => {
        const userID = assertViewerHasUser(this.viewer);

        const counts = await getSequelize().query<{
          threadID: string;
          count: number;
        }>(
          // We are getting a count from messages we find where they have not been
          // deleted, and the viewer isn't the author of the message, and the message
          // timestamp is greater than that of the thread_participant if they exist.
          // If a user is mentioned then they become a thread_participant but the
          // lastSeenTimestamp is set to null.
          // Using COALESCE allows us use the first non-null value we get from the list
          // within the brackets. In this case, if there isn't a thread_participant
          // the first value will be NULL and it will take 'TRUE' as the value instead
          // if FALSE is the value taken, the message count will be 0
          // The nested COALESCE ensures that if thread_participant does exist but if
          // the 'lastSeenTimestamp' is NULL then it will default to
          // '-infinity'::timestamp which is always smaller than 'timestamp'
          // in order to correctly contribute to the new messages count.
          `
          SELECT m."threadID", COUNT(*)::integer
            FROM messages m
            LEFT JOIN thread_participants tp ON (m."threadID" = tp."threadID" AND tp."userID" = $2)
            WHERE m."threadID" = ANY($1)
              AND m."deletedTimestamp" IS NULL
              AND m."sourceID" != $2
              AND m.timestamp > COALESCE(tp."lastSeenTimestamp", '-infinity'::timestamp)
            GROUP BY m."threadID"
        `,
          { bind: [keys, userID], type: QueryTypes.SELECT },
        );

        return inKeyOrderOrNullCustom(counts, keys, (c) => c.threadID).map(
          (c) => (c ? c.count : 0),
        );
      },
      { cache: false },
    );

    this.newReactionCountDataloader = new DataLoader(
      async (keys) => {
        const userID = assertViewerHasUser(this.viewer);

        const reactionCounts = await getSequelize().query<{
          threadID: UUID;
          count: number;
        }>(
          // We are getting a count from messages reactions added on any of the viewer's messages
          // and the reaction timestamp is greater than that of the thread_participant if they exist.
          `
          SELECT m."threadID", COUNT(*)::integer
            FROM messages m
            INNER JOIN message_reactions mr ON (mr."messageID" = m.id)
            LEFT JOIN thread_participants tp ON (m."threadID" = tp."threadID" AND tp."userID" = $2)
          WHERE m."threadID" = ANY($1)
            AND m."deletedTimestamp" IS NULL
            AND m."sourceID" = $2
            AND mr."userID" != $2
            AND mr.timestamp > COALESCE(tp."lastSeenTimestamp", '-infinity'::timestamp)
          GROUP BY m."threadID"
        `,
          { bind: [keys, userID], type: QueryTypes.SELECT },
        );
        return inKeyOrderOrNullCustom(
          reactionCounts,
          keys,
          (c) => c.threadID,
        ).map((c) => c?.count ?? 0);
      },
      { cache: false },
    );

    this.messagesReplyCountDataloader = new DataLoader(
      async (keys) => {
        const counts = await getSequelize().query<{
          threadID: string;
          items: UUID[];
          count: number;
        }>(
          // NB: assign the row_number() *before* filtering deleted messages, so
          // that we count the *replies* (i.e., not the first message) whether
          // or not the first message is deleted.
          `
            SELECT "threadID", COUNT(*), ${countedItems()} as "items" FROM (
              SELECT *, row_number() OVER (PARTITION BY "threadID" ORDER BY timestamp ASC) AS index
              FROM messages
              WHERE "threadID" = ANY($1)
            ) x
            WHERE type = 'user_message'
            AND "deletedTimestamp" IS NULL
            AND index>1
            GROUP BY "threadID";
          `,
          {
            bind: [keys],
            type: QueryTypes.SELECT,
          },
        );
        const adjustedCounts = await adjustCounts(
          counts,
          async (messageID: UUID) =>
            !!(await this.loaders().messageLoader.loadMessage(messageID)),
        );
        return inKeyOrderOrNullCustom(
          adjustedCounts,
          keys,
          (c) => c.threadID,
        ).map((c) => (c ? c.count : 0));
      },
      { cache: false },
    );

    this.userMessagesCountDataloader = new DataLoader(
      async (keys) => {
        const counts = await MessageEntity.count({
          group: ['threadID'],
          where: {
            threadID: keys,
            deletedTimestamp: { [Op.is]: null },
            type: 'user_message',
          },
          attributes: [[Sequelize.literal(countedItems()), 'items']],
        });
        const adjustedCounts = await adjustCounts(
          counts,
          async (messageID: UUID) =>
            !!(await this.loaders().messageLoader.loadMessage(messageID)),
        );
        return inKeyOrderOrNullCustom(
          adjustedCounts,
          keys,
          (c) => c.threadID as UUID,
        ).map((c) => (c ? c.count : 0));
      },
      { cache: false },
    );

    this.actionMessagesCountDataloader = new DataLoader(
      async (keys) => {
        const counts = await MessageEntity.count({
          group: ['threadID'],
          where: {
            threadID: keys,
            deletedTimestamp: { [Op.is]: null },
            type: 'action_message',
          },
        });
        return inKeyOrderOrNullCustom(
          counts,
          keys,
          (c) => c.threadID as UUID,
        ).map((c) => (c ? c.count : 0));
      },
      { cache: false },
    );

    this.firstUnseenMessageIDDataloader = new DataLoader(
      async (keys) => {
        const userID = assertViewerHasUser(this.viewer);

        const results = await getSequelize().query<{
          threadID: string;
          messageID: string;
        }>(
          `
          SELECT DISTINCT ON (m."threadID") m."threadID", m.id as "messageID"
          FROM messages m
          LEFT JOIN thread_participants tp ON (m."threadID" = tp."threadID" AND tp."userID" = $2)
          WHERE m."threadID" = ANY($1)
            AND m."deletedTimestamp" IS NULL
            AND m."sourceID" != $2
            AND m.timestamp > COALESCE(tp."lastSeenTimestamp", '-infinity'::timestamp)
          ORDER BY m."threadID", m.timestamp`,
          { bind: [keys, userID], type: QueryTypes.SELECT },
        );

        return inKeyOrderOrNullCustom(results, keys, (c) => c.threadID).map(
          (c) => c?.messageID ?? null,
        );
      },
      { cache: false },
    );

    this.replyingUserIDsDataloader = new DataLoader(
      async (keys) => {
        const rows = await getSequelize().query<{
          threadID: UUID;
          sourceID: UUID;
        }>(
          `SELECT DISTINCT m."threadID", m."sourceID"
          FROM messages m
          INNER JOIN (
            SELECT "threadID", MIN(timestamp) as "firstMessageTimestamp"
            FROM messages
            WHERE "threadID" = ANY($1)
            GROUP BY "threadID"
          ) t ON (t."threadID" = m."threadID")
          WHERE m."deletedTimestamp" IS NULL
            AND m.timestamp != t."firstMessageTimestamp"
            AND m.type = 'user_message'
            `,
          { bind: [keys], type: QueryTypes.SELECT },
        );
        return inKeyOrderGroupedCustom(rows, keys, (r) => r.threadID).map(
          (group) => group.map((r) => r.sourceID),
        );
      },
      { cache: false },
    );

    this.actionMessageReplyingUserIDsDataloader = new DataLoader(
      async (keys) => {
        const rows = await getSequelize().query<{
          threadID: UUID;
          sourceID: UUID;
        }>(
          `SELECT DISTINCT m."threadID", m."sourceID"
          FROM messages m
          INNER JOIN (
            SELECT "threadID", MIN(timestamp) as "firstMessageTimestamp"
            FROM messages
            WHERE "threadID" = ANY($1)
            GROUP BY "threadID"
          ) t ON (t."threadID" = m."threadID")
          WHERE m."deletedTimestamp" IS NULL
            AND m.timestamp != t."firstMessageTimestamp"
            AND m.type = 'action_message'`,
          { bind: [keys], type: QueryTypes.SELECT },
        );
        return inKeyOrderGroupedCustom(rows, keys, (r) => r.threadID).map(
          (group) => group.map((r) => r.sourceID),
        );
      },
      { cache: false },
    );

    this.slackMirroredThreadInfoDataloader = new DataLoader(
      async (keys) => {
        // Fetch the slack_mirrored_threads row for the given threadID, if there is
        // one. Also look up the name of the Slack channel, because we want to
        // include that in the object we return.
        const rows = await getSequelize().query<{
          threadID: UUID;
          slackChannelID: string;
          slackMessageTimestamp: string;
          slackOrgID: string;
          threadOrgID: string;
          channel: string | null;
        }>(
          `SELECT
            smt."threadID",
            smt."slackChannelID",
            smt."slackMessageTimestamp",
            smt."slackOrgID",
            smt."threadOrgID",
            sc."name" AS channel
          FROM slack_mirrored_threads smt
          LEFT OUTER JOIN slack_channels sc
            ON (smt."slackOrgID", smt."slackChannelID") = (sc."orgID", sc."slackID")
          WHERE smt."threadID" = ANY($1);`,
          { bind: [keys], type: QueryTypes.SELECT },
        );
        const mirroredInfo = inKeyOrderOrNullCustom(
          rows,
          keys,
          (r) => r.threadID,
        );

        const orgLoader = loaders().orgLoader;

        return await Promise.all(
          mirroredInfo.map(async (mi) => {
            if (!mi) {
              return null;
            }

            // This Cord thread is shared to Slack!
            const {
              slackChannelID,
              slackMessageTimestamp,
              channel,
              slackOrgID,
            } = mi;

            let slackURL: string | null = null;

            const slackOrg = await orgLoader.loadOrg(slackOrgID);

            if (slackOrg?.domain) {
              slackURL = getSlackMessageURL(
                slackOrg.domain,
                slackChannelID,
                slackMessageTimestamp,
                null,
              );
            }

            return { channel, slackURL };
          }),
        );
      },
      { cache: false },
    );

    this.initialMessagesDataloader = new DataLoader(
      async (keys) => {
        const userID = assertViewerHasUser(this.viewer);

        const [threadParticipants, messageCounts] = await Promise.all([
          Promise.all(
            keys.map(([threadID]) =>
              this.loaders().threadParticipantLoader.loadForUserNoOrgCheck({
                threadID,
                userID,
              }),
            ),
          ),
          Promise.all(
            keys.map(([threadID]) =>
              this.loadMessagesCountNoOrgCheck(threadID),
            ),
          ),
        ]);

        const hasMessage = async (m: MessageEntity) =>
          await this.loaders().privacyLoader.viewerHasMessage(m);

        return await Promise.all(
          keys.map(async ([threadID, initialFetchCount], i) => {
            const messageWhereOptions: WhereOptions<MessageEntity> = {
              threadID,
            };

            // If there are 3 or fewer messages and they didn't ask for a
            // specific number, just return them all
            if (messageCounts[i] < 4 && !isDefined(initialFetchCount)) {
              const unfiltered = await MessageEntity.findAll({
                where: messageWhereOptions,
                order: [['timestamp', 'ASC']],
              });
              return await asyncFilter(unfiltered, hasMessage);
            }

            const [
              firstMessageOfThread,
              lastMessageOfThread,
              lastMessagesOfThreadUnfiltered,
            ] = await Promise.all([
              findFirstEntity(
                MessageEntity,
                {
                  where: messageWhereOptions,
                  order: [['timestamp', 'ASC']],
                },
                hasMessage,
              ),
              findFirstEntity(
                MessageEntity,
                {
                  where: messageWhereOptions,
                  order: [['timestamp', 'DESC']],
                },
                hasMessage,
              ),
              isDefined(initialFetchCount)
                ? filteredBatchLoad<MessageEntity, string | null>(
                    async (token, limit) => {
                      const result = await getSequelize().query(
                        `
                        WITH
                        cursor_message AS (
                          SELECT m.timestamp FROM messages m WHERE id=$1
                        )
                        SELECT m.*
                          FROM messages m
                          LEFT OUTER JOIN cursor_message ucm ON TRUE
                          WHERE "threadID"=$2
                          AND m.timestamp < COALESCE(ucm.timestamp, 'infinity')
                          ORDER BY m.timestamp DESC
                          LIMIT $3
                `,
                        {
                          bind: [token, threadID, limit],
                          type: QueryTypes.SELECT,
                          model: MessageEntity,
                        },
                      );
                      return {
                        items: result,
                        token:
                          result.length > 0
                            ? result[result.length - 1].id
                            : null,
                        hasMore: result.length === limit,
                      };
                    },
                    hasMessage,
                    null,
                    initialFetchCount,
                  ).then((result) => result.items)
                : threadParticipants[i]
                ? // This will fetch all messages that are 'new' for the user,
                  // plus the message immediately before that (the last 'read'
                  // message), with a cap of 50 messages
                  //
                  // TODO(flooey): Rewrite this to use filteredBatchLoad rather
                  // than filtering below.
                  getSequelize().query(
                    `
                      SELECT * FROM messages
                      WHERE "threadID" = $1
                      AND "timestamp" >= (
                        SELECT COALESCE(MAX(timestamp), '-infinity'::timestamp) FROM messages
                        WHERE "threadID" = $1
                          AND timestamp <= (
                            SELECT "lastSeenTimestamp"
                            FROM thread_participants
                            WHERE "threadID" = $1 AND "userID" = $2
                            LIMIT 1
                          )
                      )
                      ORDER BY "timestamp" DESC LIMIT 50;
                    `,
                    {
                      bind: [threadID, userID],
                      type: QueryTypes.SELECT,
                      // have state model otherwise it can't use the entity's properties
                      model: MessageEntity,
                    },
                  )
                : // If viewer is not a thread participant, and there are more than 3
                  // messages this will render collapsed similar to if all messages
                  // were read.
                  [],
            ]);

            if (!firstMessageOfThread || !lastMessageOfThread) {
              return [];
            } else if (firstMessageOfThread.id === lastMessageOfThread.id) {
              return [firstMessageOfThread];
            } else {
              const lastMessagesOfThread = await asyncFilter(
                lastMessagesOfThreadUnfiltered,
                hasMessage,
              );

              return [
                firstMessageOfThread,
                ...lastMessagesOfThread
                  .filter(
                    ({ id }) =>
                      id !== firstMessageOfThread.id &&
                      id !== lastMessageOfThread.id,
                  )
                  .reverse(),
                lastMessageOfThread,
              ];
            }
          }),
        );
      },
      { cache: false },
    );
  }

  /**
   * Loads a thread by its ID. Will return null either if the thread doesn't
   * exist, or if the viewer doesn't have permission to see the thread.
   *
   * Does *not* do a strict "org check", i.e., this will return any thread the
   * viewer is allowed to see, even if it doesn't match the org(s) in the Viewer
   * object.
   */
  async loadThread(threadID: UUID): Promise<ThreadEntity | null> {
    const thread = await this.threadByIDNoOrgCheckDataloader.load(threadID);
    const canSee = await this.loaders().privacyLoader.viewerHasThread(
      thread,
      false,
    );
    return canSee ? thread : null;
  }

  /**
   * Loads a list of threads.
   * @see loadThread
   */
  async loadThreads(ids: UUID[]): Promise<ThreadEntity[]> {
    return (await Promise.all(ids.map((id) => this.loadThread(id)))).filter(
      isDefined,
    );
  }

  /**
   * Loads a thread by its external ID. Will return null either if the thread
   * doesn't exist, or if the viewer doesn't have permission to see the thread.
   *
   * Note that this does *not* do a strict "org check", i.e., this will return
   * any thread the viewer is allowed to see, even if it doesn't match the org(s)
   * in the Viewer object.
   */
  async loadByExternalID(
    externalThreadID: string,
    transaction?: Transaction,
  ): Promise<ThreadEntity | null> {
    const platformApplicationID = assertViewerHasPlatformApplicationID(
      this.viewer,
    );

    const thread = await ThreadEntity.findOne({
      where: {
        externalID: externalThreadID,
        platformApplicationID,
      },
      transaction,
    });

    const canSee = await this.loaders().privacyLoader.viewerHasThread(
      thread,
      false,
      transaction,
    );
    return canSee ? thread : null;
  }

  /**
   * Loads a thread by its external ID. Will return null either if the thread
   * doesn't exist, or if the viewer doesn't have permission to see the thread.
   *
   * Note that this *does* do a strict "org check", i.e., the thread's org is
   * checked against the org(s) in the Viewer object. This means this function
   * can return null even if the viewer can nominally see the thread, because it
   * doesn't match their *current* Viewer object.
   */
  async loadByExternalIDStrictOrgCheck(
    externalThreadID: string,
    transaction?: Transaction,
  ): Promise<ThreadEntity | null> {
    const platformApplicationID = assertViewerHasPlatformApplicationID(
      this.viewer,
    );

    const thread = await ThreadEntity.findOne({
      where: {
        externalID: externalThreadID,
        platformApplicationID,
      },
      transaction,
    });

    const canSee = await this.loaders().privacyLoader.viewerHasThread(
      thread,
      true,
      transaction,
    );
    return canSee ? thread : null;
  }

  /**
   * You generally shouldn't need to call this function:
   *
   * - If you want to check if the viewer can see a particular thread ID, just
   *   load it with loadThread (since you typically actually want the thread,
   *   not *just* to check if you can see it).
   * - If you want to check if the viewer can see a particular ThreadEntity,
   *   ideally fix the loading code to come through viewerHasThread and check
   *   privacy on load, or use loadThread on the ID if you must.
   */
  async assertViewerHasThread(id: UUID): Promise<void> {
    const thread = await this.loadThread(id);
    if (!thread) {
      throw new Error('Viewer does not have permission to access thread');
    }
  }

  private async loadThreadsForPageImpl({
    filter,
    sort,
    limit,
    after,
    skipOrgCheck,
  }: {
    filter?: ThreadCollectionFilter;
    sort?: Maybe<ThreadSortInput>;
    limit?: Maybe<number>;
    after?: Maybe<UUID>;
    skipOrgCheck?: boolean;
  }): Promise<PageThreadsResult> {
    const userID = assertViewerHasUser(this.viewer);
    const orgIDs = assertViewerHasOrgs(this.viewer);
    const platformApplicationID = assertViewerHasPlatformApplicationID(
      this.viewer,
    );

    // Used to check if more threads exist for the hasMore field
    const limitPlusOne = limit ? limit + 1 : undefined;

    // Default behaviour is to return all threads, reverse-chrono ordered by
    // most recent reply's timestamp.
    const whereConditions = [];
    const extraJoins = [];

    const ascending = sort?.sortDirection === 'ascending';
    const orderByDirection = ascending ? 'ASC' : 'DESC';

    const makeTimeOrderByCondition = (threadID: string) => `
      SELECT ${
        sort?.sortBy === 'first_message_timestamp' ? 'MIN' : 'MAX'
      }("timestamp") FROM messages
      WHERE "threadID"=${threadID} AND "deletedTimestamp" IS NULL
  `;
    const orderByCondition = makeTimeOrderByCondition('t.id');
    const bindVariables: unknown[] = [];

    // This is a bit unfortunate. Postgres doesn't like unused bind parameters,
    // so we need to do this in an if/else. But we also want to re-use the
    // `orgIDs` bind below, ideally without sending the entire list twice -- so
    // we are below relying on the fact that this ends up as `$1`. Basically be
    // careful if you are changing anything about the first element of
    // `bindVariables` or `$1`.
    if (skipOrgCheck) {
      bindVariables.push(platformApplicationID);
      whereConditions.push('t."platformApplicationID" = $1');
    } else {
      bindVariables.push(orgIDs);
      whereConditions.push('t."orgID" = ANY($1)');
    }

    if (filter?.resolved === true) {
      whereConditions.push(`t."resolvedTimestamp" IS NOT NULL`);
    } else if (filter?.resolved === false) {
      whereConditions.push(`t."resolvedTimestamp" IS NULL`);
    }

    if (filter?.metadata) {
      bindVariables.push(JSON.stringify(filter.metadata));
      whereConditions.push(`t."metadata" @> $${bindVariables.length}`);
    }
    if (filter?.viewer) {
      const viewerConditions: string[] = [];
      for (const f of unique(filter.viewer)) {
        switch (f) {
          case 'subscribed':
            bindVariables.push(userID);
            extraJoins.push(`INNER JOIN thread_participants tp
              ON (t.id = tp."threadID" AND tp."userID" = $${bindVariables.length})`);
            viewerConditions.push('tp."subscribed" = TRUE');
            break;
          case 'mentioned':
            bindVariables.push(userID);
            viewerConditions.push(
              `t.id IN (
                SELECT "threadID" from messages m
                  INNER JOIN message_mentions mm ON (m.id = mm."messageID")
                WHERE mm."userID" = $${bindVariables.length}
                  AND m.type = 'user_message'
                  AND m."deletedTimestamp" IS NULL
              )`,
            );
            break;
          default: {
            const _f: never = f;
            throw new Error(`Unknown filter: ${f}`);
          }
        }
      }
      if (viewerConditions.length) {
        whereConditions.push(`(${viewerConditions.join(' OR ')})`);
      }
    }

    if (filter?.location) {
      bindVariables.push(JSON.stringify(filter.location));
      extraJoins.push(`INNER JOIN pages p
         ON (p."orgID" = t."orgID" AND p."contextHash" = t."pageContextHash")`);
      whereConditions.push(`p."contextData" ${
        filter.partialMatch ? '@>' : '='
      } $${bindVariables.length}::jsonb
      `);
      if (!skipOrgCheck) {
        whereConditions.push(`p."orgID" = ANY($1)`);
      }
    }

    const limitCondition = isDefined(limitPlusOne)
      ? `LIMIT ${limitPlusOne}`
      : '';
    let paginationCondition = '';
    if (after) {
      bindVariables.push(after);
      paginationCondition = `WHERE orderTime ${
        ascending ? '>' : '<'
      } (${makeTimeOrderByCondition(`$${bindVariables.length}`)})`;
    }

    const threads = await getSequelize().query(
      `WITH unsortedThreads AS (
         SELECT t.*, (${orderByCondition}) AS orderTime
         FROM threads t
         ${extraJoins.join(' ')}
         WHERE ${whereConditions.join(' AND ')}
       )
       SELECT * FROM unsortedThreads
       ${paginationCondition}
       ORDER BY orderTime ${orderByDirection} NULLS LAST
       ${limitCondition};`,
      {
        bind: bindVariables,
        type: QueryTypes.SELECT,
        model: ThreadEntity,
      },
    );

    const hasMore =
      typeof limitPlusOne === 'number'
        ? threads.length === limitPlusOne
        : false;

    const threadsToReturn = isDefined(limit)
      ? threads.slice(0, limit)
      : threads;

    return {
      threads: threadsToReturn,
      hasMore,
      token: threadsToReturn.at(-1)?.id,
    };
  }

  async loadThreadsForPage(args: {
    filter?: ThreadCollectionFilter;
    sort?: Maybe<ThreadSortInput>;
    limit?: Maybe<number>;
    after?: Maybe<UUID>;
  }): Promise<PageThreadsResult> {
    const enablePerms = await getTypedFeatureFlagValue(
      FeatureFlags.GRANULAR_PERMISSIONS,
      flagsUserFromViewer(this.viewer),
    );

    if (!enablePerms || viewerIsUsingOrgsAsFilter(this.viewer)) {
      return await this.loadThreadsForPageImpl(args);
    }

    const loaded = await filteredBatchLoad(
      async (token, limit) => {
        const batch = await this.loadThreadsForPageImpl({
          ...args,
          limit,
          after: token,
          skipOrgCheck: true,
        });
        return {
          items: batch.threads,
          token: batch.token,
          hasMore: batch.hasMore,
        };
      },
      async (t) => await this.loaders().privacyLoader.viewerHasThread(t, false),
      args.after,
      args.limit,
    );

    return {
      threads: loaded.items,
      hasMore: loaded.hasMore,
      // The token might point at a thread that got filtered out, and since they
      // are just thread IDs we don't want to leak its existence, so force-reset
      // to the last thread we are returning.
      token: loaded.items.at(-1)?.id,
    };
  }

  async threadMatchesFilter(threadID: UUID, filter: ThreadCollectionFilter) {
    const { userID, platformApplicationID } = assertViewerHasPlatformUser(
      this.viewer,
    );

    const orgIDs = assertViewerHasOrgs(this.viewer);

    const bindVariables = [threadID, platformApplicationID, orgIDs];
    const whereConditions = [
      't.id = $1',
      't."platformApplicationID" = $2',
      't."orgID" = ANY($3)',
    ];
    const extraJoins = [];

    if (filter.location) {
      bindVariables.push(JSON.stringify(filter.location));
      extraJoins.push(`INNER JOIN pages p
        ON(p."orgID" = t."orgID" AND p."contextHash" = t."pageContextHash")`);
      whereConditions.push(
        `p."contextData" ${filter.partialMatch ? '@>' : '='} $${
          bindVariables.length
        }::jsonb`,
      );
    }

    if (filter.resolved === true) {
      whereConditions.push('t."resolvedTimestamp" IS NOT NULL');
    } else if (filter.resolved === false) {
      whereConditions.push('t."resolvedTimestamp" IS NULL');
    }

    if (filter?.metadata) {
      bindVariables.push(JSON.stringify(filter.metadata));
      whereConditions.push(`t."metadata" @> $${bindVariables.length}`);
    }

    if (filter?.viewer) {
      const viewerConditions: string[] = [];
      for (const f of unique(filter.viewer)) {
        switch (f) {
          case 'subscribed':
            bindVariables.push(userID);
            extraJoins.push(`INNER JOIN thread_participants tp
              ON (t.id = tp."threadID" AND tp."userID" = $${bindVariables.length})`);
            viewerConditions.push('tp."subscribed" = TRUE');
            break;
          case 'mentioned':
            bindVariables.push(userID);
            viewerConditions.push(
              `t.id IN (
                  SELECT "threadID" from messages m
                    INNER JOIN message_mentions mm ON (m.id = mm."messageID")
                  WHERE mm."userID" = $${bindVariables.length}
                    AND m.type = 'user_message'
                    AND m."deletedTimestamp" IS NULL
                )`,
            );
            break;
          default: {
            const _f: never = f;
            throw new Error(`Unknown filter: ${f}`);
          }
        }
      }
      if (viewerConditions.length) {
        whereConditions.push(`(${viewerConditions.join(' OR ')})`);
      }
    }

    const threads = await getSequelize().query<{ id: UUID }>(
      ` SELECT t.id
          FROM threads t
          ${extraJoins.join(' ')}
          WHERE ${whereConditions.join(' AND ')}
        `,
      {
        bind: bindVariables,
        type: QueryTypes.SELECT,
      },
    );

    return threads.length > 0;
  }

  async loadThreadActivitySummary({
    location,
    partialMatch,
    metadata,
    viewer,
    resolved,
  }: ThreadCollectionFilter): Promise<ThreadCounts> {
    const userID = assertViewerHasUser(this.viewer);
    const orgIDs = assertViewerHasOrgs(this.viewer);
    const platformApplicationID = assertViewerHasPlatformApplicationID(
      this.viewer,
    );

    const extraConditions = [];
    let extraJoin = '';

    const bindVariables: (string | string[] | Location)[] = [
      orgIDs,
      userID,
      platformApplicationID,
    ];

    if (location) {
      bindVariables.push(JSON.stringify(location));
      extraJoin = `INNER JOIN pages p
      ON(p."orgID" = t."orgID" AND p."contextHash" = t."pageContextHash")`;
      extraConditions.push(
        `p."contextData" ${partialMatch ? '@>' : '='} $${
          bindVariables.length
        }::jsonb`,
      );
      extraConditions.push(`p."orgID" = ANY($1)`);
    }

    if (!isEmpty(metadata)) {
      bindVariables.push(JSON.stringify(metadata));
      extraConditions.push(`t."metadata" @> $${bindVariables.length}::jsonb`);
    }

    if (viewer) {
      const viewerConditions: string[] = [];
      for (const f of unique(viewer)) {
        switch (f) {
          case 'subscribed':
            viewerConditions.push('tp."subscribed" = TRUE');
            break;
          case 'mentioned':
            viewerConditions.push(
              `t.id IN (
                  SELECT "threadID" from messages m
                    INNER JOIN message_mentions mm ON (m.id = mm."messageID")
                  WHERE mm."userID" = $2
                    AND m.type = 'user_message'
                    AND m."deletedTimestamp" IS NULL
                )`,
            );
            break;
          default: {
            const _f: never = f;
            throw new Error(`Unknown filter: ${f}`);
          }
        }
      }
      if (viewerConditions.length) {
        extraConditions.push(`(${viewerConditions.join(' OR ')})`);
      }
    }

    if (resolved === true) {
      extraConditions.push(`t."resolvedTimestamp" IS NOT NULL`);
    } else if (resolved === false) {
      extraConditions.push(`t."resolvedTimestamp" IS NULL`);
    }
    const extraCondition =
      extraConditions.length > 0 ? `AND ${extraConditions.join(' AND ')}` : '';

    const result = await getSequelize().query<ThreadCounts>(
      `
      WITH thread_props AS (
        SELECT EXISTS (
            SELECT 1 FROM messages
            WHERE "deletedTimestamp" IS NULL
              AND type = 'user_message'
              AND "threadID" = t.id
              AND "platformApplicationID" = $3
          ) AS has_message,
          EXISTS (
            SELECT 1 FROM messages
            WHERE "deletedTimestamp" IS NULL
              AND type = 'user_message'
              AND "threadID" = t.id
              AND "platformApplicationID" = $3
              AND timestamp > COALESCE(tp."lastSeenTimestamp", '-infinity'::timestamp)
          ) AS has_unread,
          EXISTS (
            SELECT 1 FROM messages
            WHERE "deletedTimestamp" IS NULL
              AND type = 'user_message'
              AND "threadID" = t.id
              AND "platformApplicationID" = $3
          ) AND tp."lastSeenTimestamp" IS NULL AS all_unread,
          COALESCE(tp.subscribed, FALSE) AS subscribed,
          t."resolvedTimestamp" IS NOT NULL AS resolved
        FROM threads t
        LEFT JOIN thread_participants tp ON (tp."threadID", tp."userID", tp."orgID") = (t.id, $2, t."orgID")
        ${extraJoin}
        WHERE t."orgID" = ANY($1)
        ${extraCondition}
      )
      SELECT
        (COUNT(*) FILTER (WHERE has_message))::integer AS "totalThreadCount",
        (COUNT(*) FILTER (WHERE has_unread AND NOT resolved))::integer AS "unreadThreadCount",
        (COUNT(*) FILTER (WHERE has_unread AND subscribed AND NOT resolved))::integer AS "unreadSubscribedThreadCount",
        (COUNT(*) FILTER (WHERE resolved))::integer AS "resolvedThreadCount",
        (COUNT(*) FILTER (WHERE all_unread AND NOT resolved))::integer AS "newThreadCount",
        (COUNT(*) FILTER (WHERE NOT has_message))::integer AS "emptyThreadCount"
      FROM thread_props
      `,
      {
        type: QueryTypes.SELECT,
        bind: bindVariables,
      },
    );
    return result[0];
  }

  async loadNewMessageCountNoOrgCheck(threadID: UUID): Promise<number> {
    return await this.newMessageCountDataloader.load(threadID);
  }

  async loadNewReactionsCountNoOrgCheck(threadID: UUID): Promise<number> {
    return await this.newReactionCountDataloader.load(threadID);
  }

  async getFirstUnseenMessageIDNoOrgCheck(
    threadID: UUID,
  ): Promise<UUID | null> {
    return await this.firstUnseenMessageIDDataloader.load(threadID);
  }

  async loadMessagesCountExcludingDeletedNoOrgCheck(
    threadID: UUID,
    cursor?: UUID,
  ): Promise<number> {
    if (cursor) {
      // Can't easily coalesce multiple queries with a cursor into a single
      // query in the dataloader, so just do it by hand here.
      return await MessageEntity.count({
        where: {
          threadID,
          deletedTimestamp: { [Op.is]: null },
          timestamp: { [Op.lt]: timestampSubquery(cursor) },
        },
      });
    } else {
      return await this.messagesCountExcludingDeletedNoOrgCheckDataloader.load(
        threadID,
      );
    }
  }

  /**
   * Returns the number of messages in a thread including any deleted messages
   * and any action messages (resolved/unresolved).
   */
  async loadMessagesCountNoOrgCheck(threadID: UUID): Promise<number> {
    return await this.messagesCountNoOrgCheckDataloader.load(threadID);
  }

  async loadUserMessagesCountNoOrgCheck(threadID: UUID): Promise<number> {
    return await this.userMessagesCountDataloader.load(threadID);
  }
  async loadActionMessagesCountNoOrgCheck(threadID: UUID): Promise<number> {
    return await this.actionMessagesCountDataloader.load(threadID);
  }

  /**
   * Returns the number of replies in a thread excluding any deleted messages
   * and any action messages (resolved/unresolved).
   * The first message in the thread is ignored in this count as it is not a reply.
   */
  async loadReplyCount(threadID: UUID) {
    return await this.messagesReplyCountDataloader.load(threadID);
  }

  // This is called once to load the initial messages for a thread
  // loads the first message of thread
  // loads the 10 previous messages either before any unread
  // loads unread messages based on thread participant lastSeenTimestamp
  async loadInitialMessagesNoOrgCheck(
    threadID: UUID,
    initialFetchCount: Maybe<number>,
  ) {
    return await this.initialMessagesDataloader.load([
      threadID,
      initialFetchCount,
    ]);
  }

  async loadRecentlyActiveThreads(orgID: UUID): Promise<UUID[]> {
    // TODO: Add pagination?
    const rows = await getSequelize().query<{ threadID: UUID }>(
      `SELECT "threadID" FROM
         (SELECT DISTINCT ON ("threadID") "threadID", timestamp
          FROM messages
          WHERE
            "orgID" = $1
            AND "deletedTimestamp" IS NULL
          ORDER BY "threadID", timestamp DESC) as subquery
       ORDER BY timestamp DESC
       LIMIT 20;`,
      { bind: [orgID], type: QueryTypes.SELECT },
    );

    return rows.map((row) => row.threadID);
  }

  async loadMessagesCountBeforeNoOrgCheck(
    threadID: UUID,
    messageID: UUID,
  ): Promise<number> {
    const rows = await getSequelize().query<{ count: number }>(
      `SELECT COUNT(m) AS count FROM messages m
       WHERE "threadID"=$1
       AND "deletedTimestamp" IS NULL
       AND timestamp < (
           SELECT timestamp FROM messages
           WHERE "threadID"=$1 AND "id"=$2
       );`,
      {
        bind: [threadID, messageID],
        type: QueryTypes.SELECT,
      },
    );

    return rows[0]?.count ?? 0;
  }

  async loadSlackMirroredThreadInfoNoOrgCheck(
    threadID: UUID,
  ): Promise<SlackMirroredThreadInfo | null> {
    return await this.slackMirroredThreadInfoDataloader.load(threadID);
  }

  async hasUserMessagesNoOrgCheck(threadID: UUID): Promise<boolean> {
    return await this.userMessagesCountDataloader
      .load(threadID)
      .then((c) => c > 0);
  }

  async loadReplyingUserIDsNoOrgCheck(threadID: UUID) {
    return await this.replyingUserIDsDataloader.load(threadID);
  }

  /**
   * Returns all the authors of action messages in the thread's replies.
   */
  async loadActionMessageReplyingUserIDsNoOrgCheck(threadID: UUID) {
    return await this.actionMessageReplyingUserIDsDataloader.load(threadID);
  }
}
