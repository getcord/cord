import type { WhereOptions } from 'sequelize';
import { Op } from 'sequelize';
import DataLoader from 'dataloader';
import { unique } from 'radash';
import type { UUID } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import {
  assertViewerHasIdentity,
  assertViewerHasUser,
} from 'server/src/auth/index.ts';
import { ThreadParticipantEntity } from 'server/src/entity/thread_participant/ThreadParticipantEntity.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { OrgMembersLoader } from 'server/src/entity/org_members/OrgMembersLoader.ts';
import {
  inKeyOrderGroupedCustom,
  inKeyOrderOrNullCustom,
} from 'server/src/entity/base/util.ts';
import type { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { UserLoader } from 'server/src/entity/user/UserLoader.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import type { RequestContextLoadersInternal } from 'server/src/RequestContextLoaders.ts';
import { asyncFilter } from 'common/util/asyncFilter.ts';

export class ThreadParticipantLoader {
  loadForUserNoOrgCheckDataloader: DataLoader<
    { userID: UUID; threadID: UUID },
    ThreadParticipantEntity | null
  >;
  loadForThreadIDNoOrgCheckDataloader: DataLoader<
    UUID,
    ThreadParticipantEntity[]
  >;

  constructor(
    private viewer: Viewer,
    private loaders: () => RequestContextLoadersInternal,
  ) {
    this.loadForUserNoOrgCheckDataloader = new DataLoader(
      async (userThreadPairs) => {
        function getKey(x: { threadID: UUID; userID: UUID }) {
          return `${x.threadID}/${x.userID}`;
        }

        const uniqPairs = unique(userThreadPairs, getKey);

        const all = await ThreadParticipantEntity.findAll({
          where: { [Op.or]: [...uniqPairs] },
        });

        // We can't directly match up `all` with `userThreadPairs` since the
        // pairs are not simple strings (they are, well, pairs). So we use
        // `getKey` to match up the two -- turn the pairs into keys (preserving
        // their order from the original `userThreadPairs`), at which point we
        // can use `inKeyOrder` family functions to match everything up.
        return inKeyOrderOrNullCustom(all, userThreadPairs.map(getKey), getKey);
      },
      { cache: false },
    );

    this.loadForThreadIDNoOrgCheckDataloader = new DataLoader(
      async (keys) => {
        const participants = await ThreadParticipantEntity.findAll({
          where: { threadID: unique(keys) },
        });
        return inKeyOrderGroupedCustom(participants, keys, (p) => p.threadID);
      },
      { cache: false },
    );
  }

  async loadForThreadIDNoOrgCheck(
    threadID: UUID,
  ): Promise<ThreadParticipantEntity[]> {
    const participants =
      await this.loadForThreadIDNoOrgCheckDataloader.load(threadID);
    return await asyncFilter(
      participants,
      async (p) => await this.loaders().privacyLoader.viewerHasParticipant(p),
    );
  }

  async loadForUser(args: {
    threadID: UUID;
    userID: UUID;
  }): Promise<ThreadParticipantEntity | null> {
    const { orgID } = assertViewerHasIdentity(this.viewer);
    const participant = await ThreadParticipantEntity.findOne({
      where: { threadID: args.threadID, orgID, userID: args.userID },
    });
    const canSee =
      await this.loaders().privacyLoader.viewerHasParticipant(participant);
    return canSee ? participant : null;
  }

  async loadForUserNoOrgCheck(args: { threadID: UUID; userID: UUID }) {
    return await this.loadForUserNoOrgCheckDataloader.load(args);
  }

  async loadNewlyActiveThreads(): Promise<UUID[]> {
    const userID = assertViewerHasUser(this.viewer);

    const orgMembersLoader = new OrgMembersLoader(this.viewer);
    const orgIDFilter = await orgMembersLoader.loadAllImmediateOrgIDsForUser();

    const lastUnseenCondition = {
      [Op.or]: [
        { lastUnseenMessageTimestamp: { [Op.ne]: null } },
        { lastUnseenReactionTimestamp: { [Op.ne]: null } },
      ],
    };

    const threadParticipantEntities = await ThreadParticipantEntity.findAll({
      where: {
        userID,
        orgID: orgIDFilter,
        subscribed: true,
        ...lastUnseenCondition,
      },
      order: [['lastUnseenMessageTimestamp', 'DESC']],
    });

    return (
      await asyncFilter(
        threadParticipantEntities,
        async (p) => await this.loaders().privacyLoader.viewerHasParticipant(p),
      )
    ).map(({ threadID }) => threadID);
  }

  async loadSubscriberIDsForThreadNoOrgCheck(threadID: UUID): Promise<UUID[]> {
    return (
      await ThreadParticipantEntity.findAll({
        where: {
          threadID,
          subscribed: true,
        },
      })
    ).map((p) => p.userID);
  }

  async loadSubscribedNoOrgCheck(threadID: UUID) {
    const userID = assertViewerHasUser(this.viewer);

    const data = await this.loadForUserNoOrgCheck({
      userID,
      threadID,
    });

    return data?.subscribed === true;
  }

  async isViewerThreadParticipantNoOrgCheck(threadID: UUID) {
    const userID = assertViewerHasUser(this.viewer);

    const threadParticipant = await this.loadForUserNoOrgCheck({
      userID,
      threadID,
    });

    return threadParticipant ? true : false;
  }

  async loadInboxCount() {
    const userID = assertViewerHasUser(this.viewer);

    const orgMembersLoader = new OrgMembersLoader(this.viewer);
    const orgIDFilter = await orgMembersLoader.loadAllImmediateOrgIDsForUser();

    const lastUnseenCondition = {
      [Op.or]: [
        { lastUnseenMessageTimestamp: { [Op.not]: null } },
        { lastUnseenReactionTimestamp: { [Op.not]: null } },
      ],
    };

    const where: WhereOptions<ThreadParticipantEntity> = {
      userID,
      orgID: orgIDFilter,
      subscribed: true,
      ...lastUnseenCondition,
    };

    return await ThreadParticipantEntity.count({ where });
  }

  async loadThreadsInArchive(): Promise<UUID[]> {
    const userID = assertViewerHasUser(this.viewer);

    const orgMembersLoader = new OrgMembersLoader(this.viewer);

    const orgIDFilter = await orgMembersLoader.loadAllImmediateOrgIDsForUser();

    // This query loads the most recently active 20 channels that:
    // - the user participates in
    // - the user is subscribed to
    // - the channel is not in user's inbox
    // The subquery computes latest activity timestamp for each threadID. The
    // outer query only takes the latest 20.
    const [rows] = await getSequelize().query(
      `
      SELECT
        subquery."threadID" as id
      FROM (
        SELECT
          DISTINCT ON (tp."threadID")
          tp."threadID",
          m."timestamp"
        FROM
          thread_participants as tp,
          messages as m
        WHERE
          tp."userID" = $1
          AND tp."orgID" = ANY($2)
          AND tp."subscribed" = TRUE
          AND tp."lastUnseenMessageTimestamp" IS NULL
          AND tp."threadID" = m."threadID"
          AND m."deletedTimestamp" IS NULL
        ORDER BY
          tp."threadID",
          m."timestamp" DESC
      ) as subquery
      ORDER BY
        subquery."timestamp" DESC
      LIMIT 20;`,
      {
        bind: [userID, orgIDFilter],
      },
    );
    return rows.map((row: any) => row.id);
  }

  async loadSeenByUsers(message: MessageEntity): Promise<UserEntity[]> {
    const timestamp = message.lastUpdatedTimestamp ?? message.timestamp;
    const seenByUsers = await ThreadParticipantEntity.findAll({
      where: {
        threadID: message.threadID,
        [Op.or]: {
          lastSeenTimestamp: { [Op.not]: null, [Op.gt]: timestamp },
          // A user has always seen their own messages
          userID: message.sourceID,
        },
      },
    });
    const userIDs = (
      await asyncFilter(
        seenByUsers,
        async (p) => await this.loaders().privacyLoader.viewerHasParticipant(p),
      )
    ).map((user: ThreadParticipantEntity) => user.userID);
    const userLoader = new UserLoader(this.viewer, this.loaders, false);
    const users = await userLoader.loadUsersInOrg(userIDs, message.orgID);
    return users;
  }
}
