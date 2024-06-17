import * as http from 'http';
import * as https from 'https';
import * as path from 'path';
import * as url from 'url';
import { promises as fsPromises } from 'fs';
import { ApolloServer, ApolloError } from 'apollo-server-express';
import * as cookie from 'cookie';
import WebSocket from 'ws';

import type {
  ExecutionArgs,
  ExecutionResult,
  GraphQLSchema,
  SubscriptionArgs,
} from 'graphql';
import {
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginLandingPageDisabled,
} from 'apollo-server-core';
import { GraphQLError, execute, subscribe } from 'graphql';
import type {
  ConnectionContext,
  ExecuteFunction,
  ExecutionParams,
} from 'subscriptions-transport-ws';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import express from 'express';
import { authenticatedRequestContext } from 'server/src/middleware/request_context.ts';
import type {
  RequestContext,
  RequestWithContext,
} from 'server/src/RequestContext.ts';
import { Errors } from 'common/const/Errors.ts';
import {
  graphQLExecutePerformanceWrapper,
  websocketConnected,
  websocketDisconnected,
} from 'server/src/logging/performance.ts';
import { parametersFromRequest } from 'server/src/util/cookies.ts';
import type { WebsocketAuthParams } from 'common/auth/index.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import { getNewLoaders } from 'server/src/RequestContextLoaders.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { assertViewerHasPlatformApplicationID } from 'server/src/auth/index.ts';
import {
  FeatureFlags,
  flagsUserFromContext,
  getTypedFeatureFlagValue,
} from 'server/src/featureflags/index.ts';
import { ClientFacingError } from 'server/src/util/ClientFacingError.ts';
import { RESTART_SUBSCRIPTION_ERROR } from 'server/src/public/subscriptions/util/restart_subscription.ts';
import { Counter, incCounterWithAppID } from 'server/src/logging/prometheus.ts';

export const GRAPHQL_ENDPOINT = '/gql';

const groupError = (externalOrgID: string) =>
  `User is not a member of group ${externalOrgID}. Verify you have created the group and added the user to it. See https://docs.cord.com/rest-apis/groups.`;

/**
 * Generates a new viewer, to use to replace the one in the given context, for a
 * specified externalID of an org. This is more-or-less a wrapper around
 * `viewer.viewerInOtherOrg`.
 *
 * The idea is that a specific GraphQL query can have an org ID overriden,
 * specified by the customer -- "for this API call, please find things that I
 * can see as a member of org X". Hence passing `null` for that org ID means
 * "please find things that I can see at all, as a member of all of my orgs
 * together".
 *
 * @param context The original context.
 * @param externalOrgID The external ID of the org to use to replace in the
 *   viewer. If `null`, generate a viewer which contains *all* of orgs the
 *   viewer is a member of.
 */
async function maybeViewerInOtherOrg(
  context: RequestContext,
  externalOrgID: string | null,
): Promise<Viewer> {
  const viewer = context.session.viewer;
  if (!viewer.userID) {
    return viewer;
  }

  const flagsUser = flagsUserFromContext(context);
  const allowSwap = await getTypedFeatureFlagValue(
    FeatureFlags.ALLOW_MAGIC_GRAPHQL_ORG_ID_OVERRIDE,
    flagsUser,
  );
  if (!allowSwap) {
    return viewer;
  }

  if (externalOrgID === null) {
    const relevantOrgIDs =
      await context.loaders.orgMembersLoader.loadAllImmediateOrgIDsForUser();
    return viewer.viewerInOtherOrg(undefined, undefined, relevantOrgIDs);
  }

  const platformApplicationID = assertViewerHasPlatformApplicationID(viewer);

  const org = await context.loaders.orgLoader.loadPlatformOrg(
    platformApplicationID,
    externalOrgID,
  );
  if (!org) {
    throw new ClientFacingError(groupError(externalOrgID));
  }

  const isMember = await context.loaders.orgMembersLoader.viewerCanAccessOrg(
    org.id,
  );
  if (!isMember) {
    throw new ClientFacingError(groupError(externalOrgID));
  }

  return viewer.viewerInOtherOrg(org.id, org.externalID);
}

async function updateContextPerRequest(
  context: RequestContext,
  vars: Record<string, any>,
) {
  const viewer =
    // This needs to be a specific "in" check so that it passes if it's set to an explicit null.
    '_externalOrgID' in vars || context.session.viewer.orgID === undefined
      ? await maybeViewerInOtherOrg(context, vars._externalOrgID ?? null)
      : context.session.viewer;

  const loaders = await getNewLoaders(viewer);

  return {
    ...context,
    session: {
      ...context.session,
      viewer,
    },
    loaders,
  };
}

function formatError(err: Error, context?: RequestContext) {
  if (err instanceof ApolloError) {
    return err;
  }

  const logger = context?.logger ?? anonymousLogger();

  let logLevel: 'error' | 'warn' = 'error';

  if (err.message === Errors.ADMIN_ONLY) {
    logLevel = 'warn';
  }
  // Log the actual error we get.
  logger.logException(err.message, err, undefined, undefined, logLevel);

  if (
    err instanceof ClientFacingError ||
    (err instanceof GraphQLError &&
      err.originalError instanceof ClientFacingError)
  ) {
    return new ApolloError(err.message, Errors.CLIENT_FACING_ERROR);
  }

  // in these cases, specify the error so we can handle it and not let the
  // client go bananas with retries
  if (err.message === Errors.USER_IS_BLOCKED) {
    return new ApolloError(
      Errors.USER_IS_BLOCKED,
      Errors.APOLLO_INTERNAL_SERVER_ERROR,
    );
  }

  if (err.message === Errors.RATE_LIMITED) {
    return new ApolloError(
      Errors.RATE_LIMITED,
      Errors.APOLLO_INTERNAL_SERVER_ERROR,
    );
  }

  // Return the most generic error we can.
  return new ApolloError(
    Errors.GENERIC_GRAPHQL_ERROR,
    Errors.GENERIC_GRAPHQL_ERROR,
  );
}

class CordWebSocketServer extends WebSocket.Server {
  // shouldHandle returns whether this websocket server should handle a request
  // coming in on this path.  The base implementation only returns true on the
  // literal path you supply in the `path` option, so we extend it to match our
  // defined path or any path starting with that.
  shouldHandle(request: http.IncomingMessage): boolean {
    if (this.options.path) {
      const index = request.url?.indexOf('?');
      const pathname =
        index && index !== -1 ? request.url?.slice(0, index) : request.url;
      return Boolean(
        pathname === this.options.path ||
          pathname?.startsWith(this.options.path + '/'),
      );
    }
    return true;
  }
}
const counter = Counter({
  name: 'SubscriptionsRestarted',
  help: 'When the graphl subscriptions have restarted when RESTART_SUBSCRIPTION_ERROR is thrown',
  labelNames: ['appID'],
});

export async function createApolloServer(
  graphQLSchema: GraphQLSchema,
  enforceAdmin: boolean,
  noServer = false,
) {
  const app = express();
  app.disable('x-powered-by');
  app.enable('trust proxy');

  const httpServer =
    process.env.NODE_ENV === 'development' && !process.env.IS_TEST
      ? https.createServer(
          {
            key: await fsPromises.readFile(
              path.dirname(url.fileURLToPath(import.meta.url)) +
                '/localhost.key',
            ),
            cert: await fsPromises.readFile(
              path.dirname(url.fileURLToPath(import.meta.url)) +
                '/localhost.crt',
            ),
          },
          app,
        )
      : http.createServer(app);

  let subscriptionServer: SubscriptionServer | undefined = undefined;
  const apolloServer = new ApolloServer({
    context: (expressContext) => {
      const context = (expressContext.req as RequestWithContext).context;

      if (enforceAdmin && !context.session.isAdmin) {
        throw new Error(Errors.ADMIN_ONLY);
      }

      return context;
    },
    schema: graphQLSchema,
    introspection: process.env.NODE_ENV !== 'production',
    formatError,
    plugins: [
      {
        async serverWillStart() {
          return {
            async drainServer() {
              subscriptionServer?.close();
            },
          };
        },
      },
      process.env.NODE_ENV === 'development' && !process.env.IS_TEST
        ? ApolloServerPluginLandingPageGraphQLPlayground()
        : ApolloServerPluginLandingPageDisabled(),
    ],
  });

  subscriptionServer = SubscriptionServer.create(
    {
      schema: graphQLSchema,
      execute: graphQLExecutePerformanceWrapper(
        async (...args: Parameters<ExecuteFunction>) => {
          try {
            const context = await updateContextPerRequest(
              args[3],
              args[4] ?? {},
            );
            args[3] = context;
            return await execute(...args);
          } catch (err: any) {
            throw formatError(err as Error, args[3]);
          }
        },
      ),
      subscribe: async (
        // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
        schema,
        document,
        rootValue,
        contextValue,
        variableValues,
        operationName,
        fieldResolver,
        subscribeFieldResolver,
      ) => {
        try {
          // We need to `updateContextPerRequest` in *two* places for
          // subscriptions -- once here to make sure we cover things like
          // swapping org ID for subscription setup. Then again below every time
          // the subscription is actually triggered, to cover things like
          // resetting loader caches.
          const baseContext = await updateContextPerRequest(
            contextValue,
            variableValues ?? {},
          );

          return await graphqlSubscribeFunctionWithRestart({
            schema,
            document,
            rootValue,
            contextValue: baseContext,
            variableValues,
            operationName,
            fieldResolver,
            subscribeFieldResolver,
          });
        } catch (err: any) {
          return await Promise.reject(formatError(err as Error, contextValue));
        }
      },
      validationRules: apolloServer.requestOptions.validationRules,
      async onConnect(
        connectionParams: unknown,
        websocket: WebSocket,
        connectionContext: ConnectionContext,
      ) {
        const cookieToken = cookie.parse(
          connectionContext.request.headers.cookie || '',
        )['token'] as string | undefined;

        const { Authorization, Version, Deployment } =
          connectionParams as WebsocketAuthParams;
        const context = await authenticatedRequestContext(
          Authorization || cookieToken || '',
          Version,
          Deployment,
        );

        if (enforceAdmin && !context.session.isAdmin) {
          throw new Error(Errors.ADMIN_ONLY);
        }

        context.logger.debug('Incoming connection (Apollo subscription)', {
          headers: connectionContext.request.headers,
          remoteAddress: connectionContext.request.socket.remoteAddress,
        });

        try {
          const { utmParameters, gaCookie, gaMeasurementCookie } =
            parametersFromRequest(connectionContext.request);

          context.session.utmParameters = utmParameters;
          context.session.ga = {
            cookie: gaCookie,
            measurementCookie: gaMeasurementCookie,
          };
        } catch (error) {
          context.logger.warn('Error parsing utm parameters from cookie');
        }

        websocketConnected(
          websocket,
          context,
          enforceAdmin ? 'admin' : 'public',
        );

        return context;
      },
      onDisconnect: (websocket: WebSocket) => {
        websocketDisconnected(websocket);
      },
      onOperation: (_msg: any, params: ExecutionParams) => {
        const context = params?.context;
        const formatErrorWithViewer = (err: Error) => formatError(err, context);
        params.formatError = formatErrorWithViewer;
        params.formatResponse = (value: any) => {
          return {
            ...value,
            errors: value.errors && value.errors.map(formatErrorWithViewer),
          };
        };
        return params;
      },
    },
    new CordWebSocketServer({
      ...(noServer ? { noServer: true } : { server: httpServer }),
      path: GRAPHQL_ENDPOINT,
    }),
  );

  subscriptionServer.server.addListener('connection', (ws) => {
    ws.addListener('error', (err) => {
      // We need this handler to catch certain WebSocket errors (e.g., "someone
      // sent garbage over the WebSocket connection"). Some classes of those
      // errors throw before any of our code has a chance to run, meaning they
      // will bring down a worker if we don't handle here.
      anonymousLogger().warn(`Caught websocket error: ${err.message}`);
    });
  });

  await apolloServer.start();

  const apolloMiddleware = apolloServer.getMiddleware({
    path: GRAPHQL_ENDPOINT,
  });

  return {
    app,
    httpServer,
    apolloServer,
    apolloMiddleware,
    subscriptionServer,
  };
}

function isAsyncIterableIterator(
  value: any,
): value is AsyncIterableIterator<ExecutionResult> {
  return typeof value === 'object' && Symbol.asyncIterator in value;
}

/**
 * This function returns an async iterator using the subscribe function from
 * graphql. The only difference is we also listen if a
 * 'RESTART_SUBSCRIPTION_ERROR' is being thrown. We catch it and re-generate the
 * subscription with an updated context.
 */
async function graphqlSubscribeFunctionWithRestart(
  subscriptionArgs: SubscriptionArgs,
): Promise<AsyncIterableIterator<ExecutionResult> | ExecutionResult> {
  async function makeNewIterator({
    restart,
  }: {
    restart: boolean;
  }): Promise<AsyncIterableIterator<ExecutionResult> | ExecutionResult> {
    const {
      schema,
      document,
      rootValue,
      contextValue,
      variableValues,
      operationName,
      fieldResolver,
      subscribeFieldResolver,
    } = subscriptionArgs;

    const customExecute = graphQLExecutePerformanceWrapper(
      async (args: ExecutionArgs) => {
        const newContext = await updateContextPerRequest(
          args.contextValue,
          args.variableValues ?? {},
        );
        return await execute({ ...args, contextValue: newContext });
      },
    );

    // Make sure we get an updated version of the context
    const updatedContext = await updateContextPerRequest(
      contextValue,
      variableValues ?? {},
    );

    if (restart) {
      incCounterWithAppID(updatedContext.session.viewer, counter);
    }

    return await subscribe({
      schema,
      document,
      rootValue,
      contextValue: updatedContext,
      variableValues,
      operationName,
      fieldResolver,
      subscribeFieldResolver,
      customExecute,
    });
  }

  const firstResult = await makeNewIterator({ restart: false });
  let current: AsyncIterableIterator<ExecutionResult>;

  if (!isAsyncIterableIterator(firstResult)) {
    // Not returning an iterator means either arguments passed into graphql
    // subscription were not compliant, or there was a client error.
    return firstResult;
  }
  current = firstResult;
  const r: AsyncGenerator<ExecutionResult> = {
    async next() {
      try {
        return await current.next();
      } catch (e) {
        if (e instanceof Error && e.message === RESTART_SUBSCRIPTION_ERROR) {
          await current.return!();

          const newIterator = await makeNewIterator({ restart: true });
          if (!isAsyncIterableIterator(newIterator)) {
            throw new Error('Not an async iterator');
          }
          current = newIterator;
          return await this.next();
        } else {
          throw e;
        }
      }
    },
    async return() {
      return await current.return!();
    },
    async throw(e) {
      return await current.throw!(e);
    },
    [Symbol.asyncIterator]() {
      return this;
    },
  };
  return r;
}
