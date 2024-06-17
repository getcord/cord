import type { Attributes, WhereOptions } from 'sequelize';
import { QueryTypes, Op } from 'sequelize';
import DataLoader from 'dataloader';

import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import type { UUID } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { inKeyOrder } from 'server/src/entity/base/util.ts';
import { INITIAL_MESSAGES_COUNT } from 'common/const/Api.ts';
import { timestampSubquery } from 'server/src/entity/common.ts';
import { isDefined } from 'common/util/index.ts';
import type { RequestContextLoadersInternal } from 'server/src/RequestContextLoaders.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import { asyncFilter } from 'common/util/asyncFilter.ts';

// Don't let clients hammer our database with outrageous requests
const MAX_LIMIT = 100;

interface LoadMessagesArgs {
  cursor?: UUID;
  range?: number | 'unlimited';
  ignoreDeleted?: boolean;
}

export class MessageLoader {
  dataloader: DataLoader<UUID, MessageEntity | null>;

  constructor(
    private viewer: Viewer,
    private loaders: () => RequestContextLoadersInternal,
  ) {
    this.dataloader = new DataLoader(
      async (keys) => {
        const where: WhereOptions<Attributes<MessageEntity>> = {
          id: keys as UUID[],
        };

        if (this.viewer.platformApplicationID) {
          where.platformApplicationID = this.viewer.platformApplicationID;
        } else {
          // all orgs a user is in within a platform, or their slack org
          const orgIDs =
            await this.loaders().orgMembersLoader.loadAllImmediateOrgIDsForUser();

          // org that the viewer org is 'linked' to (platform with slack or
          // vice versa)
          const viewerLinkedOrgID =
            await this.loaders().linkedOrgsLoader.getAllConnectedOrgIDs();

          // In the case of Slack imported messages the viewer orgID is not actually
          // one of the orgIDs returned above, because the viewer userID is a Slack
          // user, while the viewer orgID is the platform org
          const allOrgIDs = [
            ...new Set([viewer.orgID, ...orgIDs, ...viewerLinkedOrgID]),
          ].filter(isDefined);

          where.orgID = allOrgIDs;
        }

        const messages = await MessageEntity.findAll({
          where,
        });

        const filteredMessages = this.viewer.platformApplicationID
          ? await asyncFilter(messages, (m) =>
              this.loaders().privacyLoader.viewerHasMessage(m),
            )
          : messages;

        return inKeyOrder(filteredMessages, keys);
      },
      { cache: false },
    );
  }

  // Making sure we get both platform and slack orgID, so we load all messages
  private async getAllOrgIDs() {
    // all orgs a user is in within a platform, or their slack org
    const orgIDs =
      await this.loaders().orgMembersLoader.loadAllImmediateOrgIDsForUser();

    // org that the viewer org is 'linked' to (platform with slack or
    // vice versa)
    const linkedOrgID =
      await this.loaders().linkedOrgsLoader.getAllConnectedOrgIDs();

    // In the case of Slack imported messages the viewer orgID is not actually
    // one of the orgIDs returned above, because the viewer userID is a Slack
    // user, while the viewer orgID is the platform org
    return [...new Set([...orgIDs, ...linkedOrgID])];
  }

  async loadMessage(id: UUID) {
    try {
      return await this.dataloader.load(id);
    } catch (e) {
      anonymousLogger().logException('Message dataloader error', e);
      return null;
    }
  }

  async loadMessageByExternalID(
    externalID: string,
    platformApplicationID: UUID,
  ) {
    try {
      const message = await MessageEntity.findOne({
        where: { externalID, platformApplicationID },
      });
      const canSee =
        await this.loaders().privacyLoader.viewerHasMessage(message);
      return canSee ? message : null;
    } catch (e) {
      anonymousLogger().logException('Message load error', e);
      return null;
    }
  }

  // This method will return args.range number of messages which are not deleted.
  // It will then add all deleted messages with timestamps within the range of
  // timestamps of the returned messages.
  private async loadOlderMessages(args: LoadMessagesArgs & { threadID: UUID }) {
    const allOrgIDs = await this.getAllOrgIDs();

    return await getSequelize().query<MessageEntity>(
      `WITH
      upper_cursor_message AS (
        SELECT m.timestamp FROM messages m WHERE id=$1
      ),
      lower_cursor_message AS (
        SELECT m.timestamp FROM messages m
        LEFT OUTER JOIN upper_cursor_message ucm ON TRUE
        WHERE "threadID"=$2
        AND "orgID"=ANY($3)
        AND "deletedTimestamp" IS NULL
        AND m.timestamp < COALESCE(ucm.timestamp, 'infinity')
        ORDER BY m.timestamp DESC OFFSET $4-1 LIMIT 1
      )
      SELECT m.*
        FROM messages m
        LEFT OUTER JOIN upper_cursor_message ucm ON TRUE
        LEFT OUTER JOIN lower_cursor_message lcm ON TRUE
        WHERE "threadID"=$2
        AND "orgID"=ANY($3)
        AND m.timestamp <= COALESCE(ucm.timestamp, 'infinity')
        AND m.timestamp >= COALESCE(lcm.timestamp, '-infinity')
        ORDER BY m.timestamp ASC;`,
      {
        type: QueryTypes.SELECT,
        model: MessageEntity,
        bind: [
          args.cursor ?? null,
          args.threadID,
          allOrgIDs,
          typeof args.range === 'number'
            ? Math.min(MAX_LIMIT, Math.abs(args.range))
            : INITIAL_MESSAGES_COUNT,
        ],
      },
    );
  }

  // Note this will only genuinely return all messages if args.range is 'unlimited'
  // In general this should be avoided, to prevent excessive requests being made
  private async loadAll(args: LoadMessagesArgs & { where: WhereOptions }) {
    const allOrgIDs = await this.getAllOrgIDs();
    args.where = { ...args.where, orgID: allOrgIDs };

    let range;
    if (typeof args.range === 'undefined') {
      // Default if no range arg specified
      range = -INITIAL_MESSAGES_COUNT;
    }
    if (typeof args.range === 'number') {
      // Return the number specified, but cap at MAX_LIMIT if applicable
      range = Math.sign(args.range) * Math.min(MAX_LIMIT, Math.abs(args.range));
    }
    if (args.range === 'unlimited') {
      // For limited use cases: actually return ALL messages
      range = undefined;
    }

    if (args.cursor) {
      // If the range is positive, go forward from the cursor
      args.where = {
        ...args.where,
        timestamp: {
          [range && range > 0 ? Op.gt : Op.lt]: timestampSubquery(args.cursor),
        },
      };
    }

    if (args.ignoreDeleted) {
      args.where = {
        ...args.where,
        deletedTimestamp: { [Op.is]: null },
      };
    }

    // Get `Math.abs(range)` messages. To select the right messages (in
    // combination with the WHERE condition on timestamp above), we need to
    // order the messages here in descending timestamp order if `range < 0`,
    // or ascending if `range > 0`.
    const messages = await MessageEntity.findAll({
      where: args.where,
      // Intentional array of arrays here
      order: [['timestamp', range && range < 0 ? 'DESC' : 'ASC']],
      limit: range ? Math.abs(range) : undefined,
    });

    // Always return messages in chronological order, i.e. with ascending
    // timestamps.
    return messages.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );
  }

  async loadMessagesFromMultipleThreads(
    args: LoadMessagesArgs & { threadIDs: UUID[] },
  ): Promise<MessageEntity[]> {
    const where: WhereOptions<MessageEntity> = {
      threadID: args.threadIDs,
    };

    return await this.loadAll({ ...args, where });
  }

  async loadMessages(
    args: LoadMessagesArgs & { threadID: UUID },
  ): Promise<MessageEntity[]> {
    const where: WhereOptions<MessageEntity> = {
      threadID: args.threadID,
    };
    if (args.ignoreDeleted === true && args.range !== 'unlimited') {
      return await this.loadAll({ ...args, where });
    }

    return await this.loadOlderMessages({ ...args, threadID: args.threadID });
  }

  // loads the newest messages back until (and including) a specified message
  async loadNewestUntilTarget({
    threadID,
    targetMessage,
  }: {
    threadID: UUID;
    targetMessage: UUID;
  }): Promise<MessageEntity[]> {
    const orgIDs =
      await this.loaders().orgMembersLoader.loadAllImmediateOrgIDsForUser();

    const messages = await MessageEntity.findAll({
      where: {
        threadID,
        orgID: orgIDs,
        timestamp: {
          [Op.gte]: timestampSubquery(targetMessage),
        },
        deletedTimestamp: { [Op.is]: null },
      },
    });

    // Always return messages in chronological order, i.e. with ascending
    // timestamps.
    return messages.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );
  }
}
