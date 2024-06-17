import * as crypto from 'crypto';

import type { UUID } from 'common/types/index.ts';
import env from 'server/src/config/Env.ts';

/**
 * Calculate a shared secret for a sample token app with the given id.
 *
 * @param appID application id
 * @returns the secret to be used for a sample token app with the given id
 */
export function sampleTokenAppSecret(appID: UUID) {
  return crypto
    .createHmac('sha256', env.JWT_SIGNING_SECRET)
    .update(appID.toLowerCase())
    .digest('hex');
}
