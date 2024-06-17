import type { Request } from 'express';
import { deprecated } from 'server/src/logging/deprecate.ts';

/**
 * Will check if there is an organizationID passed into the request body and
 * if there is it will add a groupID. If not it will just return the original
 * request body. Used in CreateThreadMessageHandler
 */
export function addGroupIDIfNotExistCreateThreadMessageHandler<
  T extends Request['body'],
>(reqBody: T, platformApplicationID: string | undefined) {
  if (typeof reqBody !== 'object' || !reqBody) {
    return reqBody;
  }

  if (!('createThread' in reqBody)) {
    return reqBody;
  }

  if (typeof reqBody['createThread'] !== 'object' || !reqBody['createThread']) {
    return reqBody;
  }

  if ('groupID' in reqBody['createThread']) {
    return reqBody;
  }

  if ('organizationID' in reqBody['createThread']) {
    deprecated(
      'createThreadMessageHandler:organizationID',
      platformApplicationID,
    );
    return {
      ...reqBody,
      createThread: {
        ...reqBody['createThread'],
        groupID: reqBody['createThread']['organizationID'],
      },
    };
  }

  return reqBody;
}

/**
 * Used in UpdateThreadHandler
 */
export function addGroupIDIfOrgIDExists<T extends Request['body']>(
  reqBody: T,
  platformApplicationID: string | undefined,
) {
  if (typeof reqBody !== 'object' || !reqBody) {
    return reqBody;
  }

  if (!('organizationID' in reqBody)) {
    return reqBody;
  }
  deprecated('updateThreadHandler:organizationID', platformApplicationID);
  return { ...reqBody, groupID: reqBody.organizationID };
}

export function addGroupIDIfNotExistUpdateUserPresenceHandler<
  T extends Request['body'],
>(reqBody: T, platformApplicationID: string | undefined) {
  if (typeof reqBody !== 'object' || !reqBody) {
    return reqBody;
  }

  if (!('organizationID' in reqBody)) {
    return reqBody;
  }
  deprecated('updateUserPresenceHandler:organizationID', platformApplicationID);
  return { ...reqBody, groupID: reqBody.organizationID };
}
