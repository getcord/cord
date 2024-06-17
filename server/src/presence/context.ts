import { PAGE_PRESENCE_LOSS_TTL_SECONDS } from 'common/const/Timing.ts';
import type { Location, UUID } from 'common/types/index.ts';
import {
  locationCompare,
  locationEqual,
  locationJson,
  locationMatches,
  toLocation,
} from 'common/types/index.ts';
import setTimeoutAsync from 'common/util/setTimeoutAsync.ts';
import type { Logger } from 'server/src/logging/Logger.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';
import { getPredis, multiOperationSucceeded } from 'server/src/redis/index.ts';

// This file allows us to change and query the presence location of a user.
// When you set the presence of a user, it will be cleared after
// PAGE_PRESENCE_LOSS_TTL_SECONDS unless you reset the timer by setting the
// user's presence again.
//
// The underlying storage for user's current presence is Redis. For a user on
// page X, we will store a key:value value pair:
//    `makeKey(userID, orgID, region)`:contextJson
// with a time-to-live expiration of PAGE_PRESENCE_LOSS_TTL_SECONDS. Because we
// need to notify clients whenever a key expires, we also setTimeout to check
// whether a key expired or whether its TTL got renewed.

const timeouts = new Map<string, NodeJS.Timeout>();

export function clearTimeoutsForTest() {
  for (const timeout of timeouts.values()) {
    clearTimeout(timeout);
  }
}

function makeKey(
  externalUserID: string,
  orgID: UUID,
  exclusivityRegion: Location,
) {
  return `presenceContext/${orgID}/${externalUserID}/${locationJson(
    exclusivityRegion,
  )}`;
}

function makeSequenceNumKey(externalUserID: string, orgID: UUID) {
  return `presenceContextSeq/${orgID}/${externalUserID}`;
}

function userIdFromKey(key: string): string {
  const elements = key.split('/', 4);
  if (elements.length !== 4) {
    throw new Error('Invalid key');
  }
  return elements[2];
}

async function getPresenceValue(key: string): Promise<Location | null> {
  const result = await getPredis().get(key);
  if (!result) {
    return null;
  }
  return toLocation(JSON.parse(result));
}

export async function getUserPresence(
  orgID: UUID,
  externalUserID: string,
): Promise<{ contexts: Location[]; sequenceNum: number }> {
  const redis = getPredis();
  const stream = redis.scanStream({
    match: `presenceContext/${orgID}/${externalUserID}/*`,
    count: 1000,
  });
  const data: Location[] = [];
  stream.on('data', (resultKeys: string[]) => {
    stream.pause();
    void Promise.all(
      resultKeys.map((key) =>
        getPresenceValue(key).then((value) => {
          if (value) {
            data.push(value);
          }
        }),
      ),
    ).then(() => {
      stream.resume();
    });
  });

  // Sort and return the data once the stream ends
  await new Promise<void>((resolve) => stream.on('end', resolve));
  const sequenceNum = await getPredis().get(
    makeSequenceNumKey(externalUserID, orgID),
  );
  data.sort(locationCompare);
  return {
    contexts: data,
    sequenceNum: sequenceNum ? parseInt(sequenceNum, 10) : 0,
  };
}

/**
 * Returns all user presence records for the given org.  A single user may be
 * present in multiple places.  If so, the returned data is sorted according to
 * `contextCompare`.
 */
export async function getAllUserPresence(
  orgID: UUID,
): Promise<Map<string, Location[]>> {
  const redis = getPredis();
  const stream = redis.scanStream({
    match: `presenceContext/${orgID}/*`,
    count: 1000,
  });
  const data = new Map<string, Location[]>();
  stream.on('data', (resultKeys: string[]) => {
    stream.pause();
    void Promise.all(
      resultKeys.map((key) =>
        getPresenceValue(key).then((value) => {
          if (value) {
            const externalUserID = userIdFromKey(key);
            data.set(externalUserID, [
              ...(data.get(externalUserID) ?? []),
              value,
            ]);
          }
        }),
      ),
    ).then(() => {
      stream.resume();
    });
  });

  // Sort and return the data once the stream ends
  await new Promise<void>((resolve) => stream.on('end', resolve));
  for (const arr of data.values()) {
    arr.sort(locationCompare);
  }
  return data;
}

// Make the user present on the given context
// This function will store the context in redis under the key
// `makeKey(userID, orgID, exclusivityRegion)` with a time-to-live
// expiration of PAGE_PRESENCE_LOSS_TTL_SECONDS.
export async function setUserPresence(
  logger: Logger,
  externalUserID: string,
  orgID: UUID,
  context: Location,
  exclusivityRegion: Location,
) {
  if (!locationMatches(context, exclusivityRegion)) {
    throw new Error(
      'Cannot set a user present in a non-matching exclusivity region',
    );
  }
  const key = makeKey(externalUserID, orgID, exclusivityRegion);
  const sequenceNumKey = makeSequenceNumKey(externalUserID, orgID);
  clearPreviousTimeout(key);

  const errsAndVals = await getPredis()
    .multi()
    .getset(key, locationJson(context)) // errsAndVals[0]
    .expire(key, PAGE_PRESENCE_LOSS_TTL_SECONDS)
    .incr(sequenceNumKey) // errsAndVals[2]
    .expire(sequenceNumKey, PAGE_PRESENCE_LOSS_TTL_SECONDS)
    .exec();

  if (!multiOperationSucceeded(errsAndVals, 'Failed getset presence')) {
    console.log('Had some errors');
    return;
  }

  const prevContextRaw = errsAndVals[0][1];
  const prevContext =
    typeof prevContextRaw === 'string'
      ? toLocation(JSON.parse(prevContextRaw))
      : null;
  const sequenceNum = errsAndVals[2][1] as number;

  // Because we don't get notified when a key expires, let's set a timeout
  // that should run soon (100ms) after the key would have expired. If the
  // key's TTL was not renewed and expired, we will notify everyone.
  const timeoutID = setTimeoutAsync(
    () =>
      notifyIfDeleted(externalUserID, orgID, context, exclusivityRegion).catch(
        logger.exceptionLogger('Failed to notify clients of expired presence'),
      ),
    // do the check 100ms after Redis should have expired the presence
    PAGE_PRESENCE_LOSS_TTL_SECONDS * 1000 + 100,
  );
  timeouts.set(key, timeoutID);

  if (!locationEqual(prevContext, context)) {
    // user is on a new page, let's notify everyone
    await publishPubSubEvent(
      'context-presence',
      { orgID },
      {
        externalUserID,
        ephemeral: {
          ...(prevContext && { departed: prevContext }),
          arrived: context,
          sequenceNum,
        },
      },
    );
  }
}

// Mark the user as not present on the pageContextHash
export async function removeUserPresence(
  externalUserID: string,
  orgID: UUID,
  context: Location,
  exclusivityRegion: Location,
) {
  const key = makeKey(externalUserID, orgID, exclusivityRegion);
  const numOfDeletedKeys = await getPredis().compareAndDelete(
    key,
    locationJson(context),
  );
  if (numOfDeletedKeys === 1) {
    clearPreviousTimeout(key);
    const sequenceNum = await incrSequenceNum(externalUserID, orgID);
    await publishPubSubEvent(
      'context-presence',
      { orgID },
      {
        externalUserID,
        ephemeral: { departed: context, sequenceNum },
      },
    );
  }
}

function clearPreviousTimeout(key: string) {
  const timeoutID = timeouts.get(key);
  if (timeoutID !== undefined) {
    clearTimeout(timeoutID);
    timeouts.delete(key);
  }
}

async function notifyIfDeleted(
  externalUserID: string,
  orgID: UUID,
  context: Location,
  exclusivityRegion: Location,
) {
  const key = makeKey(externalUserID, orgID, exclusivityRegion);
  const keyIsDeleted = (await getPredis().exists(key)) === 0;
  if (keyIsDeleted) {
    const sequenceNum = await incrSequenceNum(externalUserID, orgID);
    await publishPubSubEvent(
      'context-presence',
      { orgID },
      {
        externalUserID,
        ephemeral: { departed: context, sequenceNum },
      },
    );
  }
}

async function incrSequenceNum(
  externalUserID: string,
  orgID: UUID,
): Promise<number> {
  const seqNumKey = makeSequenceNumKey(externalUserID, orgID);
  const errsAndVals = await getPredis()
    .multi()
    .incr(seqNumKey)
    .expire(seqNumKey, PAGE_PRESENCE_LOSS_TTL_SECONDS)
    .exec();
  if (
    !multiOperationSucceeded(errsAndVals, 'Failed to increment sequence number')
  ) {
    throw new Error('Failed to increment sequence number');
  }
  return errsAndVals[0][1] as number;
}
