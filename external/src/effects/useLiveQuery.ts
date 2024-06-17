import { useApolloClient } from '@apollo/client';
import { useEffect, useState } from 'react';

import type { SubscriptionTypes } from 'external/src/graphql/operations.ts';
import { subscriptions } from 'external/src/graphql/operations.ts';
import type { JsonValue } from 'common/types/index.ts';

export function useLiveQuery<
  S extends keyof SubscriptionTypes,
  T extends JsonValue = SubscriptionTypes[S]['result'],
>(
  subscriptionName: S,
  reducer: (x: T | undefined, y: SubscriptionTypes[S]['result']) => T,
  skip = false,
) {
  const client = useApolloClient();

  const [state, setState] = useState<T>();
  // When runCount is incremented, the subscription disconnects and reconnects
  // because it is a dependency of the useEffect
  const [runCount, setRunCount] = useState(1);

  useEffect(() => {
    if (!skip) {
      // Subscribe to the given subscription...
      const subscription = client
        .subscribe<SubscriptionTypes[S]['result']>({
          query: subscriptions[subscriptionName],
          fetchPolicy: 'no-cache',
        })
        .subscribe({
          next({ data }) {
            // ...and on each incoming update, apply the update to the current
            // state via the reducer function
            if (data != null) {
              setState((previousState) => reducer(previousState, data));
            }
          },
        });

      return () => {
        subscription.unsubscribe();
      };
    }
    return;
  }, [skip, client, subscriptionName, reducer, runCount]);

  function reinitialise() {
    setRunCount((previousState) => previousState + 1);
  }

  return [state, setState, reinitialise] as const;
}
