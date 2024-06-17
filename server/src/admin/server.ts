import type * as http from 'http';
import type * as https from 'https';
import * as path from 'path';
import type { Socket } from 'net';
import 'reflect-metadata';
import express from 'express';
import { nanoid } from 'nanoid';
import WebSocket from 'ws';

import { RequestContextMiddleware } from 'server/src/middleware/request_context.ts';
import {
  createApolloServer,
  GRAPHQL_ENDPOINT,
} from 'server/src/middleware/apollo.ts';
import { databaseDumpHandler } from 'server/src/admin/databaseDump/handler.ts';
import {
  takeHeapSnapshot,
  writeOutCPUProfile,
} from 'server/src/admin/profiler.ts';
import env from 'server/src/config/Env.ts';
import type { ListenPort } from 'server/src/util/port.ts';
import { getHostPortion } from 'server/src/util/port.ts';
import { drainHelper } from 'server/src/serverStatus.ts';
import SlackLoginHandler, {
  SLACK_LOGIN_ROUTE,
} from 'server/src/admin/routes/SlackLoginHandler.ts';
import type { RequestWithContext } from 'server/src/RequestContext.ts';
import { slackAdminLoginURL } from 'server/src/slack/util.ts';
import type { Session } from 'server/src/auth/index.ts';
import { getSessionFromAuthHeader } from 'server/src/auth/session.ts';
import {
  subscribeToPubSubEvent,
  unsubscribeFromPubSub,
} from 'server/src/pubsub/index.ts';
import {
  SLACK_EVENTS_WEBSOCKET_ENDPOINT,
  SLACK_INTERNAL_EVENT_PATH,
  SLACK_INTERNAL_INTERACTIVE_EVENT_PATH,
} from 'server/src/const.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import { goHandler } from 'server/src/admin/routes/go.ts';
import { getSignedURL } from 'server/src/files/upload.ts';
import { verifySlackWebhookMiddleware } from 'server/src/middleware/slack.ts';
import SlackInternalEventApiHandler from 'server/src/admin/routes/SlackInternalEventHandler.ts';
import {
  jsonMiddleware,
  urlEncodedMiddleware,
} from 'server/src/middleware/encoding.ts';
import SlackInternalInteractiveEventHandler from 'server/src/admin/routes/SlackInternalInteractiveEventHandler.ts';
import {
  adminTokenHandler,
  authTokenFetchHandler,
} from 'server/src/auth/adminToken.ts';
import { adminGraphQLSchema } from 'server/src/admin/resolvers.ts';

export async function adminMain(port: ListenPort) {
  const {
    app,
    httpServer,
    apolloServer,
    apolloMiddleware,
    subscriptionServer,
  } = await createApolloServer(adminGraphQLSchema, true, true);

  app.get('/health', (_req, response) => {
    response.statusCode = 200;
    response.end();
  });

  app.use('/search-go.xml', (_, response) => {
    response.sendFile(
      path.resolve(env.ADMIN_SERVER_STATIC_PATH, 'static', 'search-go.xml'),
    );
  });

  // This route serves the basic html/js used by the automated e2e tests.
  // It is served before the auth middleware because we want it to be available
  // to the test runner which does not log in to the Cord org or access the rest of
  // the admin site.  Instead, it generates a user token in the test application
  // and uses the Cord SDK with this login only on this page
  app.use(
    '/tests',
    express.static(path.resolve(env.ADMIN_SERVER_STATIC_PATH, 'tests')),
  );

  // Setup HTTP request auth and routing
  app.use(RequestContextMiddleware);

  // force redirect the user to the Slack login page if they're not logged in
  app.use((req, res, next) => {
    const requestContext = (req as RequestWithContext).context;
    if (
      !requestContext.session.isAdmin &&
      req.path !== `/${SLACK_LOGIN_ROUTE}` &&
      req.path !== SLACK_INTERNAL_EVENT_PATH &&
      req.path !== SLACK_INTERNAL_INTERACTIVE_EVENT_PATH
    ) {
      const nonce = nanoid(10);

      return res
        .cookie('admin_nonce', nonce, {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
        })
        .redirect(slackAdminLoginURL(nonce, req.originalUrl));
    }

    return next();
  });

  app.get('/admin-token', adminTokenHandler);
  app.get('/auth-token', authTokenFetchHandler);
  app.use(apolloMiddleware);
  app.use(jsonMiddleware());
  app.use(urlEncodedMiddleware());
  app.use(express.static(path.resolve(env.ADMIN_SERVER_STATIC_PATH)));
  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  app.get('/partial-database-dump', databaseDumpHandler);
  app.get('/cpu-profile', writeOutCPUProfile);
  app.get('/heap-snapshot', takeHeapSnapshot);
  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  app.get(`/${SLACK_LOGIN_ROUTE}`, SlackLoginHandler);

  app.post(
    SLACK_INTERNAL_EVENT_PATH,
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    verifySlackWebhookMiddleware(),
    SlackInternalEventApiHandler,
  );
  app.post(
    SLACK_INTERNAL_INTERACTIVE_EVENT_PATH,
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    verifySlackWebhookMiddleware(),
    SlackInternalInteractiveEventHandler,
  );

  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  app.get('/go/*', goHandler);

  // Expose the contents of our S3 buckets (to anyone logged into admin).
  // https://admin.cord.com/s3/BUCKET/KEY will redirect to a signed link to the
  // KEY object in BUCKET
  app.get(/\/s3\/([\w-]+)\/(.+)/, (req, res, next) => {
    const bucket = req.params[0];
    const key = req.params[1];

    // Whitelist buckets for this route here
    if (['cord-e2e-tests'].includes(bucket)) {
      res.redirect(
        getSignedURL(key, undefined, {
          bucket,
          region: env.S3_REGION,
        }),
      );
    } else {
      next();
    }
  });

  // Catch-all route that serves the index.html file for any location not
  // selected by one of the previous routes
  app.get('*', (request, response) => {
    response.sendFile(path.resolve(env.ADMIN_SERVER_STATIC_PATH, 'index.html'));
  });

  const connectWebSocketServer = installMultipleWebSocketServers(httpServer);
  connectWebSocketServer(GRAPHQL_ENDPOINT, subscriptionServer.server);

  // If not running in prod, we allow admin users to connect via websocket to
  // listen to incoming Slack events. This is incredibly useful for developing
  // anything that involves incoming Slack events.
  if (env.CORD_TIER !== 'prod') {
    const slackWebSocketServer = new WebSocket.Server({ noServer: true });
    slackWebSocketServer.on(
      'connection',
      // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      (ws: WebSocket, req: http.IncomingMessage) =>
        handleSlackEventWebSocketConnection(ws, req)
          .catch(
            anonymousLogger().exceptionLogger(
              'handleSlackEventWebSocketConnection',
            ),
          )
          .finally(() => ws.close()),
    );
    connectWebSocketServer(
      SLACK_EVENTS_WEBSOCKET_ENDPOINT,
      slackWebSocketServer,
    );
  }
  drainHelper.install(httpServer);

  // Start our server
  return await new Promise<void>((resolve, reject) => {
    httpServer.addListener('error', reject);
    httpServer.listen(port, () => {
      httpServer.removeListener('error', reject);
      resolve();
      const host = getHostPortion(httpServer.address());
      anonymousLogger().info(`🚀 Admin server ready at https://${host}/`);
      anonymousLogger().info(
        `🚀 Admin GraphQL ready at https://${host}${apolloServer.graphqlPath}`,
      );
    });
  });
}

/**
 * Install an 'upgrade' handler on http server and return function that creates
 * WebSocket servers for a particular path
 */
function installMultipleWebSocketServers(server: https.Server | http.Server) {
  const websocketServers = new Map<string, WebSocket.Server>();

  server.on(
    'upgrade',
    (req: http.IncomingMessage, socket: Socket, head: Buffer) => {
      const url = req?.url;

      if (url) {
        const wss = websocketServers.get(url);
        if (wss) {
          wss.handleUpgrade(req, socket, head, (ws) =>
            wss.emit('connection', ws, req),
          );
          return;
        }
      }

      socket.end();
    },
  );

  // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  return (path: string, wss: WebSocket.Server) => {
    if (websocketServers.has(path)) {
      throw new Error(`WebSocket server for path '${path}' already defined`);
    }

    websocketServers.set(path, wss);
  };
}

async function handleSlackEventWebSocketConnection(
  ws: WebSocket,
  req: http.IncomingMessage,
) {
  const wsClosed = new Promise<void>((res) => ws.on('close', res));

  const { authorization } = req.headers;
  if (!authorization) {
    return;
  }

  const session: Session = await getSessionFromAuthHeader(authorization, null);

  if (!session.isAdmin) {
    ws.send('Sorry - only for admins');
    return;
  }

  const subscriptionID = await subscribeToPubSubEvent(
    'incoming-slack-event',
    { tier: env.CORD_TIER },
    (event) => ws.send(JSON.stringify(event.payload)),
  );

  await wsClosed;
  unsubscribeFromPubSub(subscriptionID);
}
