import type { Request, Response } from 'express';
import {
  forwardHandlerExceptionsToNext,
  ApiCallerError,
} from 'server/src/public/routes/platform/util.ts';
import { loadThread } from 'server/src/public/routes/platform/threads/GetThreadHandler.ts';
import { loadThreadMessage } from 'server/src/public/routes/platform/messages/util.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';

async function DeleteThreadMessageHandler(req: Request, res: Response) {
  const platformApplicationID = req.appID;
  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_access_token');
  }

  const externalThreadID = req.params.threadID;
  const thread = await loadThread(platformApplicationID, externalThreadID);
  if (!thread) {
    throw new ApiCallerError('thread_not_found');
  }

  const externalMessageID = req.params.messageID;
  const message = await loadThreadMessage(thread.id, externalMessageID);

  if (!message) {
    throw new ApiCallerError('message_not_found');
  }

  await message.destroy();

  backgroundPromise(
    publishPubSubEvent(
      'thread-message-removed',
      { threadID: thread.id },
      { messageID: message.id },
    ),
  );

  return res.status(200).json({
    success: true,
    message: `💀 You successfully deleted message ${req.params.messageID}`,
  });
}

export default forwardHandlerExceptionsToNext(DeleteThreadMessageHandler);
