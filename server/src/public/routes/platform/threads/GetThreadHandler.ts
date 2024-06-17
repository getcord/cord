import type { Request, Response } from 'express';
import { Op, QueryTypes } from 'sequelize';
import type { WhereOptions } from 'sequelize';
import { getNewLoaders } from 'server/src/RequestContextLoaders.ts';

import {
  externalizeID,
  extractInternalID,
  isExternalizedID,
} from 'common/util/externalIDs.ts';
import {
  ApiCallerError,
  forwardHandlerExceptionsToNext,
} from 'server/src/public/routes/platform/util.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { ThreadParticipantEntity } from 'server/src/entity/thread_participant/ThreadParticipantEntity.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { PageEntity } from 'server/src/entity/page/PageEntity.ts';
import { getUsersTyping } from 'server/src/presence/typing.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { Viewer } from 'server/src/auth/index.ts';
import { userDisplayName } from 'server/src/entity/user/util.ts';
import type { ThreadLoader } from 'server/src/entity/thread/ThreadLoader.ts';
import { getCoreThreadData } from 'server/src/public/routes/platform/threads/util/getCoreThreadData.ts';

export async function loadTypingUsers(threadID: string) {
  const typingUserIDs = await getUsersTyping(threadID);

  const users = await UserEntity.findAll({
    where: { id: typingUserIDs },
  });

  return users.map((u) => u.externalID);
}

export async function loadUserMessagesCount(threadID: string) {
  return await MessageEntity.count({
    where: { threadID, type: 'user_message', deletedTimestamp: null },
  });
}

export async function loadActionMessagesCount(threadID: string) {
  return await MessageEntity.count({
    where: { threadID, type: 'action_message', deletedTimestamp: null },
  });
}

export async function loadDeletedMessagesCount(threadID: string) {
  return await MessageEntity.count({
    where: { threadID, deletedTimestamp: { [Op.not]: null } },
  });
}

export async function loadParticipants(threadID: string) {
  const participants = await ThreadParticipantEntity.findAll({
    where: { threadID },
  });

  const users = await UserEntity.findAll({
    where: { id: participants.map((p) => p.userID) },
  });

  const userMap = new Map<string, UserEntity>();
  users.forEach((u) => userMap.set(u.id, u));

  return participants.map((p) => {
    const u = userMap.get(p.userID);
    return {
      lastSeenTimestamp: p.lastSeenTimestamp,
      userID: u ? u.externalID ?? externalizeID(u.id) : null,
      displayName: u?.name
        ? userDisplayName({ name: u.name, screenName: u.screenName })
        : null,
    };
  });
}

export async function loadSubscribers(threadID: string) {
  const subscribers = await getSequelize().query(
    `
    SELECT "externalID" FROM cord.users u
    LEFT JOIN cord.thread_participants as tp on tp."userID"=u.id
    WHERE tp."threadID"=$1
    AND tp.subscribed IS TRUE;
  `,
    { bind: [threadID], type: QueryTypes.SELECT, model: UserEntity },
  );
  return subscribers.map((u) => u.externalID);
}

export async function loadMentioned(threadID: string) {
  const mentioned = await getSequelize().query<{ externalID: string }>(
    `
      SELECT DISTINCT u."externalID" FROM users u
      INNER JOIN message_mentions mm ON (u.id = mm."userID")
      INNER JOIN messages m ON (mm."messageID" = m.id)
      WHERE m."threadID" = $1
    `,
    {
      bind: [threadID],
      type: QueryTypes.SELECT,
    },
  );
  return mentioned.map((u) => u.externalID);
}

export async function loadRepliers(
  threadLoader: ThreadLoader,
  threadID: string,
) {
  const replyingUsers =
    await threadLoader.loadReplyingUserIDsNoOrgCheck(threadID);

  const users = await UserEntity.findAll({
    where: { id: replyingUsers },
  });

  return users.map((user) => user.externalID);
}

export async function loadActionMessageRepliers(
  threadLoader: ThreadLoader,
  threadID: string,
) {
  const replyingUsers =
    await threadLoader.loadActionMessageReplyingUserIDsNoOrgCheck(threadID);

  const users = await UserEntity.findAll({
    where: { id: replyingUsers },
  });

  return users.map((user) => user.externalID);
}

export async function loadThread(
  platformApplicationID: string,
  externalID: string,
) {
  if (!externalID) {
    throw new ApiCallerError('thread_not_found');
  }

  const where: WhereOptions<ThreadEntity> = { platformApplicationID };
  if (isExternalizedID(externalID)) {
    const internalID = extractInternalID(externalID);
    if (!internalID) {
      throw new ApiCallerError('invalid_request', {
        message: `${externalID} is not a valid thread ID`,
      });
    }
    where.id = internalID;
  } else {
    where.externalID = externalID;
  }

  return await ThreadEntity.findOne({ where });
}

export async function getThreadLocation(thread: ThreadEntity) {
  const page = await PageEntity.findOne({
    where: { orgID: thread.orgID, contextHash: thread.pageContextHash },
  });

  if (!page) {
    throw new Error('Unable to find thread location');
  }

  return page.contextData;
}

async function getThreadHandler(req: Request, res: Response) {
  const platformApplicationID = req.appID;
  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_access_token');
  }

  const thread = await loadThread(platformApplicationID, req.params.threadID);
  if (!thread) {
    throw new ApiCallerError('thread_not_found');
  }
  const loaders = await getNewLoaders(
    Viewer.createOrgViewer(thread.orgID, thread.platformApplicationID),
  );
  const result = await getCoreThreadData(loaders, thread);

  return res.status(200).json(result);
}

export default forwardHandlerExceptionsToNext(getThreadHandler);
