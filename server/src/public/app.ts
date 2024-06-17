import MainRouter from 'server/src/public/routes/MainRouter.ts';
import { RequestContextMiddleware } from 'server/src/middleware/request_context.ts';
import {
  createApolloServer,
  GRAPHQL_ENDPOINT,
} from 'server/src/middleware/apollo.ts';
import { graphQLSchema } from 'server/src/schema/resolvers.ts';
import { verifySlackWebhookMiddleware } from 'server/src/middleware/slack.ts';
import {
  SLACK_EVENT_PATH,
  SLACK_INTERACTIVE_EVENT_PATH,
} from 'server/src/const.ts';
import {
  jsonMiddleware,
  urlEncodedMiddleware,
} from 'server/src/middleware/encoding.ts';

const ROBOTS_TXT = `
User-agent: *
Disallow: /
`.trim();

export async function createExpressApp() {
  const {
    app,
    httpServer,
    apolloServer,
    apolloMiddleware,
    subscriptionServer,
  } = await createApolloServer(graphQLSchema, false);

  const sanitizedWorkerName =
    process.env.CORD_WORKER_NAME?.replace(/[^A-Za-z0-9 _-]/g, '') ?? 'None';
  app.use(function setDefaultHeaders(req, res, next) {
    if (req.header('X-Cord-Debug')) {
      res.setHeader('X-Cord-Worker', sanitizedWorkerName);
    }
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    );
    next();
  });

  app.get('/health', (_req, response) => {
    response.statusCode = 200;
    response.end();
  });

  app.get('/robots.txt', (_req, res) => {
    res.status(200).contentType('text/plain').send(ROBOTS_TXT);
    return;
  });

  // Setup HTTP request auth and routing
  app.use(GRAPHQL_ENDPOINT, RequestContextMiddleware);
  app.use(apolloMiddleware);
  app.use(jsonMiddleware());
  app.use(urlEncodedMiddleware());

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  app.use(SLACK_EVENT_PATH, verifySlackWebhookMiddleware());
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  app.use(SLACK_INTERACTIVE_EVENT_PATH, verifySlackWebhookMiddleware());

  app.use(MainRouter);

  return { httpServer, app, apolloServer, subscriptionServer };
}
