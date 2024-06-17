import { useState, useEffect, useMemo } from 'react';

import { InboxContext } from 'external/src/context/inbox/InboxContext.ts';
import {
  useInboxCountQuery,
  useInboxSubscription,
} from 'external/src/graphql/operations.ts';

export function InboxProvider(props: React.PropsWithChildren<any>) {
  const [count, setCount] = useState(0);
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState(Date.now());

  const { data: initialData } = useInboxCountQuery();

  const { data: subscriptionUpdate } = useInboxSubscription();

  useEffect(() => {
    if (initialData) {
      setCount(initialData.viewer.inbox.count);
      setLastUpdateTimestamp(Date.now());
    }
  }, [initialData]);

  useEffect(() => {
    if (subscriptionUpdate?.inbox) {
      setCount(subscriptionUpdate.inbox.count);
      setLastUpdateTimestamp(Date.now());
    }
  }, [subscriptionUpdate]);

  const value = useMemo(
    () => ({
      count,
      lastUpdateTimestamp,
    }),
    [count, lastUpdateTimestamp],
  );

  return (
    <InboxContext.Provider value={value}>
      {props.children}
    </InboxContext.Provider>
  );
}
