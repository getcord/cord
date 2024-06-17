import { createContext, useCallback, useEffect, useMemo, useRef } from 'react';
import type { SubscriptionClient } from 'subscriptions-transport-ws';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

type Listener = () => unknown;

type NetworkStatusContextType = {
  addDisconnectListener(listener: Listener): () => void;
};

export const NetworkStatusContext = createContext<
  NetworkStatusContextType | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);

type Props = {
  subscriptionClient?: SubscriptionClient;
};

export function NetworkStatusProvider({
  subscriptionClient,
  children,
}: React.PropsWithChildren<Props>) {
  const listenersRef = useRef<Listener[]>([]);

  const addDisconnectListener = useCallback((listener: Listener) => {
    listenersRef.current.push(listener);
    return () =>
      (listenersRef.current = listenersRef.current.filter(
        (l) => l !== listener,
      ));
  }, []);

  useEffect(() => {
    if (subscriptionClient) {
      const removeListener = subscriptionClient.onDisconnected(() => {
        // Take a copy of the listeners in case a listener removes itself
        const listeners = [...listenersRef.current];
        for (const listener of listeners) {
          listener();
        }
      });
      return () => removeListener();
    }
    return undefined;
  }, [subscriptionClient]);

  const contextValue = useMemo(
    () => ({
      addDisconnectListener,
    }),
    [addDisconnectListener],
  );
  return (
    <NetworkStatusContext.Provider value={contextValue}>
      {children}
    </NetworkStatusContext.Provider>
  );
}
