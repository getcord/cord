import * as React from 'react';
import { useRef, useState } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { MessageBlock2 } from 'external/src/components/2/MessageBlock2.tsx';
import type { CSSVariable } from 'common/ui/cssVariables.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import { useThreadMessageBlocks } from 'external/src/components/threads/hooks/useThreadMessageBlocks.ts';
import type { ThreadData } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { ThreadsContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { Composer3 } from 'external/src/components/2/Composer3.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { SpinnerCover } from 'external/src/components/SpinnerCover.tsx';
import { InlineThreadLoadOlderMessages2 } from 'external/src/components/2/InlineThreadLoadOlderMessages2.tsx';
import type { EntityMetadata, UUID } from 'common/types/index.ts';
import { TypingUsers2 } from 'external/src/components/2/TypingUsers2.tsx';
import { ThreadMessageSeenBy } from 'external/src/components/threads/ThreadMessageSeenBy.tsx';
import { CSSVariableOverrideContext } from 'external/src/context/cssVariableOverride/CSSVariableOverrideContext.tsx';
import { useThreadHoverStyles2 } from 'external/src/components/2/hooks/useThreadHoverStyles2.ts';
import { UnreadMessageIndicator2 } from 'external/src/components/2/UnreadMessageIndicator2.tsx';
import { ScrollContainerProvider2 } from 'external/src/components/2/ScrollContainer2.tsx';
import { MessageSeenObserverProvider } from 'external/src/context/messageSeenObserver/MessageSeenObserverProvider.tsx';
import { inlineThread } from '@cord-sdk/react/components/Thread.classnames.ts';
import { useScrollToBottomOnNewViewerMessage } from 'external/src/components/2/hooks/useScrollToBottomOnNewViewerMessage.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';

const useStyles = createUseStyles({
  inlineThread: {
    // add "overflow: auto" to topmost box so that nested boxes dont cut
    // through its rounded corners
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    maxHeight: 'inherit',
    borderTop: cssVar('thread-border-top'),
    borderRight: cssVar('thread-border-right'),
    borderBottom: cssVar('thread-border-bottom'),
    borderLeft: cssVar('thread-border-left'),
  },
  messagesContainer: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    gap: cssVar('space-2xs'),
    position: 'relative',
    paddingTop: cssVar('space-3xs'),
    paddingRight: cssVar('space-3xs'),
    paddingBottom: cssVar('space-2xs'),
    paddingLeft: cssVar('space-3xs'),
  },
  emptyStateContainer: {
    paddingTop: cssVar('space-xl'),
    paddingLeft: cssVar('space-xl'),
    paddingRight: cssVar('space-xl'),
  },
  replyComposer: {
    padding: cssVar('space-2xs'),
  },
  emptyStateComposer: {
    padding: cssVar('space-2xs'),
  },
});

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

export type InlineThreadComponent2CSSOverrides = Partial<{
  border: CSSVariable;
  borderRadius: CSSVariable;
  backgroundColor: CSSVariable;
  padding: CSSVariable;
}>;

export const InlineThreadComponent2 = React.memo(
  function InlineThreadComponent2({
    thread,
    loadingInitialMessages,
    threadHeader,
    shouldFocusOnMount = false,
    observeMessagesToMarkAsSeen = true,
    showPlaceholder = false,
    composerExpanded = false,
    composerDisabled = false,
    threadMetadata,
  }: Props) {
    const classes = useStyles();
    const { loadOlderMessages } =
      useContextThrowingIfNoProvider(ThreadsContext2);
    const cssOverrideContext = useContextThrowingIfNoProvider(
      CSSVariableOverrideContext,
    );

    const { logError } = useLogger();

    if (thread.messages.length === 0) {
      logError('Inline Thread is empty', { threadID: thread.id });
    }

    const hoverClasses = useThreadHoverStyles2();

    const { blocks } = useThreadMessageBlocks(
      thread.messages,
      thread.firstMessageIDsOfLoad,
    );

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
        <Box2
          className={cx(
            inlineThread,
            classes.inlineThread,
            hoverClasses.inlineThread,
          )}
          cssVariablesOverride={cssOverrideContext.inlineThread}
          borderColor="base-x-strong"
          borderRadius="medium"
          forwardRef={threadWrapperRef}
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

          <ScrollContainerProvider2
            useScrollAdjuster={true}
            className={classes.messagesContainer}
            ref={scrollContainerRef}
          >
            <div key={thread.messages[0].id}>
              <MessageBlock2
                key={thread.messages[0].id}
                messages={firstBlock}
                showThreadOptions={!threadHeader}
              />
            </div>
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
                  <InlineThreadLoadOlderMessages2
                    // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
                    loadOlderMessages={(messageCount) =>
                      loadOlderMessages(thread.id, messageCount)
                    }
                    olderMessagesCount={thread.olderMessagesCount}
                  />
                )}
                {remainingBlocks.map((messages) => {
                  const isFirstUnseenBlock =
                    initialFirstUnseenMessageID === messages[0].id;
                  return (
                    <React.Fragment key={messages[0].id}>
                      {isFirstUnseenBlock && (
                        <UnreadMessageIndicator2 subscribed={subscribed} />
                      )}
                      <MessageBlock2 messages={messages} />
                    </React.Fragment>
                  );
                })}
                <ThreadMessageSeenBy
                  participants={thread.participants}
                  message={thread.messages[thread.messages.length - 1]}
                />
                <TypingUsers2 users={thread.typingUsers} />
              </>
            )}
          </ScrollContainerProvider2>
          <Composer3
            className={classes.replyComposer}
            shouldFocusOnMount={shouldFocusOnMount}
            showExpanded={composerExpanded}
            threadMetadata={threadMetadata}
            disabled={composerDisabled}
          />
        </Box2>
      </MessageSeenObserverProvider>
    );
  },
);
