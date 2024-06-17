import type { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { forwardHandlerExceptionsToNext } from 'server/src/public/routes/platform/util.ts';
import { SAMPLE_TOKEN_EXPIRY_SECONDS } from 'common/const/Timing.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import { sampleTokenAppSecret } from 'server/src/util/sampleTokenAppSecret.ts';

/**
 * Generate a session token to be used for an app Quickstart.  It is used in the
 * first steps of the integration guide on docs.cord.com as well as by the opensource
 * demo apps repos on https://github.com/getcord/demo-apps (but not in other
 * uses of the demo apps - see GetPlaygroundSignedTokenHandler for those)
 *
 * This handler will:
 * 1. Sign a token with a random user uuid.
 * 2. Return the signed session token.
 */
async function getSampleSignedTokenHandler(
  { headers }: Request,
  res: Response,
) {
  anonymousLogger().debug('Provisioned sample token', { headers });

  const appID = uuid();

  const session_token = jwt.sign(
    {
      app_id: appID,
      user_id: uuid(),
    },
    sampleTokenAppSecret(appID),
    {
      algorithm: 'HS512',
      expiresIn: SAMPLE_TOKEN_EXPIRY_SECONDS,
    },
  );

  res.json({ session_token, client_auth_token: session_token });
}

export default forwardHandlerExceptionsToNext(getSampleSignedTokenHandler);
