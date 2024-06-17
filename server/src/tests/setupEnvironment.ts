import type { Express } from 'express';
import type { ApolloServer } from 'apollo-server-express';
import type { DocumentNode } from 'graphql';
import request from 'supertest';
import { getAuthorizationHeaderWithToken } from 'common/auth/index.ts';
import { executeSqlFile, makePgEnv, run } from 'database/tooling/utils.ts';
import {
  initSequelize,
  shutdownSequelize,
} from 'server/src/entity/sequelize.ts';
import { createExpressApp } from 'server/src/public/app.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { encodeSessionToJWT } from 'server/src/auth/encodeSessionToJWT.ts';
import { authenticatedRequestContext } from 'server/src/middleware/request_context.ts';
import { initPubSub } from 'server/src/pubsub/index.ts';
import { initRedis } from 'server/src/redis/index.ts';
import { initializeLinkSigningCredentials } from 'server/src/files/upload.ts';
import { waitForEmptyBackground } from 'server/src/util/backgroundPromise.ts';
import { initBoss } from 'server/src/asyncTier/pgboss.ts';

const database = process.env.POSTGRES_DB!;

const TEST_SETUP_TIMEOUT = 30000; // allow 30 seconds for setup

// a remapping of process.env, used for the createdb / dropdb commands
const pgEnv = makePgEnv();

const teardownCallbacks: Array<() => Promise<any>> = [];

let apolloServer: ApolloServer | undefined;
let expressApp: Express | undefined;
let apiCallRequest: request.SuperTest<request.Test> | undefined;

export function getApolloServer() {
  if (!apolloServer) {
    throw new Error('Trying to get undefined ApolloServer');
  }
  return apolloServer;
}

export function getExpressApp() {
  if (!expressApp) {
    throw new Error('Trying to get undefined Express app');
  }
  return expressApp;
}

export async function executeGraphQLOperation({
  query,
  variables,
  viewer,
}: {
  query: string | DocumentNode;
  variables?: any;
  viewer: Viewer;
}) {
  return await getApolloServer().executeOperation({ query, variables }, {
    req: {
      context: await authenticatedRequestContext(
        getAuthorizationHeaderWithToken(encodeSessionToJWT({ viewer }, 60)),
        'test_client_version',
        null,
      ),
    },
  } as any);
}

export function apiCall() {
  if (!apiCallRequest) {
    apiCallRequest = request(getExpressApp());
  }

  return apiCallRequest;
}

beforeAll(async () => {
  await setupTestDatabaseAndServer((callback) =>
    teardownCallbacks.push(callback),
  );
}, TEST_SETUP_TIMEOUT);

afterAll(async () => {
  await waitForEmptyBackground();

  // Execute all the clean-up actions sequentially in reverse order (actions
  // added last are executed first)
  while (teardownCallbacks.length) {
    await teardownCallbacks.pop()!().catch(console.error);
  }
}, TEST_SETUP_TIMEOUT);

async function setupTestDatabaseAndServer(
  installCleanUpFunction: (func: () => Promise<any>) => void,
) {
  // create test database
  installCleanUpFunction(() =>
    run('dropdb', ['--if-exists', database], { env: pgEnv }),
  );
  await run('createdb', ['--template=template_radical_db', database], {
    env: pgEnv,
  });
  await executeSqlFile('database/schema.sql', database); // bootstrap database structure

  // connect test suite sequelize client
  installCleanUpFunction(shutdownSequelize);
  await initSequelize('test');
  initRedis();
  await initPubSub();
  await initializeLinkSigningCredentials();
  const boss = await initBoss();
  installCleanUpFunction(() => boss.stop({ destroy: true, graceful: false }));

  const server = await createExpressApp();
  expressApp = server.app;
  apolloServer = server.apolloServer;
}
