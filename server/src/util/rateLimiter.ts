import type { RequestContext } from 'server/src/RequestContext.ts';
import {
  FeatureFlags,
  flagsUserFromContext,
  getTypedFeatureFlagValue,
} from 'server/src/featureflags/index.ts';
import { getRedis } from 'server/src/redis/index.ts';

/**
 * This is a single global rate-limit, since right now we only use it from
 * GraphQL. The logic works for anything though, so you can pull the `gql_`
 * prefix out of the key into an argument, maybe swap out the LD flags, and use
 * this rate-limit for other things too. See #8683's intermediate states for how
 * that might be done.
 */
export async function shouldRateLimit(
  context: RequestContext,
): Promise<boolean> {
  const config = await getTypedFeatureFlagValue(
    FeatureFlags.RATE_LIMITS,
    flagsUserFromContext(context),
  );

  const key = `gql_${context.connectionID}`;
  const count = await getRedis().incrAndExpire(key, config.seconds);
  return count > config.maxCount;
}
