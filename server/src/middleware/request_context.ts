import type express from 'express';
import * as cookie from 'cookie';

import type {
  RequestContext,
  RequestWithContext,
} from 'server/src/RequestContext.ts';
import { contextWithSession } from 'server/src/RequestContext.ts';

import { getSequelize } from 'server/src/entity/sequelize.ts';
import { getSessionFromAuthHeader } from 'server/src/auth/session.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import { toDeploymentType } from 'common/types/index.ts';
import type { DeploymentType } from 'common/types/index.ts';
import { ApiCallerError } from 'server/src/public/routes/platform/util.ts';
import { ClientFacingError } from 'server/src/util/ClientFacingError.ts';

export const authenticatedRequestContext = async (
  authorization: string,
  clientVersion: string | null,
  deployment: DeploymentType | null,
): Promise<RequestContext> => {
  try {
    const session = await getSessionFromAuthHeader(
      authorization,
      clientVersion,
    );
    return await contextWithSession(
      session,
      getSequelize(),
      clientVersion,
      deployment,
    );
  } catch (e: any) {
    if (e instanceof ClientFacingError || e instanceof ApiCallerError) {
      // These are errors intended for the caller, so log them for our
      // information but they're not erroneous behavior from us
      anonymousLogger().logException(
        e.message,
        e,
        undefined,
        undefined,
        'info',
      );
    } else {
      anonymousLogger().logException(e.message, e);
    }
    throw e;
  }
};

function getContextForHTTPRequest(
  req: express.Request,
): Promise<RequestContext> {
  const authorizationHeader = req.header('Authorization');

  const cookieToken = cookie.parse(req.header('Cookie') || '')['token'] as
    | string
    | undefined;
  return authenticatedRequestContext(
    authorizationHeader || cookieToken || '',
    req.header('X-Version') || null,
    toDeploymentType(req.header('X-Deployment')),
  );
}

export function RequestContextMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  void (async () => {
    let logger = anonymousLogger();
    try {
      const context = await getContextForHTTPRequest(req);
      (req as RequestWithContext).context = context;
      logger = context.logger;
    } catch (e: any) {
      // This is probably adequate for now, but it will likely lead to
      // incorrect response status/messages in the future. The assumption
      // here is that we'll only get a throw that is truly an authentication
      // error. That's not guaranteed. If there were an application error
      // (which should be reported as a 5XX error), we'd still report it as
      // a 403. Meh.
      res.status(403);
      res.json({ error: e.message });
      res.end();

      return;
    }

    logger.debug('Incoming connection (RequestContextMiddleware)', {
      headers: req.headers,
      remoteAddress: req.socket.remoteAddress,
    });

    next();
  })();
}
