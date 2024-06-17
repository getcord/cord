import { useRef, useMemo, useEffect } from 'react';
import { ApolloProvider } from '@apollo/client';
import type { SubscriptionClient } from 'subscriptions-transport-ws';

import type { ErrorCallback } from 'external/src/common/apolloClient.ts';
import { apolloConnection } from 'external/src/common/apolloClient.ts';
import { NetworkStatusProvider } from 'external/src/context/network/NetworkStatusContext.tsx';

type Props = {
  apiHost: string;
  logGraphQLErrors: boolean;
  fetchAccessToken?: boolean;
  token: string | null;
  errorCallback?: ErrorCallback;
};

const logOnLineStatus = () =>
  // eslint-disable-next-line no-console
  console.log(new Date().toISOString() + ' online=' + navigator.onLine);

/*
  Since we use a websocket connection for all our graphQL, the authentication happens
  only once, when the connection is opened. If the access token changes for whatever reason
  during the lifetime of the app, we must close the existing connection and open a new one,
  authenticating with the new token.
*/
export function DirectNetworkProvider({
  apiHost,
  logGraphQLErrors,
  fetchAccessToken = true,
  token,
  children,
  errorCallback = () => {}, // TODO Implement this function to show errors to users. ,
}: React.PropsWithChildren<Props>) {
  const { apolloClient, subscriptionClient } = useMemo(
    () =>
      apolloConnection({
        token,
        apiHost,
        logGraphQLErrors,
        fetchAccessToken,
        errorCallback,
      }),
    [token, apiHost, logGraphQLErrors, fetchAccessToken, errorCallback],
  );

  const subscriptionClientRef = useRef<SubscriptionClient>();

  // if the user-dependent websocket connection is different from the current one
  if (subscriptionClient !== subscriptionClientRef.current) {
    // when the subscription client changes due to a different identity,
    // close websocket connection, if one exists
    subscriptionClientRef.current?.close();

    // save the new one in the ref
    subscriptionClientRef.current = subscriptionClient;
  }

  useEffect(() => {
    return () => {
      // when the entire component is removed from the DOM,
      // close websocket connection, if one exists
      subscriptionClientRef.current?.close();
    };
  }, []);

  useEffect(() => {
    window.addEventListener('online', logOnLineStatus);
    window.addEventListener('offline', logOnLineStatus);

    return () => {
      window.removeEventListener('online', logOnLineStatus);
      window.removeEventListener('offline', logOnLineStatus);
    };
  }, []);

  return (
    <>
      {apolloClient && (
        <ApolloProvider client={apolloClient}>
          <NetworkStatusProvider subscriptionClient={subscriptionClient}>
            {children}
          </NetworkStatusProvider>
        </ApolloProvider>
      )}
    </>
  );
}
