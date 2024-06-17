import type { ApolloLink } from '@apollo/client';
import { ApolloClient, InMemoryCache, from } from '@apollo/client';
import { WebSocketLink } from '@apollo/client/link/ws';
import { onError } from '@apollo/client/link/error';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import Backoff from 'backo2';
import * as Sentry from '@sentry/browser';

import type { WebsocketAuthParams } from 'common/auth/index.ts';
import { getAuthorizationHeaderWithToken } from 'common/auth/index.ts';
import { Errors } from 'common/const/Errors.ts';
import { createLogEvent } from 'external/src/logging/common.ts';
import { LogLevel, toDeploymentType } from 'common/types/index.ts';
import type {
  LogEventsMutationResult,
  LogEventsMutationVariables,
  PingQueryResult,
  AccessTokenQueryResult,
} from 'external/src/graphql/operations.ts';
import {
  LogEventsMutation,
  PingQuery,
  AccessTokenQuery,
} from 'external/src/graphql/operations.ts';
import { decodeAccessTokenPayload } from 'sdk/client/core/util.ts';
import setTimeoutAsync from 'common/util/setTimeoutAsync.ts';

// how long to wait to retry the access token query if it errors
const ACCESS_TOKEN_QUERY_BACKOFF_SECONDS = 10;

// check if the socket is alive every 10 seconds
const ALIVE_CHECK_INTERVAL_SECONDS = 10;

// wait 5 seconds for the ping response before declaring the socket dead
const ALIVE_CHECK_WAIT_SECONDS = 5;
const ALIVE_CHECK_WAIT_MAX_SECONDS = 60;

export type ErrorCallback = (error: { message: string }) => void;

export const apolloConnection = ({
  token,
  apiHost,
  errorCallback,
  logGraphQLErrors,
  fetchAccessToken = true,
}: {
  token: string | null;
  apiHost: string;
  errorCallback: ErrorCallback;
  logGraphQLErrors: boolean;
  fetchAccessToken?: boolean;
}) => {
  const connectionParams: WebsocketAuthParams = {
    Authorization: getAuthorizationHeaderWithToken(token),
    Version: BUILDCONSTANTS.version,
    Deployment: toDeploymentType(BUILDCONSTANTS.deployment),
  };

  const payload = token ? decodeAccessTokenPayload(token) : null;
  const path = payload?.app_id ? `gql/${payload.app_id}` : 'gql';

  const subscriptionClient = new SubscriptionClient(
    `wss://${apiHost}/${path}`,
    {
      reconnect: true,
      timeout: 10000,
      connectionParams,
      connectionCallback: (errors) => {
        if (errors) {
          // errors is typed as Error[] but in fact we get an Error object if there
          // was an error while connecting. Just to be safe, we check both array and
          // non-array input

          const error = Array.isArray(errors)
            ? (errors[0] as Error | undefined)
            : (errors as { message?: string });

          if (error) {
            const { message } = error;
            if (message?.startsWith(Errors.INVALID_SESSION)) {
              subscriptionClient.close(true);
              errorCallback({ message });
              console.warn(
                `Failed to establish connection, Cord token is likely invalid: ${message}`,
              );
            }

            createLogEvent('graphql-connection-error', LogLevel.WARN, {
              message,
            });
          }
        }
      },
    },
  );

  // @ts-ignore: the backoff property is private
  const clientBackoff = subscriptionClient.backoff as Backoff;
  clientBackoff.setMin(1000);
  clientBackoff.setMax(1000);

  const websocketLink = new WebSocketLink(subscriptionClient);

  const graphQLErrorLink = onError(({ operation, graphQLErrors }) => {
    if (
      subscriptionClient.status === WebSocket.OPEN &&
      graphQLErrors &&
      graphQLErrors.length > 0 &&
      // if at least one of the errors here indicates that the logEvents mutation failed
      // then don't try to log this error because, well, the logEvents mutation will fail,
      // creating an infinite loop
      operation.operationName !== 'LogEvents'
    ) {
      // These are generated when an exception is thrown server-side, and the
      // server always logs that error itself before sending this error back up,
      // so we don't need to make a big deal of it here since all of the actual
      // actionable information is in the server-side log.
      const areAllGenericErrors = graphQLErrors.every(
        (graphQLError) => graphQLError.message === Errors.GENERIC_GRAPHQL_ERROR,
      );
      const level = areAllGenericErrors ? LogLevel.INFO : LogLevel.ERROR;

      graphQLErrors.forEach((graphQLError) =>
        Sentry.withScope((scope) => {
          scope.setExtra('operation', operation.operationName);
          scope.setExtra('variables', operation.variables);
          scope.setExtra('graphQLError', graphQLError);
          Sentry.captureException(graphQLError.message);
        }),
      );

      void apolloClient.mutate<
        LogEventsMutationResult,
        LogEventsMutationVariables
      >({
        mutation: LogEventsMutation,
        variables: {
          events: graphQLErrors.map((graphQLError) =>
            createLogEvent('graphql-error', level, {
              message: graphQLError.message,
              operation: operation.operationName,
              variables: operation.variables,
            }),
          ),
          _externalOrgID: undefined,
        },
      });
    }
  });

  const networkErrorLink = onError(({ networkError }) => {
    if (networkError?.message.startsWith(Errors.INVALID_SESSION)) {
      // we can't log this to the backend because the websocket connection itself was
      // not successfuly opened

      // we also manually close the websocket, and the true parameter means we
      // ignore the reconnect logic so it doesn't try to reconnect
      subscriptionClient.close(true);
    }
    if (networkError?.message.startsWith(Errors.CLIENT_TOO_OLD)) {
      subscriptionClient.close(true);
    }

    if (networkError?.message) {
      errorCallback(networkError);
    }
  });

  const blockingErrorLink = onError(({ graphQLErrors }) => {
    // In some unusual cases we may block users - this stops their clients obsessively
    // retrying requests, which can lead to max call stack exceeded errors on the
    // client
    if (
      graphQLErrors?.[0]?.message === Errors.USER_IS_BLOCKED ||
      graphQLErrors?.[0]?.message === Errors.RATE_LIMITED
    ) {
      subscriptionClient.close(true);
    }
  });

  const apolloClientLinks = [
    blockingErrorLink,
    networkErrorLink,
    websocketLink,
  ];

  if (logGraphQLErrors) {
    apolloClientLinks.unshift(graphQLErrorLink);
  }

  const apolloClient = createApolloClient(from(apolloClientLinks));

  // NOTE(flooey/Dec 2021): We've been seeing problems where a client issues a
  // set of queries that cause huge backend delays, and because of PingQuery
  // killing their connection after ALIVE_CHECK_INTERVAL_SECONDS +
  // ALIVE_CHECK_WAIT_SECONDS, they reconnect and reissue the query on a new
  // machine, causing cascading problems.  Extend the amount of time we wait for
  // PingQuery to get back if we keep connecting successfully but then not
  // succeeding at pinging.
  const pingFailTimer = new Backoff({
    min: ALIVE_CHECK_WAIT_SECONDS * 1000,
    max: ALIVE_CHECK_WAIT_MAX_SECONDS * 1000,
  });

  // this closes the websocket connection with the isForced=false flag
  // so that it immediately starts the reconnect attempt.
  const killConnection = () => {
    console.warn('Force restarting websocket');
    subscriptionClient.close(false);
  };

  setInterval(() => {
    if (subscriptionClient.status === WebSocket.OPEN) {
      const killTimeout = setTimeout(
        () => killConnection(),
        pingFailTimer.duration(),
      );

      apolloClient
        .query<PingQueryResult>({
          query: PingQuery,
        })
        .then(() => pingFailTimer.reset())
        .catch(() => killConnection())
        .finally(() => clearTimeout(killTimeout));
    }
  }, ALIVE_CHECK_INTERVAL_SECONDS * 1000);

  if (fetchAccessToken) {
    // Immediately fetch a valid access token so that we can replace any
    // short-lived application-created one with a token that will work on
    // reconnect
    const getAccessToken = async () => {
      const { data, error } = await apolloClient.query<AccessTokenQueryResult>({
        query: AccessTokenQuery,
        variables: {},
      });
      if (error) {
        setTimeoutAsync(
          getAccessToken,
          ACCESS_TOKEN_QUERY_BACKOFF_SECONDS * 1000,
        );
      } else {
        connectionParams.Authorization = getAuthorizationHeaderWithToken(
          data.viewer.accessToken,
        );
      }
    };

    void getAccessToken();
  }

  return { apolloClient, subscriptionClient };
};

export function createApolloClient(link: ApolloLink) {
  return new ApolloClient({
    link,
    // Turn off cache. There's no option for subscription so we add the
    // 'no-cache' fetchPolicy in the subscription hooks generated by our codegen
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all',
      },
      query: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all',
      },
      mutate: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all',
      },
    },
    cache: new InMemoryCache({ addTypename: false }),
  });
}
