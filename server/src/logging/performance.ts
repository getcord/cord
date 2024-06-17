import { performance } from 'perf_hooks';
import { AsyncLocalStorage } from 'async_hooks';
import * as Sentry from '@sentry/node';
import type { Transaction } from '@sentry/types';
import type WebSocket from 'ws';
import { v4 as uuid } from 'uuid';
import type { RequestContext } from 'server/src/RequestContext.ts';
import {
  TimeHistogram,
  Gauge,
  Counter,
  incCounterWithAppID,
} from 'server/src/logging/prometheus.ts';
import type { UUID } from 'common/types/index.ts';
import { isEmployee } from 'common/util/index.ts';
import type { Logger } from 'server/src/logging/Logger.ts';

type AsyncLocalStorageType = {
  operationName: string;
  operationID: UUID;
  platformApplicationID: UUID | undefined;
  logger: Logger;
};

// Using AsyncLocalStorage is not free. We previously had it enabled only in
// staging, but it's so darn useful we took the hit and enabled everywhere.
// However, to try to make sure we don't completely depend on it and can still
// turn it off again if need be, explicitly type this variable as being
// potentially null (even though in practise it never is) so that callers have
// to at least deal with it being missing at a TS level.
export const asyncLocalStorage: AsyncLocalStorage<AsyncLocalStorageType> | null =
  new AsyncLocalStorage<AsyncLocalStorageType>();

const DO_NOT_LOG_OPERATIONS = ['PingQuery'];

type WebSocketWithDetails = WebSocket & {
  cordOnCloseWebSocket?: () => void;
  // Properties we add to the websocket so we can identify them in heap dumps
  cordDebugInfo?: {
    userID: UUID | undefined;
    orgID: UUID | undefined;
    socketID: UUID;
    connectionID: UUID;
    connectionStart: string;
    connectionEnd?: string;
  };
};

// In any case, production or not, we keep track of the GraphQL operation
// execution times in this Prometheus metric:
const graphQlMetric = TimeHistogram({
  name: `GraphQlExecTime`,
  help: `Execution time of GraphQL operations in seconds`,
  labelNames: ['operation'],
});

// Separate from the above histogram so we don't explode operation*appID*bucket.
const graphQLCounter = Counter({
  name: 'GraphQlExecCount',
  help: 'Total number of GraphQL operations executed',
  labelNames: ['operation', 'appID'],
});

const openWebsocketMetric = Gauge({
  name: 'OpenWebsockets',
  help: 'Number of open websocket connections',
  labelNames: ['appID', 'clientVersion', 'endpoint', 'deployment'],
});

export function websocketConnected(
  socket: WebSocketWithDetails,
  context: RequestContext,
  endpoint: 'public' | 'admin',
) {
  const socketID = uuid();
  const {
    session: {
      viewer: { userID, orgID, platformApplicationID: appID },
    },
    clientVersion,
  } = context;

  const openWebsocketMetricLabels = {
    appID: appID || 'null',
    clientVersion: clientVersion || 'null',
    endpoint,
    deployment: context.deployment ?? 'null',
  };
  const loggingInfo = { socketID, userID, orgID, appID, clientVersion };

  openWebsocketMetric.inc(openWebsocketMetricLabels, 1);
  context.logger.debug('performance', {
    event: 'websocketConnected',
    ...loggingInfo,
  });

  socket.cordOnCloseWebSocket = () => {
    openWebsocketMetric.dec(openWebsocketMetricLabels, 1);
    context.logger.debug('performance', {
      event: 'websocketDisconnected',
      ...loggingInfo,
    });
    if (socket.cordDebugInfo) {
      socket.cordDebugInfo.connectionEnd = new Date().toUTCString();
    }
  };
  socket.cordDebugInfo = {
    userID,
    orgID,
    socketID,
    connectionID: context.connectionID,
    connectionStart: new Date().toUTCString(),
  };
}

export function websocketDisconnected(socket: WebSocketWithDetails) {
  const { cordOnCloseWebSocket } = socket;
  if (cordOnCloseWebSocket) {
    delete socket.cordOnCloseWebSocket;
    cordOnCloseWebSocket();
  }
}

/**
 * Sorry about the "any" -- this is usable at two different types, the type of
 * the main "execute" and the type of the subscription "customExecute", which
 * pass arguments slightly differently. The code to adapt the differences is not
 * difficult, but convincing TS that it's correct is. If you want to try to fix
 * it, you probably have better ways to spend your time.
 */
export function graphQLExecutePerformanceWrapper(
  previousExecuteFunction: any,
): any {
  const execute = (...args: any[]) => {
    let operationFinished = () => {};

    // Deal with the two different input types, for the main execute (passes
    // multiple args) and the subscription execute (passes one object arg).
    const context: RequestContext =
      args.length > 1 ? args[3] : args[0].contextValue;
    const variableValues = args.length > 1 ? args[4] : args[0].variableValues;
    const operationName = args.length > 1 ? args[5] : args[0].operationName;

    if (operationName && !DO_NOT_LOG_OPERATIONS.includes(operationName)) {
      const { userID, orgID } = context.session.viewer;

      // Have a random uuid just so we can unambiguously relate the log
      // lines we send at the beginning and the end of this operation
      const operationUUID =
        asyncLocalStorage?.getStore()?.operationID ?? uuid();

      // Before we execute the GraphQL operation: take the current time
      // (`startTime`) and write a log line about the operation about to start
      const startTime = performance.now();
      context.logger.debug(`performance`, {
        event: 'graphQlExecuteStart',
        userID,
        orgID,
        operation: operationName,
        operationUUID,
      });

      incCounterWithAppID(context.session.viewer, graphQLCounter, {
        operation: operationName,
      });

      let sentryTransaction: Transaction | undefined;
      if (isEmployee(orgID)) {
        sentryTransaction = Sentry.startTransaction({
          op: 'graphql',
          name: operationName,
          data: variableValues,
        });
      }

      // This is going to get executed when the GraphQL operation has finished:
      // we write another log line, register the execution time in the
      // Prometheus metric, and write a row to the database (if enabled)
      operationFinished = () => {
        const durationMS = performance.now() - startTime;

        // log to winston
        context.logger.debug(`performance`, {
          event: 'graphQlExecuteEnd',
          userID: userID,
          orgID: orgID,
          operation: operationName,
          operationUUID,
          durationMS,
        });

        // update prometheus metric (prometheus values are in seconds)
        graphQlMetric.observe({ operation: operationName }, durationMS / 1000);

        if (sentryTransaction) {
          Sentry.withScope((scope) => {
            scope.setUser(userID ? { id: userID } : null);
            sentryTransaction?.finish();
          });
        }
      };
    }

    // An `ExecuteFunction` can return either a plain `ExecutionResult` or a `Promise<ExecutionResult>`, or
    // `AsyncIterator<ExecutionResult>`.
    const result = previousExecuteFunction(...args);

    if ('next' in result) {
      // The presence of a `next` field means that `result` is of type
      // `AsyncIterator<ExecutionResult>`
      return asyncIteratorFinally(result, operationFinished);
    } else {
      // `result` is a `ExecutionResult` or `Promise<ExecutionResult>`. Either
      // way, we return it in the form of a `Promise<ExecutionResult>`.
      return Promise.resolve(result).finally(operationFinished);
    }
  };

  if (asyncLocalStorage) {
    return (...args: any[]) => {
      const context: RequestContext =
        args.length > 1 ? args[3] : args[0].contextValue;
      const operationName = args.length > 1 ? args[5] : args[0].operationName;
      return asyncLocalStorage.run(
        {
          operationName,
          operationID: uuid(),
          platformApplicationID: context.session.viewer.platformApplicationID,
          logger: context.logger,
        },
        execute,
        ...args,
      );
    };
  } else {
    return execute;
  }
}

function asyncIteratorFinally<T, TReturn, TNext>(
  aiter: AsyncIterator<T, TReturn, TNext>,
  finallyFunc: () => void,
): AsyncIterator<T, TReturn, TNext> {
  let finallyFuncHasBeenCalled = false;

  return {
    async next(...args) {
      const item = await aiter.next(...args);
      if (item.done) {
        if (!finallyFuncHasBeenCalled) {
          finallyFuncHasBeenCalled = true;
          finallyFunc();
        }
      }
      return item;
    },
  };
}
