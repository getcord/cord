import * as React from 'react';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import cx from 'classnames';
import { createUseStyles } from 'react-jss';

import type { UUID, ThreadMode, EntityMetadata } from 'common/types/index.ts';
import { useThreadData } from 'external/src/components/2/hooks/useThreadData.ts';
import { CollapsedThreadComponent2 } from 'external/src/components/2/thread2/CollapsedThread.tsx';
import { InlineThreadComponent2 } from 'external/src/components/2/thread2/InlineThread.tsx';
import { FullHeightThreadComponent2 } from 'external/src/components/2/thread2/FullHeightThread.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ThreadsContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { useThreadScrollAdjuster2 } from 'external/src/components/2/hooks/useThreadScrollAdjuster2.ts';
import {
  ComposerProvider,
  DisabledComposerProvider,
} from 'external/src/context/composer/ComposerProvider.tsx';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { Thread2Provider } from 'external/src/context/thread2/Thread2Provider.tsx';
import { DeepLinkProvider } from 'external/src/context/deepLink/DeepLinkProvider.tsx';
import { withNewCSSComponentMaybe } from 'external/src/components/ui3/withNewComponent.tsx';
import { newThreadWithProviderConfig } from 'external/src/components/ui3/thread/ThreadWithProvider.tsx';
import { EmptyThread } from 'external/src/components/ui3/thread/EmptyThread.tsx';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';

// How many messages to show when expanding to an inline thread
const INLINE_THREAD_INITIAL_MIN_MESSAGES = 5;

const useStyles = createUseStyles({
  fullHeight: {
    height: '100%',
  },
  container: {
    height: '100%',
    maxHeight: 'inherit',
  },
});

export type Thread2Props = {
  threadID: UUID;
  // When the thread for `threadID` has not yet been loaded or doesn't exist
  // yet, we need to have `externalThreadID` set to have everything function
  // properly.  It's optional if `threadID`'s thread is loaded.
  externalThreadID?: string;
  threadHeader?: JSX.Element;
  threadMetadata?: EntityMetadata;
  mode: ThreadMode;
  shouldFocusOnMount?: boolean;
  // only used if mode === "collapsed"
  allowReplyFromCollapsed?: boolean;
  observeMessagesToMarkAsSeen?: boolean;
  showPlaceholder?: boolean; // Can only be used with inline thread currently
  composerExpanded?: boolean; // Can only be used with inline thread currently
  composerDisabled?: boolean; // Can only be used with inline thread currently (since that's the only one that <cord-thread> can render that has a composer)
  forwardRef?: React.RefObject<HTMLDivElement>;
  showMessageOptions?: boolean; // Can only be used with collapsed thread
  showThreadOptions?: boolean; // Can only be used with collapsed thread
};

export const Thread2 = React.memo(function Thread2(props: Thread2Props) {
  return (
    <Thread2Provider
      threadID={props.threadID}
      externalThreadID={props.externalThreadID}
      threadMode={props.mode}
      initialSlackShareChannel={null}
    >
      <DeepLinkProvider>
        <Thread2Component {...props} />
      </DeepLinkProvider>
    </Thread2Provider>
  );
});

const Thread2Component = withNewCSSComponentMaybe(
  newThreadWithProviderConfig,
  React.memo(function Thread2Component({
    threadID,
    externalThreadID,
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
    threadMetadata,
  }: Thread2Props) {
    const classes = useStyles();

    const thread = useThreadData();
    const { organization } =
      useContextThrowingIfNoProvider(OrganizationContext);
    const { logError } = useLogger();
    const dummyRef = useRef<HTMLDivElement>(null);
    const threadContainerRef = forwardRef ?? dummyRef;

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
                showPlaceholder={showPlaceholder}
                threadHeader={threadHeader}
                shouldFocusOnMount={shouldFocusOnMount}
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
            <CollapsedThreadComponent2
              thread={thread}
              threadHeader={threadHeader}
              allowReply={allowReplyFromCollapsed}
              showMessageOptions={showMessageOptions ?? true}
              showThreadOptions={showThreadOptions ?? false}
            />
          );
        case 'inline':
          return (
            <InlineThreadComponent2
              thread={thread}
              loadingInitialMessages={loadingInitialMessages}
              threadHeader={threadHeader}
              shouldFocusOnMount={shouldFocusOnMount}
              observeMessagesToMarkAsSeen={observeMessagesToMarkAsSeen}
              showPlaceholder={showPlaceholder}
              composerExpanded={composerExpanded}
              composerDisabled={composerDisabled}
              threadMetadata={threadMetadata}
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

    const threadWithProviders = useMemo(() => {
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
        className={cx(classes.container, {
          [classes.fullHeight]: mode === 'fullHeight',
        })}
        data-cy="cord-thread"
        data-cord-thread-id={thread?.externalID ?? externalThreadID}
        data-cord-group-id={thread?.externalOrgID ?? organization?.externalID}
      >
        {threadWithProviders}
      </div>
    );
  }),
);
