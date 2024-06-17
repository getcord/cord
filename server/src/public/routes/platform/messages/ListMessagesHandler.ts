import type { Request, Response } from 'express';
import type { WhereOptions } from 'sequelize';
import { Op, Sequelize } from 'sequelize';
import {
  forwardHandlerExceptionsToNext,
  ApiCallerError,
} from 'server/src/public/routes/platform/util.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { getCoreMessageData } from 'server/src/public/routes/platform/messages/getCoreMessageData.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import type { RequestContextLoaders } from 'server/src/RequestContextLoaders.ts';
import { getNewLoaders } from 'server/src/RequestContextLoaders.ts';
import { Viewer } from 'server/src/auth/index.ts';
import {
  validatePaginationToken,
  validateFilter,
  validateLimit,
} from 'server/src/public/routes/platform/validateQuery.ts';
import { PageEntity } from 'server/src/entity/page/PageEntity.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';

const DEFAULT_LIMIT = 1000;

export interface ListMessagesPaginationToken {
  externalID: string;
  createdAtWithMicros: string;
}

function encodeToken(token: ListMessagesPaginationToken): string {
  return btoa(JSON.stringify(token));
}

async function listMessagesHandler(req: Request, res: Response) {
  const platformApplicationID = req.appID;
  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_access_token');
  }

  const { location, metadata, authorID, groupID } = validateFilter(req.query, {
    location: true,
    metadata: true,
    firstMessageTimestamp: false,
    mostRecentMessageTimestamp: false,
    groupID: true,
    authorID: true,
    resolvedStatus: false,
    viewer: false,
  });
  const { token, limit } = req.query;
  const decodedToken: ListMessagesPaginationToken | undefined =
    validatePaginationToken({ token, endpoint: 'messages' });

  const where: WhereOptions<MessageEntity> = {
    platformApplicationID,
  };
  let whereIncludedThread: WhereOptions<ThreadEntity> = {};

  if (metadata) {
    where['metadata'] = metadata;
  }

  if (location) {
    const pages = await PageEntity.findAll({
      where: {
        contextData: location.partialMatch
          ? { [Op.contains]: location.value }
          : { [Op.eq]: location.value },
      },
    });

    whereIncludedThread = {
      pageContextHash: pages.map((page) => page.contextHash),
    };
  }

  if (groupID) {
    const orgEntity = await OrgEntity.findOne({
      where: { externalID: groupID, platformApplicationID },
    });

    if (!orgEntity) {
      throw new ApiCallerError('group_not_found');
    }

    where['orgID'] = orgEntity.id;
  }

  if (authorID) {
    const user = await UserEntity.findOne({
      where: {
        externalID: authorID,
        platformApplicationID,
      },
    });
    if (!user) {
      throw new ApiCallerError('user_not_found');
    }
    where['sourceID'] = user?.id;
  }

  const bind = [];

  const whereWithPagination: WhereOptions<MessageEntity> = {
    ...where,
    ...(decodedToken && {
      [Op.or]: [
        Sequelize.literal(`timestamp > $1`),
        {
          [Op.and]: [
            Sequelize.literal(`timestamp = $1`),
            {
              externalID: {
                [Op.gt]: decodedToken.externalID,
              },
            },
          ],
        },
      ],
    }),
  };
  if (decodedToken) {
    bind.push(decodedToken?.createdAtWithMicros);
  }

  const resultsLimit = validateLimit(limit, DEFAULT_LIMIT);
  const [untypedMessages, messagesCount] = await Promise.all([
    MessageEntity.findAll({
      where: whereWithPagination,
      bind,
      order: [
        ['timestamp', 'ASC'],
        ['externalID', 'ASC'],
      ],
      limit: resultsLimit,
      include: [
        {
          model: ThreadEntity,
          required: true,
          as: 'thread',
          where: whereIncludedThread,
        },
      ],
    }),
    MessageEntity.count({
      where,
      include: [
        {
          model: ThreadEntity,
          required: true,
          as: 'thread',
          where: whereIncludedThread,
          attributes: [],
        },
      ],
    }),
  ]);

  const messages = untypedMessages as (MessageEntity & {
    thread: ThreadEntity;
  })[];

  // Given that many messages will share the same Thread and many Threads
  // will share the same Org, let's just create loaders once for each Org
  // This will enable us to reuse loaders when loading message data which
  // should help with performance
  const perOrgLoadersMap = new Map<string, RequestContextLoaders>();
  await Promise.all(
    Array.from(new Set(messages.map((msg) => msg.thread.orgID))).map(
      async (orgID) => {
        const loaders = await getNewLoaders(
          Viewer.createOrgViewer(orgID, platformApplicationID),
        );
        perOrgLoadersMap.set(orgID, loaders);
      },
    ),
  );

  const results = await Promise.all(
    messages.map(async (msg) => {
      return await getCoreMessageData(
        perOrgLoadersMap.get(msg.thread.orgID)!,
        msg,
        msg.thread,
      );
    }),
  );

  const lastMessage =
    messages.length === 0 ? null : messages[messages.length - 1];

  const returnToken =
    messages.length === resultsLimit && lastMessage
      ? encodeToken({
          externalID: lastMessage.externalID,
          createdAtWithMicros: lastMessage.createdAtWithMicros,
        })
      : null;

  const result = {
    messages: results,
    pagination: {
      token: returnToken,
      total: messagesCount,
    },
  };

  return res.status(200).json(result);
}

export default forwardHandlerExceptionsToNext(listMessagesHandler);
