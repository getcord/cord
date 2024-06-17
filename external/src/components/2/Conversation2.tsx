import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { createUseStyles } from 'react-jss';
import { v4 as uuid } from 'uuid';
import { AnimatePresence } from 'framer-motion';
import cx from 'classnames';

import { useCordTranslation } from '@cord-sdk/react';
import { ConversationTopNav2 } from 'external/src/components/2/ConversationTopNav2.tsx';
import { ThreadList2 } from 'external/src/components/2/ThreadList2.tsx';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { Separator2 } from 'external/src/components/ui2/Separator2.tsx';
import type { UUID } from 'common/types/index.ts';
import {
  PageThreadAddedTypeName,
  ThreadFilterablePropertiesMatchTypeName,
  ThreadFilterablePropertiesUnmatchTypeName,
  PageThreadReplyAddedTypeName,
  PageThreadResolvedTypeName,
  PageThreadUnresolvedTypeName,
  PageVisitorsUpdatedTypeName,
  PageThreadDeletedTypename,
} from 'common/types/index.ts';
import { ThreadPage2 } from 'external/src/components/2/ThreadPage2.tsx';
import {
  ThreadsContext2,
  threadFragmentToThreadData,
} from 'external/src/context/threads2/ThreadsContext2.tsx';
import { InboxWrapper } from 'external/src/components/2/InboxWrapper2.tsx';
import { AddCommentButton2 } from 'external/src/components/ui2/AddCommentButton2.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ThreadsProvider2 } from 'external/src/context/threads2/ThreadsProvider2.tsx';
import {
  useClearDeepLinkThreadIDMutation,
  useConversationThreadsQuery,
  useThreadListEventsWithLocationSubscription,
} from 'external/src/graphql/operations.ts';
import { PageContext } from 'external/src/context/page/PageContext.ts';
import { DeepLinkContext } from 'external/src/context/deepLink/DeepLinkContext.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { StartAConversation2 } from 'external/src/components/2/StartAConversation2.tsx';
import type { ComposerAction } from 'external/src/context/composer/ComposerState.ts';
import { EmbedContext } from 'external/src/context/embed/EmbedContext.ts';
import { ThreadsWithWayMarkers } from 'external/src/components/2/ThreadsWithWayMarkers.tsx';
import { WithToggle2 } from 'external/src/components/ui2/WithToggle2.tsx';
import { FullPageModal2 } from 'external/src/components/2/FullPageModal2.tsx';
import { ConversationNuxMessage } from 'external/src/components/2/ConversationNuxMessage.tsx';
import { ResolvedThread2 } from 'external/src/components/2/ResolvedThreads.tsx';
import { useUpdatingRef } from 'external/src/effects/useUpdatingRef.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { extractUsersFromThread2 } from 'external/src/context/users/util.ts';
import { ComponentContext } from 'external/src/context/component/ComponentContext.tsx';
import { useSidebarVisible } from 'external/src/delegate/hooks/useSidebarVisiblePreference.ts';
import { unfinishedMessageWarningText } from 'external/src/common/strings.ts';
import { externalizeID } from 'common/util/externalIDs.ts';
import { DeepLinkProvider } from 'external/src/context/deepLink/DeepLinkProvider.tsx';
import { DisabledScrollContainerProvider } from 'external/src/components/2/ScrollContainer2.tsx';
import type { SidebarWebComponent } from 'sdk/client/core/components/cord-sidebar.tsx';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';

const useStyles = createUseStyles({
  conversationContainer: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    overflow: 'hidden',
  },
  contentHidden: {
    // Help browser by telling it it doesn't need to render the page underneath
    // when full page thread is open. Note: not supported on firefox/safari but
    // doesn't cause any problems
    contentVisibility: 'hidden',
  },
});

type Props = {
  sidebarContainerRef: React.RefObject<HTMLDivElement>;
  onThreadOpen?: (threadID: UUID) => unknown;
  onThreadClose?: (threadID: UUID) => unknown;
};

export function Conversation2(props: Props) {
  // Only split into two components so we can access above context easily
  return (
    <ThreadsProvider2 location="chat">
      <DeepLinkProvider>
        {/* Clicking a Thread in Conversation2 will open it full screen,
            so we don't need a scroll container */}
        <DisabledScrollContainerProvider>
          <Conversation2Component {...props} />
        </DisabledScrollContainerProvider>
      </DeepLinkProvider>
    </ThreadsProvider2>
  );
}

function Conversation2Component({
  sidebarContainerRef,
  onThreadOpen,
  onThreadClose,
}: Props) {
  const { t } = useCordTranslation('thread_list');
  const classes = useStyles();
  const { logEvent } = useLogger();

  const {
    threadIDsWithUndeletedMessages,
    resolvedThreadIDsSet,
    setThreads,
    mergeThread,
    removeThread,
    setResolved,
    reorderThreads,
    getThreadUpdatingRef,
    draftMessageInComposer,
  } = useContextThrowingIfNoProvider(ThreadsContext2);

  const [openThreadID, setOpenThreadID] = useState<UUID | null>(null);
  const previousOpenThreadIDRef = useRef<UUID | null>(null);

  const [initialComposerAction, setInitialComposerAction] =
    useState<ComposerAction | null>(null);
  const [inboxOpen, setInboxOpen] = useState<boolean>(false);

  const pageContext = useContextThrowingIfNoProvider(PageContext);
  const {
    addUsers,
    byInternalID: { requestUsers },
  } = useContextThrowingIfNoProvider(UsersContext);

  const { organization } = useContextThrowingIfNoProvider(OrganizationContext);

  const {
    loading: pageThreadsLoading,
    data: pageThreadsData,
    error: pageThreadsError,
    refetch,
  } = useConversationThreadsQuery({
    skip: !pageContext,
    variables: {
      location: pageContext!.data,
      _externalOrgID: organization?.externalID,
    },
  });

  const { addDeepLinkInfo, deepLinkInfo } =
    useContextThrowingIfNoProvider(DeepLinkContext);
  const [clearDeepLinkThreadID] = useClearDeepLinkThreadIDMutation();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    if (!pageThreadsLoading && !pageThreadsError && pageThreadsData) {
      const threads = pageThreadsData.threadsAtLocation.threads;

      threads.map((thread) =>
        extractUsersFromThread2(thread, addUsers, requestUsers),
      );
      setThreads(threads.map(threadFragmentToThreadData));
      setInitialLoadComplete(true);

      // threadID alone could be defined, or both threadID and messageID
      if (pageThreadsData?.viewer?.deepLinkInfo) {
        addDeepLinkInfo(pageThreadsData.viewer.deepLinkInfo);
        logEvent('deeplink-visit', {
          ...pageThreadsData.viewer.deepLinkInfo,
          deeplinkType: 'server-based',
        });
        // now that we've received a deepLinkThreadID, clear it out (it's only needed on page load)
        void clearDeepLinkThreadID();
      }
    }
  }, [
    addUsers,
    requestUsers,
    pageThreadsLoading,
    pageThreadsData,
    pageThreadsError,
    clearDeepLinkThreadID,
    addDeepLinkInfo,
    logEvent,
    setThreads,
  ]);

  const { data: subscriptionData } =
    useThreadListEventsWithLocationSubscription({
      skip: !pageContext,
      variables: {
        location: pageContext?.data,
        partialMatch: false,
        resolved: undefined,
        filter: undefined,
        _externalOrgID: undefined,
      },
    });

  const threadIDsRef = useUpdatingRef(threadIDsWithUndeletedMessages);
  useEffect(() => {
    if (
      initialLoadComplete &&
      deepLinkInfo &&
      threadIDsRef.current.includes(deepLinkInfo.threadID)
    ) {
      setOpenThreadID(deepLinkInfo.threadID);
    }
  }, [deepLinkInfo, initialLoadComplete, threadIDsRef]);

  useEffect(() => {
    if (subscriptionData) {
      const eventTypeName = subscriptionData.pageEventsWithLocation.__typename;
      switch (eventTypeName) {
        case PageThreadAddedTypeName: {
          if (!subscriptionData.pageEventsWithLocation.thread) {
            return;
          }
          extractUsersFromThread2(
            subscriptionData.pageEventsWithLocation.thread,
            addUsers,
            requestUsers,
          );
          mergeThread(
            threadFragmentToThreadData(
              subscriptionData.pageEventsWithLocation.thread,
            ),
          );
          break;
        }
        case PageVisitorsUpdatedTypeName: {
          // do nothing, this is handled in PageProvider
          break;
        }
        case PageThreadResolvedTypeName:
        case PageThreadUnresolvedTypeName: {
          // these events are not needed because of ThreadEvents subscription
          // in ThreadsContext2. Once Cord1 is gone, we can stop sending these
          // events.
          break;
        }
        case PageThreadDeletedTypename: {
          const threadID = subscriptionData.pageEventsWithLocation.id;
          removeThread(threadID);
          break;
        }
        case PageThreadReplyAddedTypeName:
        case ThreadFilterablePropertiesMatchTypeName:
        case ThreadFilterablePropertiesUnmatchTypeName: {
          break;
        }
        default: {
          const _: never = eventTypeName;
          console.warn(
            'Unhandled page event',
            subscriptionData.pageEventsWithLocation,
          );
          break;
        }
      }
    }
  }, [
    addUsers,
    requestUsers,
    mergeThread,
    refetch,
    subscriptionData,
    setResolved,
    removeThread,
  ]);

  const { resolvedThreadIDs, unresolvedThreadIDs } = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    const resolvedThreadIDs: UUID[] = [];
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    const unresolvedThreadIDs: UUID[] = [];

    threadIDsWithUndeletedMessages.forEach((threadID) => {
      if (resolvedThreadIDsSet.has(threadID)) {
        resolvedThreadIDs.push(threadID);
      } else {
        unresolvedThreadIDs.push(threadID);
      }
    });

    return { resolvedThreadIDs, unresolvedThreadIDs };
  }, [resolvedThreadIDsSet, threadIDsWithUndeletedMessages]);

  const composeNewThread = useCallback((composerAction?: ComposerAction) => {
    setOpenThreadID(uuid());
    if (composerAction) {
      setInitialComposerAction(composerAction);
    }
  }, []);

  const [_, setSidebarVisible] = useSidebarVisible();

  const componentCtx = useContextThrowingIfNoProvider(ComponentContext);
  useEffect(() => {
    if (!componentCtx || componentCtx?.name !== 'cord-sidebar') {
      return;
    }
    const sidebarElement = componentCtx.element as SidebarWebComponent;
    sidebarElement._setExternalFunction('startComposer', () => {
      setSidebarVisible(true);
      composeNewThread();
    });

    return () => {
      sidebarElement._setExternalFunction('startComposer', () => {});
    };
  }, [componentCtx, composeNewThread, setSidebarVisible]);

  const { cancelAnnotation, visible, showConfirmModal } =
    useContextThrowingIfNoProvider(EmbedContext);

  useEffect(() => {
    if (previousOpenThreadIDRef.current === openThreadID) {
      return;
    }

    const previousOpenThreadID = previousOpenThreadIDRef.current;
    const newOpenThreadID = openThreadID;
    previousOpenThreadIDRef.current = newOpenThreadID;

    if (previousOpenThreadID) {
      const thread = getThreadUpdatingRef(previousOpenThreadID).current;
      if (thread) {
        const externalThreadID =
          thread.externalID ?? externalizeID(previousOpenThreadID);
        onThreadClose?.(externalThreadID);
      }
    }

    if (newOpenThreadID) {
      const thread = getThreadUpdatingRef(newOpenThreadID).current;
      if (thread) {
        const externalThreadID =
          thread.externalID ?? externalizeID(newOpenThreadID);
        onThreadOpen?.(externalThreadID);
      }
    }
  }, [openThreadID, onThreadOpen, onThreadClose, getThreadUpdatingRef]);

  const returnToAll = useCallback(() => {
    const cancelComposeNewThread = () => {
      cancelAnnotation();
      setOpenThreadID(null);
      setInitialComposerAction(null);
    };

    // This is basically the same as the useCloseThreadWithWarning hook.  The reason
    // we don't use that hook here is that the extension Sidebar does not have direct
    // access to the Delegate context, and instead uses the showConfirmModal function
    // from the Embed context to speak to the Delegate via a global event (x-frame in
    // the extension).  The sdk sidebar actually could use the hook, but this component
    // is shared by both extension and sdk so needs to work in both.
    if (draftMessageInComposer) {
      showConfirmModal({
        ...unfinishedMessageWarningText,
        onConfirm: () => {
          logEvent('thread-closed', {
            hadDraft: true,
            keptDraft: false,
          });
          cancelComposeNewThread();
        },
        onCancel: () => {
          logEvent('thread-closed', {
            hadDraft: true,
            keptDraft: true,
          });
        },
      });
    } else {
      logEvent('thread-closed', {
        hadDraft: false,
      });
      cancelComposeNewThread();
    }
  }, [draftMessageInComposer, cancelAnnotation, showConfirmModal, logEvent]);

  const openInbox = useCallback(() => {
    setInboxOpen(true);
    logEvent('open-inbox');
  }, [logEvent]);

  const closeInbox = useCallback(() => {
    setInboxOpen(false);
    reorderThreads();
  }, [reorderThreads]);

  // Reorder threads when returning from an open thread page
  const prevOpenThreadIDRef = useRef(openThreadID);
  useLayoutEffect(() => {
    if (!openThreadID && prevOpenThreadIDRef.current) {
      reorderThreads();
    }
    prevOpenThreadIDRef.current = openThreadID;
  }, [openThreadID, reorderThreads]);

  // Reorder threads when re-opening sidebar
  const prevVisibleRef = useRef(visible);
  useLayoutEffect(() => {
    if (visible && !prevVisibleRef.current) {
      reorderThreads();
    }
    prevVisibleRef.current = visible;
  }, [reorderThreads, visible]);

  return (
    <>
      <ConversationTopNav2 openInbox={openInbox} />
      <Separator2 marginVertical="none" />
      <Box2
        className={cx(classes.conversationContainer, {
          [classes.contentHidden]: inboxOpen || openThreadID,
        })}
        data-cy="cord-conversation-screen"
      >
        <ThreadList2 showLoadingSpinner={!initialLoadComplete}>
          {unresolvedThreadIDs.length === 0 ? (
            <StartAConversation2
              composeNewThread={composeNewThread}
              setOpenThreadID={setOpenThreadID}
            />
          ) : (
            <>
              <ConversationNuxMessage />
              <ThreadsWithWayMarkers
                onThreadClick={(threadID) => {
                  setOpenThreadID(threadID);
                  logEvent('open-thread-in-full-page', { resolved: false });
                }}
                threadIDs={unresolvedThreadIDs}
              />
            </>
          )}
          {resolvedThreadIDs.length > 0 && (
            <WithToggle2
              expandedLabel={t('hide_resolved_threads_action')}
              collapsedLabel={t('show_resolved_threads_action')}
            >
              {resolvedThreadIDs.map((threadID, index) => (
                <ResolvedThread2
                  key={threadID}
                  threadID={threadID}
                  onClickThread={() => {
                    setOpenThreadID(threadID);
                    logEvent('open-thread-in-full-page', { resolved: true });
                  }}
                  scrollIntoViewOnMount={index === 0}
                />
              ))}
            </WithToggle2>
          )}
        </ThreadList2>
      </Box2>
      {sidebarContainerRef.current &&
        openThreadID &&
        createPortal(
          <ThreadPage2
            threadID={openThreadID}
            onClose={returnToAll}
            initialComposerAction={initialComposerAction ?? undefined}
            mode="fullHeight"
          />,
          sidebarContainerRef.current,
        )}
      {!pageThreadsLoading && unresolvedThreadIDs.length > 0 && (
        <AddCommentButton2 onClick={composeNewThread} />
      )}
      <AnimatePresence>
        {inboxOpen && (
          <FullPageModal2
            sidebarContainerRef={sidebarContainerRef}
            onClose={closeInbox}
          >
            <InboxWrapper closeInbox={closeInbox} showPlaceholder={true} />
          </FullPageModal2>
        )}
      </AnimatePresence>
    </>
  );
}
