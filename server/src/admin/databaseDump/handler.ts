import type { Request, Response, NextFunction } from 'express';

import { streamPartialDump } from 'server/src/admin/databaseDump/index.ts';
import type { RequestWithContext } from 'server/src/RequestContext.ts';
import env from 'server/src/config/Env.ts';
import { getReadReplicaDbConfigFromEnv } from 'server/src/util/readReplicaDatabase.ts';

export async function databaseDumpHandler(
  request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (!(request as RequestWithContext).context.session.isAdmin) {
    response.statusCode = 403;
    response.send('access denied');
    return;
  }

  response.statusCode = 200;
  response.setHeader('Content-type', 'text/plain');

  try {
    await streamPartialDump(response, getReadReplicaDbConfigFromEnv(env));
  } catch (err) {
    response.send(`\n\n-- ${err}\n`);
  }
  response.end();
}
