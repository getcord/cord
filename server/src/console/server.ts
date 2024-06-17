import 'reflect-metadata';
import * as path from 'path';
import express from 'express';
import env from 'server/src/config/Env.ts';

import { RequestContextMiddleware } from 'server/src/middleware/request_context.ts';
import {
  createApolloServer,
  GRAPHQL_ENDPOINT,
} from 'server/src/middleware/apollo.ts';
import { consoleGraphQLSchema } from 'server/src/console/resolvers.ts';
import type { ListenPort } from 'server/src/util/port.ts';
import { getHostPortion } from 'server/src/util/port.ts';
import { drainHelper } from 'server/src/serverStatus.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';

export async function consoleMain(port: ListenPort) {
  const { app, httpServer, apolloServer, apolloMiddleware } =
    await createApolloServer(consoleGraphQLSchema, false);

  app.get('/health', (_req, response) => {
    response.statusCode = 200;
    response.end();
  });

  // Setup HTTP request auth and routing
  app.use(GRAPHQL_ENDPOINT, RequestContextMiddleware);
  app.use(apolloMiddleware);
  app.use(express.json());
  app.use(express.static(path.resolve(env.CONSOLE_SERVER_STATIC_PATH)));

  app.get('*', (request, response) => {
    response.sendFile(
      path.resolve(env.CONSOLE_SERVER_STATIC_PATH, 'index.html'),
    );
  });

  drainHelper.install(httpServer);

  // Start our server
  return await new Promise<void>((resolve, reject) => {
    httpServer.addListener('error', reject);
    httpServer.listen(port, () => {
      httpServer.removeListener('error', reject);
      resolve();
      const host = getHostPortion(httpServer.address());
      anonymousLogger().info(`🚀 Console server ready at https://${host}/`);
      anonymousLogger().info(
        `🚀 Console GraphQL ready at https://${host}${apolloServer.graphqlPath}`,
      );
    });
  });
}
