import type { Request, Response } from 'express';
import { loadThread } from 'server/src/public/routes/platform/threads/GetThreadHandler.ts';
import {
  ApiCallerError,
  forwardHandlerExceptionsToNext,
} from 'server/src/public/routes/platform/util.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';

async function deleteThreadHandler(req: Request, res: Response) {
  const platformApplicationID = req.appID;
  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_access_token');
  }

  const thread = await loadThread(platformApplicationID, req.params.threadID);
  if (!thread) {
    throw new ApiCallerError('thread_not_found');
  }

  await thread.destroy();

  backgroundPromise(
    Promise.all([
      publishPubSubEvent(
        'thread-deleted',
        { threadID: thread.id },
        { threadID: thread.id },
      ),
      publishPubSubEvent(
        'page-thread-deleted',
        { orgID: thread.orgID },
        { threadID: thread.id },
      ),
    ]),
  );

  return res.status(200).json({
    success: true,
    message: `💀 You successfully deleted thread ${req.params.threadID}`,
  });
}

export default forwardHandlerExceptionsToNext(deleteThreadHandler);
