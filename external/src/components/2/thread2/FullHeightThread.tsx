import * as React from 'react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { MessageBlock2 } from 'external/src/components/2/MessageBlock2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import { useThreadMessageBlocks } from 'external/src/components/threads/hooks/useThreadMessageBlocks.ts';
import type { ThreadData } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { ThreadsContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { Composer3 } from 'external/src/components/2/Composer3.tsx';
import { ScrollContainerProvider2 } from 'external/src/components/2/ScrollContainer2.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { SpinnerCover } from 'external/src/components/SpinnerCover.tsx';
import { Styles } from 'common/const/Styles.ts';
import { Sizes } from 'common/const/Sizes.ts';
import { UnreadMessageIndicator2 } from 'external/src/components/2/UnreadMessageIndicator2.tsx';
import type { UUID } from 'common/types/index.ts';
import { DeepLinkContext } from 'external/src/context/deepLink/DeepLinkContext.ts';
import { TypingUsers2 } from 'external/src/components/2/TypingUsers2.tsx';
import { ThreadMessageSeenBy } from 'external/src/components/threads/ThreadMessageSeenBy.tsx';
import { MessageSeenObserverProvider } from 'external/src/context/messageSeenObserver/MessageSeenObserverProvider.tsx';
import { useScrollToBottomOnNewViewerMessage } from 'external/src/components/2/hooks/useScrollToBottomOnNewViewerMessage.ts';
import { cordifyClassname } from 'common/ui/style.ts';

const INITIAL_MESSAGES_COUNT = 20;
const LOAD_MORE_MESSAGE_COUNT_ON_SCROLL = 15;

const useStyles = createUseStyles({
  threadContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  threadScrollContainer: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: cssVar('space-2xs'),
    padding: `${cssVar('space-m')} ${cssVar('space-2xs')}`,
    position: 'relative',
    overflowAnchor: 'none', // Stops chrome automatically changing scroll when content added
    overscrollBehavior: 'contain', // Stops scroll chaining to main webpage
  },
  composer: {
    padding: cssVar('space-2xs'),
    paddingTop: '0',
  },
});

type Props = {
  thread: ThreadData;
  shouldFocusOnMount?: boolean;
  observeMessagesToMarkAsSeen?: boolean;
};

// Todo
// - Scroll to first unread message on initial load
// - Scroll to bottom when viewer posts new message
export const FullHeightThreadComponent2 = React.memo(
  function FullHeightThreadComponent2({
    thread,
    shouldFocusOnMount = true,
    observeMessagesToMarkAsSeen = true,
  }: Props) {
    const classes = useStyles();
    const [initialLoadInProgress, setInitialLoadInProgress] = useState(true);
    const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);

    const { removeMessage, loadOlderMessages, loadMessagesFrom } =
      useContextThrowingIfNoProvider(ThreadsContext2);
    const { deepLinkInfo } = useContextThrowingIfNoProvider(DeepLinkContext);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // These variables are stored in state but not updated.  This is because we
    // don't want the UnreadMessageIndicator to change while the user is on the
    // thread because it seems janky.
    const [initialFirstUnseenMessageID] = useState<UUID | null>(
      thread.firstUnseenMessageID,
    );
    const [subscribed] = useState(thread.subscribed);

    const [initialScrollSet, setInitialScrollSet] = useState(false);
    const [loadingDeepLinkedMessage, setLoadingDeepLinkedMessage] =
      useState(false);

    // Load deepLinkedMessage, if necessary
    useEffect(() => {
      if (
        deepLinkInfo?.threadID === thread.id &&
        deepLinkInfo.messageID &&
        !thread.messages.find(
          (message) => message.id === deepLinkInfo.messageID,
        )
      ) {
        setLoadingDeepLinkedMessage(true);
        loadMessagesFrom(thread.id, deepLinkInfo.messageID)
          .then(() => setLoadingDeepLinkedMessage(false))
          .catch(() => setLoadingDeepLinkedMessage(false));
      }
    }, [deepLinkInfo, loadMessagesFrom, thread.id, thread.messages]);

    const scrollToBottom = useCallback(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop =
          scrollContainerRef.current.scrollHeight;
      }
    }, []);

    const [firstUnseenBlockElement, setFirstUnseenBlockElement] =
      useState<HTMLDivElement | null>(null);

    useEffect(() => {
      if (firstUnseenBlockElement && scrollContainerRef.current) {
        const scroll = (offsetTop: number) =>
          scrollContainerRef.current?.scrollTo(0, offsetTop);

        scroll(firstUnseenBlockElement.offsetTop);
        // Second scroll needed if any messages are truncated, otherwise
        // the offsetTop is off by the height of the 'Show more' toggles
        setTimeout(() => scroll(firstUnseenBlockElement.offsetTop), 0);
        setInitialScrollSet(true);
      }
    }, [firstUnseenBlockElement]);

    useLayoutEffect(() => {
      if (!initialLoadInProgress && !initialFirstUnseenMessageID) {
        scrollToBottom();
        // Second scrollToBottom needed if any messages are truncated, otherwise
        // the scrollBottom is off by the height of the 'Show more' toggles
        setTimeout(scrollToBottom, 0);
        setInitialScrollSet(true);
      }
    }, [initialFirstUnseenMessageID, initialLoadInProgress, scrollToBottom]);

    const loadedRef = useRef(false);

    useLayoutEffect(() => {
      if (loadedRef.current) {
        return;
      }
      loadedRef.current = true;
      const messagesLoaded = thread.messages.length - 1; // Don't include first message
      const messagesToLoad = Math.min(
        INITIAL_MESSAGES_COUNT - messagesLoaded,
        thread.olderMessagesCount,
      );
      if (messagesToLoad) {
        void loadOlderMessages(thread.id, messagesToLoad).then(() =>
          setInitialLoadInProgress(false),
        );
      } else {
        setInitialLoadInProgress(false);
      }
    }, [
      loadOlderMessages,
      removeMessage,
      thread.id,
      thread.messages,
      thread.olderMessagesCount,
    ]);

    const messagesToRender = useMemo(() => {
      if (thread.olderMessagesCount) {
        // Don't render first message if not all messages loaded yet
        return thread.messages.slice(1);
      }
      return thread.messages;
    }, [thread.messages, thread.olderMessagesCount]);

    const { blocks } = useThreadMessageBlocks(
      messagesToRender,
      thread.firstMessageIDsOfLoad,
      initialFirstUnseenMessageID,
    );

    const onScroll = useCallback(
      (scrollTop: number) => {
        if (
          thread.olderMessagesCount &&
          scrollTop < Sizes.INFINITE_SCROLL_THRESHOLD_PX &&
          !initialLoadInProgress &&
          !loadingOlderMessages
        ) {
          setLoadingOlderMessages(true);
          void loadOlderMessages(
            thread.id,
            LOAD_MORE_MESSAGE_COUNT_ON_SCROLL,
          ).then(() => setLoadingOlderMessages(false));
        }
      },
      [
        initialLoadInProgress,
        loadOlderMessages,
        loadingOlderMessages,
        thread.id,
        thread.olderMessagesCount,
      ],
    );

    useScrollToBottomOnNewViewerMessage(scrollContainerRef, thread);

    return (
      <MessageSeenObserverProvider
        containerRef={scrollContainerRef}
        disabled={!observeMessagesToMarkAsSeen}
      >
        <Box2
          className={cx(
            classes.threadContainer,
            cordifyClassname('full-height-thread'),
          )}
        >
          <ScrollContainerProvider2
            className={classes.threadScrollContainer}
            onScroll={onScroll}
            ref={scrollContainerRef}
            useScrollAdjuster={initialScrollSet}
          >
            {initialLoadInProgress || loadingDeepLinkedMessage ? (
              <SpinnerCover
                size="3xl"
                containerStyle={Styles.THREAD_CIRCULAR_LOADING}
              />
            ) : (
              <>
                {blocks.map((block, blockIndex) => {
                  const isFirstUnseenBlock =
                    initialFirstUnseenMessageID === block[0].id;

                  const showUnreadIndicator =
                    isFirstUnseenBlock && blockIndex !== 0;

                  return (
                    <div
                      key={block[0].id}
                      ref={
                        isFirstUnseenBlock ? setFirstUnseenBlockElement : null
                      }
                    >
                      {showUnreadIndicator && (
                        <UnreadMessageIndicator2 subscribed={subscribed} />
                      )}
                      <MessageBlock2 messages={block} />
                    </div>
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
            className={classes.composer}
            shouldFocusOnMount={shouldFocusOnMount}
            showBorder={true}
            showExpanded={true}
          />
        </Box2>
      </MessageSeenObserverProvider>
    );
  },
);
