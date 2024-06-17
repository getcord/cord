import type { Request, Response } from 'express';
import {
  forwardHandlerExceptionsToNext,
  ApiCallerError,
} from 'server/src/public/routes/platform/util.ts';
import { assertRequestHasContext } from 'server/src/RequestContext.ts';
import { executeUsersByExternalIDQuery } from 'server/src/schema/operations.ts';
import type { ClientUserData } from '@cord-sdk/types';
import { userToUserData } from 'common/util/convertToExternal/user.ts';

async function getClientUserHandler(req: Request, res: Response) {
  const context = assertRequestHasContext(req);

  const data = await executeUsersByExternalIDQuery({
    context,
    variables: {
      externalIDs: [req.params.userID],
    },
  });

  if (data.usersByExternalID.length !== 1) {
    throw new ApiCallerError('user_not_found');
  }

  const result: ClientUserData = userToUserData(data.usersByExternalID[0]);

  return res.status(200).json(result);
}

export default forwardHandlerExceptionsToNext(getClientUserHandler);
