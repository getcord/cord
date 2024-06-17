import type { Request, Response } from 'express';
import {
  forwardHandlerExceptionsToNext,
  ApiCallerError,
} from 'server/src/public/routes/platform/util.ts';
import { assertRequestHasContext } from 'server/src/RequestContext.ts';
import type { UserFragment } from 'server/src/schema/operations.ts';
import { executeUsersByExternalIDQuery } from 'server/src/schema/operations.ts';
import type { ClientUserData } from '@cord-sdk/types';
import { userToUserData } from 'common/util/convertToExternal/user.ts';

function parseUserList(req: Request): string[] {
  if (typeof req.query.users !== 'string') {
    throw new ApiCallerError('invalid_request');
  }
  let users;
  try {
    users = JSON.parse(req.query.users);
  } catch (e) {
    throw new ApiCallerError('invalid_request');
  }
  if (
    !Array.isArray(users) ||
    users.some((u) => typeof u !== 'string' && typeof u !== 'number')
  ) {
    throw new ApiCallerError('invalid_request');
  }
  return users.map((u) => u.toString());
}

async function getClientUsersHandler(req: Request, res: Response) {
  const context = assertRequestHasContext(req);

  const users = parseUserList(req);

  const data = await executeUsersByExternalIDQuery({
    context,
    variables: {
      externalIDs: users,
    },
  });

  const fetched = new Map<string, UserFragment>();
  data.usersByExternalID.forEach((u) => fetched.set(u.externalID, u));

  const result: Record<string, ClientUserData | null> = {};
  for (const user of users) {
    result[user] = fetched.has(user)
      ? userToUserData(fetched.get(user)!)
      : null;
  }

  return res.status(200).json(result);
}

export default forwardHandlerExceptionsToNext(getClientUsersHandler);
