import * as React from 'react';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import cx from 'classnames';

import { useThreadData } from 'external/src/components/2/hooks/useThreadData.ts';
import { CollapsedThreadComponent } from 'external/src/components/ui3/thread/CollapsedThread.tsx';
import { InlineThreadComponent } from 'external/src/components/ui3/thread/InlineThread.tsx';
import { FullHeightThreadComponent2 } from 'external/src/components/2/thread2/FullHeightThread.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ThreadsContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { useThreadScrollAdjuster2 } from 'external/src/components/2/hooks/useThreadScrollAdjuster2.ts';
import { useExtraClassnames } from '@cord-sdk/react/hooks/useExtraClassnames.ts';
import {
  ComposerProvider,
  DisabledComposerProvider,
} from 'external/src/context/composer/ComposerProvider.tsx';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { Thread2Provider } from 'external/src/context/thread2/Thread2Provider.tsx';
import { DeepLinkProvider } from 'external/src/context/deepLink/DeepLinkProvider.tsx';

import * as classes from 'external/src/components/ui3/thread/ThreadWithProvider.css.ts';
import type { Thread2Props } from 'external/src/components/2/thread2/index.tsx';
import { EmptyThread } from 'external/src/components/ui3/thread/EmptyThread.tsx';
import { MODIFIERS } from 'common/ui/modifiers.ts';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';

// How many messages to show when expanding to an inline thread
const INLINE_THREAD_INITIAL_MIN_MESSAGES = 5;

export const ThreadWithProvider = React.memo(function Thread2(
  props: Thread2Props,
) {
  return (
    <Thread2Provider
      threadID={props.threadID}
      externalThreadID={props.externalThreadID}
      threadMode={props.mode}
      initialSlackShareChannel={null}
    >
      <DeepLinkProvider>
        <ThreadComponent {...props} />
      </DeepLinkProvider>
    </Thread2Provider>
  );
});

const ThreadComponent = React.memo(function ThreadComponent({
  threadID,
  externalThreadID,
  threadMetadata,
  mode,
  threadHeader,
  shouldFocusOnMount,
  allowReplyFromCollapsed = true,
  observeMessagesToMarkAsSeen = true,
  showPlaceholder = false,
  composerExpanded = false,
  composerDisabled = false,
  forwardRef,
  showMessageOptions,
  showThreadOptions,
}: Thread2Props) {
  const thread = useThreadData();
  const { logError } = useLogger();
  const dummyRef = useRef<HTMLDivElement>(null);
  const threadContainerRef = forwardRef ?? dummyRef;
  const { organization } = useContextThrowingIfNoProvider(OrganizationContext);

  const [loadingInitialMessages, setLoadingInitialMessages] = useState(false);

  const { loadOlderMessages, loadMessagesFrom } =
    useContextThrowingIfNoProvider(ThreadsContext2);

  const { onClickThread } = useThreadScrollAdjuster2({
    threadContainerRef,
    mode,
  });

  const prevModeRef = useRef(mode);
  useLayoutEffect(() => {
    if (prevModeRef.current === 'collapsed' && mode === 'inline') {
      if (!thread?.olderMessagesCount) {
        return;
      }
      const onLoad = () => setLoadingInitialMessages(false);
      // If there are unseen messages that we haven't got yet, load those
      // Otherwise, load older messages to arive at min message count set above
      if (
        thread.firstUnseenMessageID &&
        !thread.messages.find(
          (message) => message.id === thread.firstUnseenMessageID,
        )
      ) {
        setLoadingInitialMessages(true);
        void loadMessagesFrom(threadID, thread.firstUnseenMessageID).then(
          onLoad,
        );
      } else {
        if (thread.messages.length < INLINE_THREAD_INITIAL_MIN_MESSAGES) {
          setLoadingInitialMessages(true);
          void loadOlderMessages(
            threadID,
            INLINE_THREAD_INITIAL_MIN_MESSAGES - thread.messages.length,
          ).then(onLoad);
        }
      }
    }
    prevModeRef.current = mode;
  }, [loadMessagesFrom, loadOlderMessages, mode, thread, threadID, logError]);

  const threadComponent = useMemo(() => {
    if (!thread || thread.messages.length === 0) {
      switch (mode) {
        case 'inline':
        case 'fullHeight':
          return (
            <EmptyThread
              composerExpanded={composerExpanded}
              composerDisabled={composerDisabled}
              showPlaceholder={showPlaceholder}
              shouldFocusOnMount={shouldFocusOnMount}
              threadHeader={threadHeader}
              threadMetadata={threadMetadata}
            />
          );
        default:
          return null;
      }
    }
    switch (mode) {
      case 'collapsed':
        return (
          <CollapsedThreadComponent
            thread={thread}
            threadHeader={threadHeader}
            allowReply={allowReplyFromCollapsed}
            showMessageOptions={showMessageOptions ?? true}
            showThreadOptions={showThreadOptions ?? false}
          />
        );
      case 'inline':
        return (
          <InlineThreadComponent
            thread={thread}
            threadMetadata={threadMetadata}
            loadingInitialMessages={loadingInitialMessages}
            threadHeader={threadHeader}
            shouldFocusOnMount={shouldFocusOnMount}
            observeMessagesToMarkAsSeen={observeMessagesToMarkAsSeen}
            showPlaceholder={showPlaceholder}
            composerExpanded={composerExpanded}
            composerDisabled={composerDisabled}
          />
        );
      case 'fullHeight':
        return (
          <FullHeightThreadComponent2
            thread={thread}
            shouldFocusOnMount={shouldFocusOnMount}
            observeMessagesToMarkAsSeen={observeMessagesToMarkAsSeen}
          />
        );
      default:
        return null;
    }
  }, [
    mode,
    thread,
    threadHeader,
    allowReplyFromCollapsed,
    showMessageOptions,
    showThreadOptions,
    loadingInitialMessages,
    shouldFocusOnMount,
    observeMessagesToMarkAsSeen,
    showPlaceholder,
    composerExpanded,
    composerDisabled,
    threadMetadata,
  ]);

  const extraClassnames = useExtraClassnames(thread?.extraClassnames ?? null);
  const threadWithProviders = useMemo(() => {
    // Collapsed threads don't need a ComposerProvider because they don't have
    // a composer (you can't send a message from them)
    if (mode === 'collapsed') {
      return (
        <DisabledComposerProvider>{threadComponent}</DisabledComposerProvider>
      );
    } else {
      return <ComposerProvider>{threadComponent}</ComposerProvider>;
    }
  }, [mode, threadComponent]);

  return (
    <div
      ref={threadContainerRef}
      onClick={onClickThread}
      className={cx(classes.container, extraClassnames, {
        [MODIFIERS.noReplies]: (thread?.replyCount ?? 0) === 0,
        [MODIFIERS.subscribed]: thread?.subscribed,
      })}
      data-cy="cord-thread"
      data-cord-thread-id={thread?.externalID ?? externalThreadID}
      data-cord-group-id={thread?.externalOrgID ?? organization?.externalID}
    >
      {threadWithProviders}
    </div>
  );
});

export const newThreadWithProviderConfig = {
  NewComp: ThreadWithProvider,
  configKey: 'threadWithProvider',
} as const;
