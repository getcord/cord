import { useMemo, useEffect, useCallback, useRef } from 'react';
import type { ThreadListReactComponentProps } from '@cord-sdk/react';
import { useCordTranslation } from '@cord-sdk/react';
import { EmptyStateWithIcon } from 'external/src/components/2/EmptyStateWithIcon.tsx';
import { ScrollContainerProvider } from 'external/src/components/ui3/ScrollContainer.tsx';
import { SpinnerCover } from 'external/src/components/SpinnerCover.tsx';
import { WithToggle2 } from 'external/src/components/ui2/WithToggle2.tsx';
import { AnnotationPillDisplayContext } from 'external/src/context/annotations/AnnotationPillDisplayContext.tsx';
import type { AnnotationPillDisplayContextProps } from 'external/src/context/annotations/AnnotationPillDisplayContext.tsx';
import { CSSVariableOverrideContext } from 'external/src/context/cssVariableOverride/CSSVariableOverrideContext.tsx';
import { PageContext } from 'external/src/context/page/PageContext.ts';
import {
  ThreadsContext2,
  ThreadsDataContext2,
} from 'external/src/context/threads2/ThreadsContext2.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { useDispatchEventOnce } from 'external/src/effects/useDispatchEventOnce.ts';
import { ThreadCSSOverrides } from 'sdk/client/core/css/overrides.ts';
import type {
  ThreadListContextProps,
  ThreadListImplProps,
} from 'sdk/client/core/react/ThreadList.tsx';
import { ThreadListContext } from 'sdk/client/core/react/ThreadList.tsx';
import { clickableThread } from 'external/src/components/ui3/ThreadList.css.ts';
import { AnnotationSDKContext } from 'external/src/context/annotations/AnnotationSDKContext.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { externalizeID } from 'common/util/externalIDs.ts';
import { getThreadSummary } from 'common/util/convertToExternal/thread.ts';
import { Thread2 } from 'external/src/components/2/thread2/index.tsx';
import { doNothing } from 'external/src/lib/util.ts';
import { ResolvedThread2 } from 'external/src/components/2/ResolvedThreads.tsx';
import type { UUID } from 'common/types/index.ts';
import { useGetThreadIDsOnPage } from 'sdk/client/core/react/useGetThreadIDsOnPage.ts';

/**
 * This hook implements the historical behavior of ThreadList to call
 * onThreadResolve and onThreadReopen whenever a thread becomes resolved,
 * whether or not that was done by the current user within this component.
 * Current components should only call callbacks for user actions, rather than
 * any change in any thread (people should use the API for that).
 */
export function useCallThreadResolvedCallbacks({
  onThreadResolve,
  onThreadReopen,
  resolvedThreadIDs,
  unresolvedThreadIDs,
}: {
  resolvedThreadIDs: UUID[];
  unresolvedThreadIDs: UUID[];
  onThreadResolve?: ThreadListReactComponentProps['onThreadResolve'];
  onThreadReopen?: ThreadListReactComponentProps['onThreadReopen'];
}) {
  const {
    byInternalID: { userByID },
  } = useContextThrowingIfNoProvider(UsersContext);
  const threadDataContext = useContextThrowingIfNoProvider(ThreadsDataContext2);

  const previousResolvedThreadIDs = useRef(new Set<string>());
  const previousUnresolvedThreadIDs = useRef(new Set<string>());
  useEffect(() => {
    const newlyResolved = resolvedThreadIDs.filter((id) =>
      previousUnresolvedThreadIDs.current.has(id),
    );
    const newlyReopened = unresolvedThreadIDs.filter((id) =>
      previousResolvedThreadIDs.current.has(id),
    );

    previousResolvedThreadIDs.current = new Set(resolvedThreadIDs);
    previousUnresolvedThreadIDs.current = new Set(unresolvedThreadIDs);

    for (const resolvedThreadID of newlyResolved) {
      const threadData = threadDataContext[resolvedThreadID];
      if (threadData) {
        onThreadResolve?.({
          threadID: threadData.externalID,
          thread: getThreadSummary(threadData, userByID),
        });
      }
    }
    for (const reopenedThreadID of newlyReopened) {
      const threadData = threadDataContext[reopenedThreadID];
      if (threadData) {
        onThreadReopen?.({
          threadID: threadData.externalID,
          thread: getThreadSummary(threadData, userByID),
        });
      }
    }
  }, [
    unresolvedThreadIDs,
    resolvedThreadIDs,
    onThreadResolve,
    onThreadReopen,
    threadDataContext,
    userByID,
  ]);
}

function ThreadListImpl(props: ThreadListImplProps) {
  const { t } = useCordTranslation('thread_list');
  const pageContext = useContextThrowingIfNoProvider(PageContext);

  const { threadIDs } = useGetThreadIDsOnPage({
    filter: {
      ...props.filter,
      location: props.filter?.location ?? pageContext?.data,
      // We want ThreadList to always show both resolved
      // and unresolved threads.
      resolvedStatus: 'any',
    },
    partialMatch: !!props.partialMatch,
    sort: {
      sortBy: 'most_recent_message_timestamp',
      sortDirection: 'descending',
    },
  });
  const { resolvedThreadIDsSet } =
    useContextThrowingIfNoProvider(ThreadsContext2);
  const [unresolvedThreadIDs, resolvedThreadIDs] = useMemo(() => {
    if (threadIDs === undefined) {
      return [undefined, undefined];
    }
    return [
      threadIDs.filter((id) => !resolvedThreadIDsSet.has(id)),
      threadIDs.filter((id) => resolvedThreadIDsSet.has(id)),
    ];
  }, [threadIDs, resolvedThreadIDsSet]);

  useCallThreadResolvedCallbacks({
    onThreadResolve: props.onThreadResolve,
    onThreadReopen: props.onThreadReopen,
    resolvedThreadIDs: resolvedThreadIDs ?? [],
    unresolvedThreadIDs: unresolvedThreadIDs ?? [],
  });

  const ctx: ThreadListContextProps = useMemo(
    () => ({
      onThreadClick: props.onThreadClick,
      onThreadResolve: props.onThreadResolve,
      onThreadReopen: props.onThreadReopen,
      highlightOpenFloatingThread: props.highlightOpenFloatingThread,
      highlightThreadExternalID: props.highlightThreadId,
    }),
    [
      props.onThreadClick,
      props.onThreadResolve,
      props.onThreadReopen,
      props.highlightOpenFloatingThread,
      props.highlightThreadId,
    ],
  );

  const annotationPillDisplayContext: AnnotationPillDisplayContextProps =
    useMemo(
      () => ({ hidden: !props.showScreenshotPreviewInMessage }),
      [props.showScreenshotPreviewInMessage],
    );

  const dispatchLoadingEvent = useDispatchEventOnce('loading');
  const dispatchRenderEvent = useDispatchEventOnce('render');
  useEffect(() => {
    if (unresolvedThreadIDs === undefined || resolvedThreadIDs === undefined) {
      dispatchLoadingEvent();
    } else {
      dispatchRenderEvent();
    }
  }, [
    dispatchLoadingEvent,
    dispatchRenderEvent,
    resolvedThreadIDs,
    unresolvedThreadIDs,
  ]);

  if (unresolvedThreadIDs === undefined || resolvedThreadIDs === undefined) {
    // We show a loading spinner by default but also pass the 'loading'
    // event to customers so they can render the loading state they want.
    return <SpinnerCover size="3xl" />;
  }

  return (
    <CSSVariableOverrideContext.Provider value={ThreadCSSOverrides}>
      <AnnotationPillDisplayContext.Provider
        value={annotationPillDisplayContext}
      >
        <ThreadListContext.Provider value={ctx}>
          <ScrollContainerProvider>
            {props.showPlaceholder && unresolvedThreadIDs.length === 0 && (
              <EmptyStateWithIcon
                title={t('placeholder_title')}
                subtext={t('placeholder_body')}
                iconName="Chats"
              />
            )}
            {unresolvedThreadIDs.map((threadID) => (
              <WrappedThread
                key={threadID}
                threadID={threadID}
                onThreadClick={props.onThreadClick}
                onThreadMouseEnter={props.onThreadMouseEnter}
                onThreadMouseLeave={props.onThreadMouseLeave}
              />
            ))}
            {resolvedThreadIDs.length > 0 && (
              <WithToggle2
                expandedLabel={t('hide_resolved_threads_action')}
                collapsedLabel={t('show_resolved_threads_action')}
              >
                {resolvedThreadIDs.map((threadID) => (
                  <WrappedThread
                    key={threadID}
                    threadID={threadID}
                    onThreadClick={props.onThreadClick}
                    onThreadMouseEnter={props.onThreadMouseEnter}
                    onThreadMouseLeave={props.onThreadMouseLeave}
                  />
                ))}
              </WithToggle2>
            )}
          </ScrollContainerProvider>
        </ThreadListContext.Provider>
      </AnnotationPillDisplayContext.Provider>
    </CSSVariableOverrideContext.Provider>
  );
}

type WrappedThreadProps = {
  threadID: UUID;
  onThreadClick?: ThreadListImplProps['onThreadClick'];
  onThreadMouseEnter?: ThreadListImplProps['onThreadMouseEnter'];
  onThreadMouseLeave?: ThreadListImplProps['onThreadMouseLeave'];
};

function WrappedThread({
  threadID,
  onThreadClick,
  onThreadMouseEnter,
  onThreadMouseLeave,
}: WrappedThreadProps) {
  const thread = useContextThrowingIfNoProvider(ThreadsDataContext2)[threadID];
  const { onAnnotationClick } =
    useContextThrowingIfNoProvider(AnnotationSDKContext);
  const {
    byInternalID: { userByID },
  } = useContextThrowingIfNoProvider(UsersContext);

  const threadIsLoaded = Boolean(thread);
  const externalThreadID = thread?.externalID ?? externalizeID(threadID);

  const onClick = useCallback(() => {
    if (!threadIsLoaded) {
      // we don't have the thread yet
      return;
    }

    if (
      // Only attempt to run onAnnotationClick if the first message contains an
      // annotation that also contains a custom location.
      // The annotations API uses the data-cord-annotation-location attribute to
      // create custom locations for annotations.
      // When the API functions such as the onAnnotationClick handler is called, the location
      // is used to determine if the function is executed.
      // Without a custom location, the annotation location will never match for the onAnnotationClick to be triggered.
      thread.messages[0]?.attachments[0]?.__typename ===
        'MessageAnnotationAttachment' &&
      thread.messages[0].attachments[0].customLocation
    ) {
      const { id, customLocation } = thread.messages[0].attachments[0];
      onAnnotationClick({
        id,
        location: customLocation,
        threadID: thread.externalID ?? externalizeID(threadID),
      });
    }

    onThreadClick?.(externalThreadID, getThreadSummary(thread, userByID));
  }, [
    externalThreadID,
    onAnnotationClick,
    onThreadClick,
    thread,
    threadID,
    threadIsLoaded,
    userByID,
  ]);

  const handleMouseEnter = useCallback(() => {
    onThreadMouseEnter?.(externalThreadID, {
      thread: getThreadSummary(thread, userByID),
    });
  }, [externalThreadID, onThreadMouseEnter, thread, userByID]);
  // We can't use `mouseleave` because it's not triggered when DOM changes (only
  // when mouse moves). This is a known Chromium bug https://bugs.chromium.org/p/chromium/issues/detail?id=276329.
  // We use `mouseout`, but still expose as `mouseleave` as that's how it behaves: it's only triggered when leaving
  // the Thread DOM element. This event is fired in BoxWithPopper2.
  const handleMouseOut = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | CustomEvent) => {
      const isCustomEventWeUseToFixChromiumBug = e.isTrusted === false;
      if (isCustomEventWeUseToFixChromiumBug) {
        const { clientX, clientY } = e.detail;
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (!containerRect) {
          return;
        }

        const isClickInsideThread =
          containerRect.left <= clientX &&
          clientX <= containerRect.right &&
          containerRect.top <= clientY &&
          clientY <= containerRect.bottom;
        if (!isClickInsideThread) {
          onThreadMouseLeave?.(externalThreadID, {
            thread: getThreadSummary(thread, userByID),
          });
        }
      } else {
        const isEventWithinThread =
          'relatedTarget' in e &&
          e.relatedTarget instanceof Element &&
          containerRef.current?.contains(e.relatedTarget);
        if (!isEventWithinThread) {
          onThreadMouseLeave?.(externalThreadID, {
            thread: getThreadSummary(thread, userByID),
          });
        }
      }
    },
    [externalThreadID, onThreadMouseLeave, thread, userByID],
  );

  const containerRef = useRef<HTMLDivElement>(null);

  if (!thread || !thread.messages.length) {
    // empty collapsed thread shouldn't render anything
    return null;
  }

  return (
    <div
      className={clickableThread}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseOut={handleMouseOut}
      ref={containerRef}
    >
      {/* It would be nice to remove this wrapper div, but it's not straight-forward.. */}
      {thread.resolved ? (
        <ResolvedThread2
          key={threadID}
          threadID={threadID}
          onClickThread={doNothing}
        />
      ) : (
        <Thread2
          threadID={threadID}
          externalThreadID={thread.externalID}
          mode={'collapsed'}
          allowReplyFromCollapsed={false}
          observeMessagesToMarkAsSeen={false}
          showMessageOptions={false}
          showThreadOptions
        />
      )}
    </div>
  );
}

export const newThreadListConfig = {
  NewComp: ThreadListImpl,
  configKey: 'threadList',
} as const;
