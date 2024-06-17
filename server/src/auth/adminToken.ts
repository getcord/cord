import type express from 'express';
import { sign } from 'jsonwebtoken';
import { encodeSessionToJWT } from 'server/src/auth/encodeSessionToJWT.ts';
import { verifyJwtObject } from 'server/src/auth/jwt.ts';

import env from 'server/src/config/Env.ts';
import type { RequestWithContext } from 'server/src/RequestContext.ts';

/**
 * Implementation of the /admin-token endpoint
 *
 * The endpoint is used to prove that a user is in fact a Cord admin (i.e.
 * logged into our admin server).
 *
 * To call this endpoint, three query parameters have to be provided:
 * * `redirect`: the url to redirect to
 * * `url`: the eventual destination after the auth process is finished
 * * `nonce`: a number-used-once string, which is used on the server requesting
 *   the authentication to make sure that the auth flow was initiated there (and
 *   not by someone injecting a link maliciously)
 *
 * This handler must only be called after admin log-in was verified.
 *
 * It then redirects to the url given as `redirect` parameter, with a `state`
 * query parameter that contains the signed JSON webtoken. The token payload
 * contains the `url` and `nonce` fields that were passed as query parameters to
 * this endpoint.
 *
 * For security reasons, this endpoint refuses to create a webtoken unless both
 * `redirect` and `url` fields are valid URLs with hostnames under the
 * `cord.com` domain.
 */
export function adminTokenHandler(req: express.Request, res: express.Response) {
  const { redirect, url, nonce } = req.query;

  if (typeof nonce !== 'string') {
    res.status(400).send("Missing required query parameter 'nonce'").end();
    return;
  }

  const redirectURL = sanitizeCordURL(redirect);
  if (!redirectURL) {
    res.status(400).send(`Invalid redirect: ${redirect}`).end();
    return;
  }

  const destinationURL = sanitizeCordURL(url);
  if (!destinationURL) {
    res.status(400).send(`Invalid destination: ${url}`).end();
    return;
  }

  redirectURL.searchParams.set(
    'state',
    sign({ url: destinationURL.href, nonce }, env.ADMIN_TOKEN_SECRET, {
      expiresIn: 30,
    }),
  );
  res.redirect(redirectURL.href);
}

function sanitizeCordURL(url: any) {
  if (typeof url !== 'string' || !url) {
    return null;
  }
  try {
    const parsedURL = new URL(url);
    if (
      parsedURL.hostname === 'cord.com' ||
      parsedURL.hostname.endsWith('.cord.com')
    ) {
      return parsedURL;
    }
  } catch {}
  return null;
}

export function authTokenFetchHandler(
  req: express.Request,
  res: express.Response,
) {
  const requestContext = (req as RequestWithContext).context;

  const { token } = req.query;

  if (typeof token !== 'string') {
    res.status(400).send("Missing required query parameter 'token'").end();
    return;
  }

  const parsedPayload = verifyJwtObject(token, env.ADMIN_TOKEN_SECRET);
  if (parsedPayload === null || !('redirect' in parsedPayload)) {
    res.status(400).send('Invalid token').end();
    return;
  }

  const { redirect } = parsedPayload;

  const redirectURL = sanitizeCordURL(redirect);
  if (!redirectURL) {
    res.status(400).send(`Invalid redirect: ${redirect}`).end();
    return;
  }

  redirectURL.searchParams.set(
    'token',
    encodeSessionToJWT(requestContext.session, 24 * 60 * 60),
  );
  res.redirect(redirectURL.href);
}
