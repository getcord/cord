import * as React from 'react';
import { useRef, useState } from 'react';

import { MessageBlock } from 'external/src/components/ui3/thread/MessageBlock.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import { useThreadMessageBlocks } from 'external/src/components/threads/hooks/useThreadMessageBlocks.ts';
import type { ThreadData } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { ThreadsContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { Composer } from 'external/src/components/ui3/composer/Composer.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { SpinnerCover } from 'external/src/components/SpinnerCover.tsx';
import { InlineThreadLoadOlderMessages } from 'external/src/components/ui3/thread/InlineThreadLoadOlderMessages.tsx';
import type { UUID } from 'common/types/index.ts';
import { TypingUsers } from 'external/src/components/ui3/TypingUsers.tsx';
import { ThreadMessageSeenBy } from 'external/src/components/threads/ThreadMessageSeenBy.tsx';
import { UnreadMessageIndicator } from 'external/src/components/ui3/thread/UnreadMessageIndicator.tsx';
import { ScrollContainerProvider } from 'external/src/components/ui3/ScrollContainer.tsx';
import { MessageSeenObserverProvider } from 'external/src/context/messageSeenObserver/MessageSeenObserverProvider.tsx';
import { useScrollToBottomOnNewViewerMessage } from 'external/src/components/2/hooks/useScrollToBottomOnNewViewerMessage.ts';

import * as classes from 'external/src/components/ui3/thread/InlineThread.css.ts';
import type { EntityMetadata } from '@cord-sdk/types';
import { useLogger } from 'external/src/logging/useLogger.ts';

type Props = {
  thread: ThreadData;
  loadingInitialMessages?: boolean;
  threadHeader?: JSX.Element;
  shouldFocusOnMount?: boolean;
  observeMessagesToMarkAsSeen?: boolean;
  showPlaceholder?: boolean;
  composerExpanded?: boolean;
  composerDisabled?: boolean;
  threadMetadata?: EntityMetadata;
};
/**
 * This component is for a thread with messages, for an empty inline thread
 * checkout the EmptyThread component
 */
export const InlineThreadComponent = React.memo(
  function InlineThreadComponent2({
    thread,
    threadMetadata,
    loadingInitialMessages,
    threadHeader,
    shouldFocusOnMount = false,
    observeMessagesToMarkAsSeen = true,
    showPlaceholder = false,
    composerExpanded = false,
    composerDisabled = false,
  }: Props) {
    const { loadOlderMessages } =
      useContextThrowingIfNoProvider(ThreadsContext2);

    const { blocks } = useThreadMessageBlocks(
      thread.messages,
      thread.firstMessageIDsOfLoad,
    );

    const { logError } = useLogger();

    if (thread.messages.length === 0) {
      logError('Inline Thread is empty', { threadID: thread.id });
    }

    // These variables are stored in state but not updated.  This is because we
    // don't want the UnreadMessageIndicator to change while the user is on the
    // thread because it seems janky.
    const [initialFirstUnseenMessageID] = useState<UUID | null>(
      thread.firstUnseenMessageID,
    );
    const [subscribed] = useState(thread.subscribed);

    const [firstBlock, ...remainingBlocks] = blocks;

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const threadWrapperRef = useRef<HTMLDivElement>(null);

    const threadInitiallyEmptyRef = useRef(thread.messages.length === 0);

    useScrollToBottomOnNewViewerMessage(scrollContainerRef, thread);

    return (
      <MessageSeenObserverProvider
        containerRef={scrollContainerRef}
        disabled={!observeMessagesToMarkAsSeen}
      >
        <div
          className={classes.inlineThread}
          ref={threadWrapperRef}
          style={{
            // Set minHeight only if we are rendering a thread with no messages
            // so when a user sends their first message
            // the size of the thread does not shrink
            minHeight:
              showPlaceholder && threadInitiallyEmptyRef.current
                ? threadWrapperRef.current?.offsetHeight
                : undefined,
          }}
        >
          {threadHeader}
          <ScrollContainerProvider
            useScrollAdjuster={true}
            ref={scrollContainerRef}
          >
            <MessageBlock
              key={thread.messages[0].id}
              messages={firstBlock}
              showThreadOptions={!threadHeader}
            />

            {loadingInitialMessages ? (
              <SpinnerCover
                size="xl"
                containerStyle={{
                  width: '100%',
                  // Set height in line with smallest possible message that can be
                  // added (an action message), so the thread doesn't increase
                  // then decrease in size
                  height: cssVar('space-l'),
                  position: 'relative',
                }}
              />
            ) : (
              <>
                {thread.olderMessagesCount > 0 && (
                  <InlineThreadLoadOlderMessages
                    loadOlderMessages={(messageCount) => {
                      void loadOlderMessages(thread.id, messageCount);
                    }}
                    olderMessagesCount={thread.olderMessagesCount}
                  />
                )}
                {remainingBlocks.map((messages) => {
                  const isFirstUnseenBlock =
                    initialFirstUnseenMessageID === messages[0].id;
                  return (
                    <React.Fragment key={messages[0].id}>
                      {isFirstUnseenBlock && (
                        <UnreadMessageIndicator subscribed={subscribed} />
                      )}
                      <MessageBlock messages={messages} />
                    </React.Fragment>
                  );
                })}
                <ThreadMessageSeenBy
                  participants={thread.participants}
                  message={thread.messages[thread.messages.length - 1]}
                />
                <TypingUsers users={thread.typingUsers} />
              </>
            )}
          </ScrollContainerProvider>
          <Composer
            shouldFocusOnMount={shouldFocusOnMount}
            showExpanded={composerExpanded}
            threadMetadata={threadMetadata}
            disabled={composerDisabled}
          />
        </div>
      </MessageSeenObserverProvider>
    );
  },
);
