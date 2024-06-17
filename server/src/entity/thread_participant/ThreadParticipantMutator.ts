import type { Transaction, WhereOptions } from 'sequelize';
import { Op, QueryTypes } from 'sequelize';

import { unique } from 'radash';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import type { UUID } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import {
  assertViewerHasOrg,
  assertViewerHasIdentity,
  assertViewerHasUser,
  assertViewerHasOrgs,
} from 'server/src/auth/index.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';
import { ThreadParticipantEntity } from 'server/src/entity/thread_participant/ThreadParticipantEntity.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import { getNewLoaders } from 'server/src/RequestContextLoaders.ts';
import type { RequestContextLoaders } from 'server/src/RequestContextLoaders.ts';
import { PageLoader } from 'server/src/entity/page/PageLoader.ts';
import type { MarkThreadsSeenInput } from 'server/src/schema/resolverTypes.ts';

export class ThreadParticipantMutator {
  constructor(
    private viewer: Viewer,
    private loaders: RequestContextLoaders | null,
  ) {}

  private async threadLoader() {
    if (!this.loaders) {
      this.loaders = await getNewLoaders(this.viewer);
    }

    return this.loaders.threadLoader;
  }

  private async getLocation(threadID: UUID) {
    const pageLoader = this.loaders?.pageLoader ?? new PageLoader(this.viewer);
    const page = await pageLoader.loadPrimaryPageForThreadNoOrgCheck(threadID);
    if (!page) {
      throw new Error('Unable to find thread location');
    }
    return page.contextData;
  }

  async markThreadSeen({
    threadID,
    setSubscribed = false,
    transaction,
  }: {
    threadID: UUID;
    setSubscribed?: boolean;
    transaction?: Transaction;
  }) {
    const userID = assertViewerHasUser(this.viewer);

    const thread = await ThreadEntity.findByPk(threadID, { transaction });

    if (!thread) {
      throw new Error('No such thread');
    }
    await getSequelize().query(
      `INSERT INTO thread_participants ("orgID", "userID", "threadID", "subscribed", "lastUnseenMessageTimestamp","lastUnseenReactionTimestamp","lastSeenTimestamp")
       VALUES ($1, $2, $3, $4, $5, $6, (
        SELECT GREATEST(MAX(m."timestamp"), MAX(mr."timestamp")) FROM messages m LEFT OUTER JOIN message_reactions mr ON mr."messageID"=m.id
        WHERE m."threadID"=$3
       ))
       ON CONFLICT ("orgID", "userID", "threadID") DO UPDATE
       SET "lastSeenTimestamp" = EXCLUDED."lastSeenTimestamp", "lastUnseenMessageTimestamp" = NULL, "lastUnseenReactionTimestamp" = NULL`,
      {
        bind: [thread.orgID, userID, threadID, setSubscribed, null, null],
        transaction,
      },
    );

    const notify = async () => {
      // TODO: Temporary load alleviation - remove
      if (
        thread.platformApplicationID !== '9e7d98ae-5da5-42ca-b857-2f15dc9a63db'
      ) {
        const location = await this.getLocation(threadID);
        await Promise.all([
          publishPubSubEvent(
            'inbox-updated',
            { userID },
            { threadID, location },
          ),
          publishPubSubEvent(
            'thread-participants-updated-incremental',
            { threadID },
            { userID },
          ),
        ]);
      } else {
        anonymousLogger().debug(
          'Skipped thread seen subscriptions for 9e7d98ae-5da5-42ca-b857-2f15dc9a63db',
        );
      }
    };

    if (transaction) {
      transaction.afterCommit(notify);
    } else {
      await notify();
    }
  }

  async markThreadUnseenFromMessage({
    threadID,
    messageID,
    transaction,
  }: {
    threadID: UUID;
    messageID: UUID;
    transaction?: Transaction;
  }) {
    const { userID, orgID } = assertViewerHasIdentity(this.viewer);

    // This will not return a message if the entire thread is being marked as unseen
    const lastSeenMessage = await getSequelize().query(
      `SELECT * from messages m
      WHERE m.timestamp < (SELECT timestamp from messages m WHERE m.id = $1)
      AND m."threadID" = $2 
      ORDER BY timestamp DESC
      LIMIT 1`,
      {
        bind: [messageID, threadID],
        type: QueryTypes.SELECT,
        model: MessageEntity,
        transaction,
      },
    );

    const lastSeenMessageTimestamp = lastSeenMessage[0]?.timestamp ?? null;

    const mostRecentMessage = await MessageEntity.findOne({
      where: {
        threadID,
      },
      order: [['timestamp', 'DESC']],
      transaction,
    });

    if (!mostRecentMessage) {
      throw new Error('No messages found in thread');
    }

    await getSequelize().query(
      `INSERT INTO thread_participants ("orgID", "userID", "threadID", "subscribed", "lastUnseenMessageTimestamp", "lastUnseenReactionTimestamp", "lastSeenTimestamp")
        VALUES ($1, $2, $3, $4, $5, $5, $6)
        ON CONFLICT ("orgID", "userID", "threadID") DO UPDATE
        SET "lastSeenTimestamp" = $6, "lastUnseenMessageTimestamp" = $5, "lastUnseenReactionTimestamp" = $5`,
      {
        bind: [
          orgID,
          userID,
          threadID,
          false,
          mostRecentMessage.timestamp,
          lastSeenMessageTimestamp,
        ],
        transaction,
      },
    );

    const notify = async () => {
      const location = await this.getLocation(threadID);
      await Promise.all([
        publishPubSubEvent('inbox-updated', { userID }, { threadID, location }),
        publishPubSubEvent(
          'thread-participants-updated-incremental',
          {
            threadID,
          },
          { userID },
        ),
      ]);
    };

    if (transaction) {
      transaction.afterCommit(notify);
    } else {
      await notify();
    }
  }

  async markAllThreadsSeen({
    seen,
    externalThreadID,
    location,
    resolved,
    metadata,
    viewer,
    ...rest
  }: MarkThreadsSeenInput) {
    // Loosely based on ThreadLoader.loadThreadsForPage.
    const _: Record<string, never> = rest;

    const userID = assertViewerHasUser(this.viewer);
    const orgIDs = assertViewerHasOrgs(this.viewer);

    const whereConditions = [];
    const extraJoins = [];
    const bindVariables = [orgIDs, userID];

    whereConditions.push('t."orgID" = ANY($1)');

    if (externalThreadID) {
      bindVariables.push(externalThreadID);
      whereConditions.push(`t."externalID" = $${bindVariables.length}`);
    }
    if (resolved === true) {
      whereConditions.push(`t."resolvedTimestamp" IS NOT NULL`);
    } else if (resolved === false) {
      whereConditions.push(`t."resolvedTimestamp" IS NULL`);
    }

    if (metadata) {
      bindVariables.push(JSON.stringify(metadata));
      whereConditions.push(`t."metadata" @> $${bindVariables.length}`);
    }
    if (viewer) {
      const viewerConditions: string[] = [];
      for (const f of unique(viewer)) {
        switch (f) {
          case 'subscribed':
            extraJoins.push(`LEFT JOIN thread_participants tp
              ON (t.id = tp."threadID" AND tp."userID" = $2)`);
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
        whereConditions.push(`(${viewerConditions.join(' OR ')})`);
      }
    }

    if (location) {
      bindVariables.push(JSON.stringify(location.value));
      extraJoins.push(`INNER JOIN pages p
         ON (p."orgID" = t."orgID" AND p."contextHash" = t."pageContextHash")`);
      whereConditions.push(`p."contextData" ${
        location.partialMatch ? '@>' : '='
      } $${bindVariables.length}::jsonb
      `);
      whereConditions.push(`p."orgID" = ANY($1)`);
    }

    const seenVal = seen ? 'NOW()' : 'NULL';

    const [threadIDs, _affected] = await getSequelize().query(
      `INSERT INTO thread_participants
          ("orgID", "userID", "threadID", "subscribed", "lastUnseenMessageTimestamp", "lastUnseenReactionTimestamp", "lastSeenTimestamp")
        SELECT t."orgID", $2, t."id", false, NULL, NULL, ${seenVal}
          FROM threads t
          ${extraJoins.join(' ')}
          WHERE ${whereConditions.join(' AND ')}
      ON CONFLICT ("orgID", "userID", "threadID") DO UPDATE
        SET "lastUnseenMessageTimestamp" = NULL, "lastUnseenReactionTimestamp" = NULL, "lastSeenTimestamp" = ${seenVal}
      RETURNING "threadID"`,
      { bind: bindVariables },
    );

    await Promise.all([
      publishPubSubEvent('inbox-updated', { userID }, null),
      Promise.all(
        (threadIDs as { threadID: UUID }[]).map(({ threadID }) =>
          publishPubSubEvent(
            'thread-participants-updated-incremental',
            { threadID },
            { userID },
          ),
        ),
      ),
    ]);
  }

  async subscribeUsersToThread(
    threadID: UUID,
    userIDs: UUID[],
    orgIDOverride?: UUID,
    transaction?: Transaction,
  ) {
    const viewerOrgID = assertViewerHasOrg(this.viewer);

    const orgMembers = await OrgMembersEntity.findAll({
      where: {
        orgID: orgIDOverride ?? viewerOrgID,
        userID: userIDs,
      },
      transaction,
    });

    await ThreadParticipantEntity.bulkCreate(
      orgMembers.map((om) => ({
        threadID,
        userID: om.userID,
        orgID: orgIDOverride ?? viewerOrgID,
        subscribed: true,
      })),
      {
        transaction,
        updateOnDuplicate: ['subscribed'],
      },
    );
  }

  async unsubscribeUsersFromThread(
    threadID: UUID,
    userIDs: UUID[],
    transaction?: Transaction,
  ) {
    await ThreadParticipantEntity.update(
      { subscribed: false },
      { where: { threadID, userID: userIDs }, transaction },
    );
  }

  async markThreadNewlyActiveForOtherUsers(
    threadID: UUID,
    messageID: UUID,
    transaction?: Transaction,
  ) {
    // This function marks the thread active for every participant of the thread
    // that is not the currently logged in user (this.viewer.userID) by setting
    // the lastUnseenMessageTimestamp to that of the given message.
    // This is called when the logged in user publishes a new message
    // in the thread.

    const userID = assertViewerHasUser(this.viewer);

    const [rows]: [{ userID: UUID }[], any] = (await getSequelize().query(
      `UPDATE thread_participants
       SET "lastUnseenMessageTimestamp" = (
         SELECT timestamp FROM messages WHERE id=$1
       )
       WHERE "threadID"=$2 AND "userID"!=$3
       RETURNING "userID";`,
      { bind: [messageID, threadID, userID], transaction },
    )) as [any[], any];

    const notify = async () => {
      const location = await this.getLocation(threadID);
      await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
        rows.map(({ userID }) => {
          return publishPubSubEvent(
            'inbox-updated',
            { userID },
            { threadID, location },
          );
        }),
      );
    };

    if (transaction) {
      transaction.afterCommit(notify);
    } else {
      await notify();
    }
  }

  /**
   * This function marks the thread active for the participant who has received
   * the reaction, by setting the lastUnseenReactionTimestamp to that of the given reaction.
   * This is called when a logged in user reacts to someone's message.
   */
  async markThreadNewlyActiveForUser(
    threadID: UUID,
    reactionID: UUID,
    userID: UUID,
    transaction?: Transaction,
  ) {
    assertViewerHasUser(this.viewer);

    // Disabled if the user is reacting to their own message
    if (userID === this.viewer.userID) {
      return;
    }

    await getSequelize().query(
      `UPDATE thread_participants
       SET "lastUnseenReactionTimestamp" = (
         SELECT timestamp FROM message_reactions WHERE id=$1
       )
       WHERE "threadID"=$2 AND "userID"=$3
       RETURNING "userID";`,
      { bind: [reactionID, threadID, userID], transaction },
    );

    const notify = async () => {
      const location = await this.getLocation(threadID);
      return await publishPubSubEvent(
        'inbox-updated',
        { userID },
        { threadID, location },
      );
    };

    if (transaction) {
      transaction.afterCommit(notify);
    } else {
      await notify();
    }
  }

  async updateLastUnseenMessageTimestamp(threadID: UUID, orgID: UUID) {
    // This function is called when a message is deleted/restored, and is
    // expected to update the lastUnseenMessageTimestamp field, which means
    // it has to calculate, for each thread participant, what is the most
    // recent message since they last saw the thread.

    const threadLoader = await this.threadLoader();

    // 1. retrieve all participants for this thread
    // and check if thread has user messages
    const [participants, threadHasUserMessages] = await Promise.all([
      ThreadParticipantEntity.findAll({
        where: { threadID: threadID, orgID },
      }),
      threadLoader.hasUserMessagesNoOrgCheck(threadID),
    ]);

    if (threadHasUserMessages) {
      // 2. retrieve the latest unseen message by each of them
      const lastUnseenMessages = await Promise.all(
        participants.map(({ userID, lastSeenTimestamp }) => {
          let whereOptions: WhereOptions<MessageEntity> = {
            threadID,
            sourceID: { [Op.ne]: userID },
            orgID,
            deletedTimestamp: { [Op.is]: null },
          };

          if (lastSeenTimestamp !== null) {
            whereOptions = {
              ...whereOptions,
              // if lastSeenTimestamp is null, Postgres does not consider
              // message.timestamp to be GT than lastSeenTimestamp so the row
              // is not returned.  This means the lastUnseenMessageTimestamp on the
              // Thread Participant Entities can get overwritten by null in step 3 below
              // if a user had seen none of the messages in the thread,
              // and the message incorrectly appears in the 'read' section of the inbox
              // because it seems like the user has seen all the messages
              timestamp: { [Op.gt]: lastSeenTimestamp },
            };
          }

          return MessageEntity.findOne({
            where: {
              ...whereOptions,
            },
            order: [['timestamp', 'DESC']],
          });
        }),
      );

      // 3. update the lastUnseenMessageTimestamp for each participant,
      await Promise.all(
        participants.map(({ userID }, index) =>
          ThreadParticipantEntity.update(
            {
              lastUnseenMessageTimestamp: lastUnseenMessages[index]
                ? lastUnseenMessages[index]?.timestamp
                : null,
            },
            { where: { threadID, userID, orgID } },
          ),
        ),
      );
    } else {
      // In the case where there are no user messages
      // we update the lastUnseenMessageTimestamp for each participant as null
      await ThreadParticipantEntity.update(
        {
          lastUnseenMessageTimestamp: null,
        },
        { where: { threadID, orgID } },
      );
    }

    // 4. notify users via pubsub
    const location = await this.getLocation(threadID);
    await Promise.all(
      participants.map(({ userID }) =>
        publishPubSubEvent('inbox-updated', { userID }, { threadID, location }),
      ),
    );
  }

  async setViewerSubscribed(
    thread: ThreadEntity,
    subscribed: boolean,
    transaction?: Transaction,
  ): Promise<true> {
    const userID = assertViewerHasUser(this.viewer);

    await ThreadParticipantEntity.upsert(
      { threadID: thread.id, userID, orgID: thread.orgID, subscribed },
      {
        transaction,
      },
    );

    const notify = async () => {
      const location = await this.getLocation(thread.id);
      await Promise.all([
        publishPubSubEvent(
          'inbox-updated',
          { userID },
          { threadID: thread.id, location },
        ),
        publishPubSubEvent(
          'thread-subscriber-updated',
          { threadID: thread.id },
          { userID },
        ),
      ]);
    };

    if (transaction) {
      transaction.afterCommit(notify);
    } else {
      await notify();
    }

    return true;
  }
}
