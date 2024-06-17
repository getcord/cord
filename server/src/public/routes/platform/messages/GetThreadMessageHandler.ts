import type { Request, Response } from 'express';

import {
  extractInternalID,
  isExternalizedID,
} from 'common/util/externalIDs.ts';
import {
  forwardHandlerExceptionsToNext,
  ApiCallerError,
} from 'server/src/public/routes/platform/util.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { getCoreMessageData } from 'server/src/public/routes/platform/messages/getCoreMessageData.ts';
import { getNewLoaders } from 'server/src/RequestContextLoaders.ts';
import { Viewer } from 'server/src/auth/index.ts';

async function getThreadMessageHandler(req: Request, res: Response) {
  const platformApplicationID = req.appID;
  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_access_token');
  }

  const externalThreadID = req.params.threadID;
  if (!externalThreadID) {
    throw new ApiCallerError('thread_not_found');
  }

  let internalThreadID = null;
  if (isExternalizedID(externalThreadID)) {
    internalThreadID = extractInternalID(externalThreadID);
    if (!internalThreadID) {
      throw new ApiCallerError('invalid_request', {
        message: 'thread ID is not valid',
      });
    }
  }

  let thread: ThreadEntity | null = null;
  if (internalThreadID) {
    thread = await ThreadEntity.findOne({
      where: {
        id: internalThreadID,
        platformApplicationID: req.appID,
      },
    });
  } else {
    thread = await ThreadEntity.findOne({
      where: {
        externalID: externalThreadID,
        platformApplicationID: req.appID,
      },
    });
  }

  if (!thread) {
    throw new ApiCallerError('thread_not_found');
  }

  const externalMessageID = req.params.messageID;
  if (!externalMessageID) {
    throw new ApiCallerError('message_not_found');
  }

  let internalMessageID = null;
  if (isExternalizedID(externalMessageID)) {
    internalMessageID = extractInternalID(externalMessageID);
    if (!internalMessageID) {
      throw new ApiCallerError('invalid_request', {
        message: 'message ID is not valid',
      });
    }
  }

  let message: MessageEntity | null = null;
  if (internalMessageID) {
    message = await MessageEntity.findOne({
      where: {
        id: internalMessageID,
        threadID: thread.id,
      },
    });
  } else {
    message = await MessageEntity.findOne({
      where: {
        externalID: externalMessageID,
        threadID: thread.id,
      },
    });
  }

  if (!message) {
    throw new ApiCallerError('message_not_found');
  }

  const loaders = await getNewLoaders(
    Viewer.createOrgViewer(thread.orgID, platformApplicationID),
  );

  const result = await getCoreMessageData(loaders, message, thread);
  return res.status(200).json(result);
}

export default forwardHandlerExceptionsToNext(getThreadMessageHandler);
