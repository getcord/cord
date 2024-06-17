import { useContext as unsafeUseContext, useMemo } from 'react';

import { ThreadsDataContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import type { ThreadMode, UUID } from 'common/types/index.ts';
import type { SlackChannelType } from 'external/src/graphql/custom.ts';
import { Thread2Context } from 'external/src/context/thread2/Thread2Context.ts';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

export function Thread2Provider({
  threadID,
  externalThreadID,
  threadMode,
  initialSlackShareChannel,
  children,
}: React.PropsWithChildren<{
  threadID: UUID;
  externalThreadID?: string;
  threadMode: ThreadMode;
  initialSlackShareChannel: SlackChannelType | null;
}>) {
  const threadData = useContextThrowingIfNoProvider(ThreadsDataContext2);
  const thread = threadData[threadID];

  const threadContextValue = useMemo(
    () => ({
      threadID,
      externalThreadID: thread?.externalID ?? externalThreadID ?? null,
      thread,
      threadMode,
      initialSlackShareChannel,
    }),
    [initialSlackShareChannel, thread, threadID, externalThreadID, threadMode],
  );

  // Sometimes we render ThreadProvider higher up. Current use case is in
  // ThreadPage2, so we can access the context in its topNav (specifically
  // ThreadActionsMenu2 in topNav).
  const threadContext = unsafeUseContext(Thread2Context);
  const providerAlreadyExists = threadContext !== NO_PROVIDER_DEFINED;
  if (providerAlreadyExists) {
    return <>{children}</>;
  }

  return (
    <Thread2Context.Provider value={threadContextValue}>
      {children}
    </Thread2Context.Provider>
  );
}
