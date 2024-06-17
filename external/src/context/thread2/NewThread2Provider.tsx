import { useMemo } from 'react';
import type { UUID } from 'common/types/index.ts';
import type { Thread2ContextType } from 'external/src/context/thread2/Thread2Context.ts';
import { Thread2Context } from 'external/src/context/thread2/Thread2Context.ts';
import { ComposerProvider } from 'external/src/context/composer/ComposerProvider.tsx';
import type { ComposerAction } from 'external/src/context/composer/ComposerState.ts';
import type { SlackChannelType } from 'external/src/graphql/custom.ts';

type Props = {
  threadID: UUID;
  initialComposerAction?: ComposerAction;
  slackChannelToShareTo: SlackChannelType | null;
};

/**
 * Includes thread and composer providers to create a new thread
 */
export default function NewThread2Provider({
  threadID,
  initialComposerAction,
  slackChannelToShareTo,
  children,
}: React.PropsWithChildren<Props>) {
  const threadContextValue: Thread2ContextType = useMemo(
    () => ({
      threadID,
      externalThreadID: null,
      threadMode: 'newThread',
      initialSlackShareChannel: slackChannelToShareTo,
      thread: null,
    }),
    [threadID, slackChannelToShareTo],
  );

  return (
    <Thread2Context.Provider value={threadContextValue}>
      <ComposerProvider initialComposerAction={initialComposerAction}>
        {children}
      </ComposerProvider>
    </Thread2Context.Provider>
  );
}
