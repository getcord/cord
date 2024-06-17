import type { Request, Response } from 'express';
import type { ClientMessageData } from '@cord-sdk/types';
import {
  ApiCallerError,
  forwardHandlerExceptionsToNext,
} from 'server/src/public/routes/platform/util.ts';
import { assertRequestHasContext } from 'server/src/RequestContext.ts';
import { executeMessageByExternalIDWithThreadQuery } from 'server/src/schema/operations.ts';
import { getMessageData } from 'common/util/convertToExternal/thread.ts';
import { getMentionedUserIDs } from 'common/util/index.ts';
import { getUserByInternalIdFunction } from 'server/src/public/routes/platform/client/util.ts';

async function getClientMessageHandler(req: Request, res: Response) {
  const context = assertRequestHasContext(req);

  const data = await executeMessageByExternalIDWithThreadQuery({
    context,
    variables: {
      _externalOrgID: undefined,
      id: req.params.messageID,
    },
  });

  if (!data.messageByExternalID) {
    throw new ApiCallerError('message_not_found');
  }

  const message = data.messageByExternalID;
  const userByInternalID = await getUserByInternalIdFunction(
    context,
    getMentionedUserIDs(message.content ?? []),
  );

  const result: ClientMessageData = getMessageData({
    message,
    thread: message.thread,
    userByInternalID,
  });

  return res.status(200).json(result);
}

export default forwardHandlerExceptionsToNext(getClientMessageHandler);
