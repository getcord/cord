import type { Request, Response } from 'express';
import {
  ApiCallerError,
  forwardHandlerExceptionsToNext,
} from 'server/src/public/routes/platform/util.ts';
import { assertRequestHasContext } from 'server/src/RequestContext.ts';
import {
  extractResult,
  subscribePresenceLiveQuerySubscription,
} from 'server/src/schema/operations.ts';
import type { UserLocationData } from '@cord-sdk/types';
import {
  fillUserLocationData,
  toUserLocationData,
} from 'common/util/convertToExternal/presence.ts';
import {
  validateBooleanValue,
  validateLocationValue,
} from 'server/src/public/routes/platform/validateQuery.ts';

async function getClientPresenceHandler(req: Request, res: Response) {
  const context = assertRequestHasContext(req);

  const excludeDurable = validateBooleanValue(
    req.query,
    'exclude_durable',
    false,
  );
  const exactMatch = !validateBooleanValue(req.query, 'partial_match', false);
  const matcher = validateLocationValue(req.query, 'location');
  if (!matcher) {
    throw new ApiCallerError('invalid_request', {
      message: '"location" parameter is required',
    });
  }

  const subscription = await subscribePresenceLiveQuerySubscription({
    context,
    variables: {
      input: { matcher, excludeDurable, exactMatch },
      _externalOrgID: undefined,
    },
  });

  // The body of this loop will never run more than once, but putting it into a
  // loop means the loop will call the correct methods on the AsyncIterator to
  // close it out when we return
  for await (const item of subscription) {
    const data = extractResult(item);
    // The first result should always be complete, this is weird
    if (!data.presenceLiveQuery.complete) {
      throw new Error('Unknown error');
    }
    const result: UserLocationData[] = data.presenceLiveQuery.data.map(
      (update) => fillUserLocationData(toUserLocationData(update)),
    );

    return res.status(200).json(result);
  }

  // No updates at all?  Just return nothing, I guess
  return res.status(200).json([]);
}

export default forwardHandlerExceptionsToNext(getClientPresenceHandler);
