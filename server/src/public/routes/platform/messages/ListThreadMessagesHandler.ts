import type { Request, Response } from 'express';
import {
  extractInternalID,
  isValidExternalID,
} from 'common/util/externalIDs.ts';
import {
  forwardHandlerExceptionsToNext,
  ApiCallerError,
} from 'server/src/public/routes/platform/util.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { getCoreMessageData } from 'server/src/public/routes/platform/messages/getCoreMessageData.ts';
import { getNewLoaders } from 'server/src/RequestContextLoaders.ts';
import { Viewer } from 'server/src/auth/index.ts';

async function listThreadMessagesHandler(req: Request, res: Response) {
  const platformApplicationID = req.appID;
  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_access_token');
  }

  const externalThreadID = req.params.threadID;
  if (!externalThreadID) {
    throw new ApiCallerError('thread_not_found', {
      message: 'Missing thread ID.',
    });
  }

  let internalThreadID: string | null = null;
  if (!isValidExternalID(externalThreadID)) {
    internalThreadID = extractInternalID(externalThreadID);
    if (!internalThreadID) {
      throw new ApiCallerError('invalid_request', {
        message: 'thread ID is invalid',
      });
    }
  }

  const sortDirection = req.query.sortDirection?.toString().toUpperCase();

  let thread: ThreadEntity | null = null;
  if (internalThreadID) {
    thread = await ThreadEntity.findOne({
      where: {
        id: internalThreadID,
        platformApplicationID,
      },
    });
  } else {
    thread = await ThreadEntity.findOne({
      where: {
        externalID: externalThreadID,
        platformApplicationID,
      },
    });
  }

  if (!thread) {
    throw new ApiCallerError('thread_not_found', { code: 404 });
  }

  let order = undefined;

  // Default to descending
  if (!sortDirection || sortDirection === 'DESCENDING') {
    order = 'DESC';
  }

  if (sortDirection === 'ASCENDING') {
    order = 'ASC';
  }

  if (!order) {
    throw new ApiCallerError('invalid_request', {
      message:
        "sortDirection value is invalid: must be 'ascending' or 'descending'",
    });
  }

  const messages = await MessageEntity.findAll({
    where: {
      threadID: thread.id,
    },
    order: [['timestamp', order]],
  });

  if (messages.length <= 0) {
    return res.status(200).json([]);
  }

  const loaders = await getNewLoaders(
    Viewer.createOrgViewer(thread.orgID, platformApplicationID),
  );

  // Not sure why TS knows that thread isn't null out here but forgets that
  // inside the map below? Work around.
  const threadNotNull = thread;
  const results = await Promise.all(
    messages.map(
      async (msg) => await getCoreMessageData(loaders, msg, threadNotNull),
    ),
  );

  return res.status(200).json(results);
}

export default forwardHandlerExceptionsToNext(listThreadMessagesHandler);
