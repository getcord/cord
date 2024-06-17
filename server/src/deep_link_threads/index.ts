import { URL } from 'url';
import type { UUID } from 'common/types/index.ts';
import { getRedis } from 'server/src/redis/index.ts';
import { DEEP_LINK_THREAD_ID_TTL_SECONDS } from 'common/const/Timing.ts';
import { CORD_DEEP_LINK_QUERY_PARAM } from 'common/util/index.ts';
import type { Logger } from 'server/src/logging/Logger.ts';

function makeKey(userID: UUID) {
  return `deepLinkThreadID/${userID}`;
}

export async function getDeepLinkThreadMessageID(
  userID: UUID,
): Promise<{ threadID: UUID; messageID: UUID | null } | null> {
  // value: ${threadID} OR ${threadID}/${messageID} (or it doesn't exist at all)
  const value = await getRedis().get(makeKey(userID));
  if (value === null) {
    return null;
  }
  const parts = value.split('/');
  return {
    threadID: parts[0],
    messageID: parts[1],
  };
}

export async function setDeepLinkThreadMessageID({
  userID,
  threadID,
  messageID,
}: {
  userID: UUID;
  threadID: UUID;
  messageID?: UUID;
}) {
  // value: ${threadID} OR ${threadID}/${messageID}
  const key = makeKey(userID);
  const value = messageID ? `${threadID}/${messageID}` : threadID;
  await getRedis().set(key, value, 'EX', DEEP_LINK_THREAD_ID_TTL_SECONDS);
}

export async function clearDeepLinkThreadMessageID(userID: UUID) {
  const key = makeKey(userID);
  await getRedis().del(key);
}

// also see extractDeepLinkQueryParamsV1()
export function injectDeeplinkQueryParamsV1(
  logger: Logger,
  url: string,
  threadID: UUID,
  messageID: UUID,
): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set(
      CORD_DEEP_LINK_QUERY_PARAM,
      `v1_${threadID}_${messageID}`,
    );
    return parsed.toString();
  } catch (e) {
    logger.logException('failed to parse url', e, { url }, undefined, 'debug');
    return url;
  }
}
