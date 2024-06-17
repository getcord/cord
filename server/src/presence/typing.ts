import { publishPubSubEvent } from 'server/src/pubsub/index.ts';
import type { UUID } from 'common/types/index.ts';
import { TYPING_TIMEOUT_TTL_SECONDS } from 'common/const/Timing.ts';
import { getRedis, multiOperationSucceeded } from 'server/src/redis/index.ts';
import type { Logger } from 'server/src/logging/Logger.ts';
import setTimeoutAsync from 'common/util/setTimeoutAsync.ts';

async function publishUpdate(threadID: UUID) {
  const users = await getUsersTyping(threadID);

  return await publishPubSubEvent(
    'thread-typing-users-updated',
    { threadID },
    { users },
  );
}

function makeSetKey(threadID: UUID) {
  return `typing-${threadID}`;
}

const timeouts = new Map<string, NodeJS.Timeout>();

// returns a key for indexing into "timeouts" map
function makeUserThreadKey(threadID: UUID, userID: UUID) {
  return `typing-user-${userID}-${threadID}`;
}

export function setUserTyping(
  logger: Logger,
  threadID: UUID,
  userID: UUID,
  typing: boolean,
) {
  if (typing) {
    return add(logger, threadID, userID);
  } else {
    return remove(threadID, userID);
  }
}

// Mark a user as typing by adding "userID" to the Redis set for the given
// thread. The "score" of "userID" in the set will be updated/set to current
// time in milliseconds. The idea is that members will low scores (old
// timestamps) will not be considered to be members of the set.
async function add(logger: Logger, threadID: UUID, userID: UUID) {
  clearPreviousTimeout(threadID, userID);

  const newTimestamp = Date.now();

  const setKey = makeSetKey(threadID);
  const errsAndVals = await getRedis()
    .multi()
    .zscore(setKey, userID) // errsAndVals[0]
    .zadd(setKey, newTimestamp, userID) // errsAndVals[1]
    .expire(setKey, TYPING_TIMEOUT_TTL_SECONDS) // errsAndVals[2]
    .exec();

  if (!multiOperationSucceeded(errsAndVals, 'Failed to mark user as typing')) {
    return;
  }

  // because we need to push to clients whenever a user becomes considered as
  // "not typing", run a check in TYPING_TIMEOUT_TTL_SECONDS plus a bit (100ms)
  // whether the user is still considered to be "typing".
  timeouts.set(
    makeUserThreadKey(threadID, userID),
    setTimeoutAsync(
      () =>
        notifyIfNotTyping(threadID, userID).catch(
          logger.exceptionLogger(
            'Failed to notify about expired typing status',
          ),
        ),
      TYPING_TIMEOUT_TTL_SECONDS * 1000 + 100,
    ),
  );

  const previousUserTimestamp = errsAndVals[0]?.[1] as
    | string
    | null
    | undefined;
  if (
    !previousUserTimestamp ||
    Number(previousUserTimestamp) <
      newTimestamp - TYPING_TIMEOUT_TTL_SECONDS * 1000
  ) {
    // user was not previously considered as typing
    return await publishUpdate(threadID);
  }
}

// Get a list of userIDs typing in the thread
// This is done by reading the Redis set for the given thread and returning all
// members with high enough "scores" (= recent enough last insertion
// timestamps)
export async function getUsersTyping(threadID: UUID) {
  const setKey = makeSetKey(threadID);
  const cutoffTime = Date.now() - TYPING_TIMEOUT_TTL_SECONDS * 1000;
  // get all members of the set with score at least cutoffTime
  return await getRedis().zrangebyscore(setKey, cutoffTime, '+inf');
}

// Mark the user as not-typing in thread threadID
// This is done by removing "userID" from the Redis set for this threadID
async function remove(threadID: UUID, userID: UUID) {
  const now = Date.now();
  const setKey = makeSetKey(threadID);
  const errsAndVals = await getRedis()
    .multi()
    // fetch the current score (last inserted timestamp) of the user
    .zscore(setKey, userID) // errsAndVals[0]
    // remove "userID" from the set
    .zrem(setKey, userID) // errsAndVals[1]
    .exec();
  if (
    !multiOperationSucceeded(
      errsAndVals,
      'Failed to remove user from typing set',
    )
  ) {
    return;
  }

  const previousUserTimestamp = errsAndVals[0]?.[1] as
    | string
    | null
    | undefined;
  if (
    !!previousUserTimestamp &&
    Number(previousUserTimestamp) > now - TYPING_TIMEOUT_TTL_SECONDS * 1000
  ) {
    // user was previously considered as typing
    clearPreviousTimeout(threadID, userID);
    return await publishUpdate(threadID);
  }
  return;
}

function clearPreviousTimeout(threadID: UUID, userID: UUID) {
  const userKey = makeUserThreadKey(threadID, userID);
  const prevTimeoutID = timeouts.get(userKey);
  if (prevTimeoutID !== undefined) {
    clearTimeout(prevTimeoutID);
    timeouts.delete(userKey);
  }
}

async function notifyIfNotTyping(threadID: UUID, userID: UUID) {
  const setKey = makeSetKey(threadID);
  const now = Date.now();
  const latestUserTimestamp = await getRedis().zscore(setKey, userID);
  if (
    latestUserTimestamp === null ||
    Number(latestUserTimestamp) < now - TYPING_TIMEOUT_TTL_SECONDS * 1000
  ) {
    // the user is no longer considered to be typing
    return await publishUpdate(threadID);
  }
}

export async function removeAllTypingUsers(threadID: string) {
  const setKey = makeSetKey(threadID);
  await getRedis().del(setKey);
  return await publishUpdate(threadID);
}
