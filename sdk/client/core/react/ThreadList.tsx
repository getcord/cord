import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  createContext,
  useRef,
} from 'react';
import { createUseStyles } from 'react-jss';
import jsonStableStringify from 'fast-json-stable-stringify';
import { useCordTranslation } from '@cord-sdk/react';
import type { ThreadListReactComponentProps } from '@cord-sdk/react';
import type { ThreadListFilter, UUID } from 'common/types/index.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import {
  ThreadsContext2,
  ThreadsDataContext2,
} from 'external/src/context/threads2/ThreadsContext2.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { PageContext } from 'external/src/context/page/PageContext.ts';
import { ComponentPageContextProvider } from 'sdk/client/core/react/ComponentPageContextProvider.tsx';
import { Thread2 } from 'external/src/components/2/thread2/index.tsx';
import { CSSVariableOverrideContext } from 'external/src/context/cssVariableOverride/CSSVariableOverrideContext.tsx';
import { ThreadCSSOverrides } from 'sdk/client/core/css/overrides.ts';
import { externalizeID } from 'common/util/externalIDs.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { WithToggle2 } from 'external/src/components/ui2/WithToggle2.tsx';
import { ResolvedThread2 } from 'external/src/components/2/ResolvedThreads.tsx';
import { doNothing } from 'external/src/lib/util.ts';
import { AnnotationSDKContext } from 'external/src/context/annotations/AnnotationSDKContext.ts';
import { DisabledAnnotationsOnPageProvider } from 'external/src/context/annotationsOnPage/AnnotationsOnPageProvider.tsx';
import { EmptyStateWithIcon } from 'external/src/components/2/EmptyStateWithIcon.tsx';
import { GlobalElementProvider } from 'external/src/context/globalElement/GlobalElementProvider.tsx';
import { ScrollContainerProvider2 } from 'external/src/components/2/ScrollContainer2.tsx';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';
import type { AnnotationPillDisplayContextProps } from 'external/src/context/annotations/AnnotationPillDisplayContext.tsx';
import { AnnotationPillDisplayContext } from 'external/src/context/annotations/AnnotationPillDisplayContext.tsx';
import { AnnotationsConfigProvider } from 'external/src/context/annotations/AnnotationConfigContext.tsx';
import { useDispatchEventOnce } from 'external/src/effects/useDispatchEventOnce.ts';
import { getThreadSummary } from 'common/util/convertToExternal/thread.ts';
import { SpinnerCover } from 'external/src/components/SpinnerCover.tsx';
import { withNewCSSComponentMaybe } from 'external/src/components/ui3/withNewComponent.tsx';
import {
  newThreadListConfig,
  useCallThreadResolvedCallbacks,
} from 'external/src/components/ui3/ThreadListImpl.tsx';
import { useGetThreadIDsOnPage } from 'sdk/client/core/react/useGetThreadIDsOnPage.ts';
import { OrgOverrideProvider } from 'external/src/context/organization/OrganizationContext.tsx';
import { PagePresenceAndVisitorsShim } from 'sdk/client/core/react/PagePresenceAndVisitorsShim.tsx';

export type ThreadListContextProps = {
  onThreadClick: ThreadListReactComponentProps['onThreadClick'];
  onThreadResolve: ThreadListReactComponentProps['onThreadResolve'];
  onThreadReopen: ThreadListReactComponentProps['onThreadReopen'];
  highlightOpenFloatingThread: ThreadListReactComponentProps['highlightOpenFloatingThread'];
  highlightThreadExternalID: ThreadListReactComponentProps['highlightThreadId'];
};

export const ThreadListContext = createContext<
  ThreadListContextProps | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);

const DO_NOT_EXPORT_defaultThreadList = {
  onThreadClick: () => {},
  onThreadResolve: () => {},
  onThreadReopen: () => {},
  highlightOpenFloatingThread: true,
  highlightThreadExternalID: undefined,
};
export function DisabledThreadListContext({
  children,
}: React.PropsWithChildren<unknown>) {
  return (
    <ThreadListContext.Provider value={DO_NOT_EXPORT_defaultThreadList}>
      {children}
    </ThreadListContext.Provider>
  );
}

function ThreadList({
  location,
  filter,
  partialMatch = false,
  onThreadClick,
  onThreadMouseEnter,
  onThreadMouseLeave,
  onThreadResolve,
  onThreadReopen,
  showScreenshotPreviewInMessage = true,
  highlightOpenFloatingThread = true,
  showPlaceholder = true,
  highlightThreadId, // the external threadId
}: ThreadListReactComponentProps) {
  const locationKey = useMemo(() => jsonStableStringify(location), [location]);
  return (
    <OrgOverrideProvider externalOrgID={filter?.groupID}>
      <ComponentPageContextProvider location={location}>
        <DisabledAnnotationsOnPageProvider>
          <AnnotationsConfigProvider showPinsOnPage={false}>
            <GlobalElementProvider>
              <PagePresenceAndVisitorsShim>
                <ThreadListImpl
                  key={locationKey}
                  filter={filter}
                  partialMatch={partialMatch}
                  onThreadClick={onThreadClick}
                  onThreadMouseEnter={onThreadMouseEnter}
                  onThreadMouseLeave={onThreadMouseLeave}
                  onThreadResolve={onThreadResolve}
                  onThreadReopen={onThreadReopen}
                  showScreenshotPreviewInMessage={
                    showScreenshotPreviewInMessage
                  }
                  highlightOpenFloatingThread={highlightOpenFloatingThread}
                  showPlaceholder={showPlaceholder}
                  highlightThreadId={highlightThreadId}
                />
              </PagePresenceAndVisitorsShim>
            </GlobalElementProvider>
          </AnnotationsConfigProvider>
        </DisabledAnnotationsOnPageProvider>
      </ComponentPageContextProvider>
    </OrgOverrideProvider>
  );
}

const useStyles = createUseStyles({
  '@global': {
    ':host': {
      overflow: 'auto',
      height: cssVar('thread-list-height'),
      display: 'block',
    },
    ':host > *': {
      position: 'relative',
      overflow: 'hidden',
      height: '100%',
    },
  },
  threadContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: cssVar('thread-list-gap'),
    padding: cssVar('thread-list-padding'),
    height: '100%',
    '&:empty': {
      // no padding when thread container is empty to avoid rendering a small
      // empty rectangle
      padding: 0,
    },
  },
});

export type ThreadListImplProps = {
  showScreenshotPreviewInMessage: ThreadListReactComponentProps['showScreenshotPreviewInMessage'];
  highlightOpenFloatingThread: ThreadListReactComponentProps['highlightOpenFloatingThread'];
  highlightThreadId: ThreadListReactComponentProps['highlightThreadId'];
  filter?: Omit<ThreadListFilter, 'resolvedStatus'>;
  showPlaceholder?: boolean;
  partialMatch?: boolean;
  onThreadClick?: ThreadListReactComponentProps['onThreadClick'];
  onThreadMouseEnter?: ThreadListReactComponentProps['onThreadMouseEnter'];
  onThreadMouseLeave?: ThreadListReactComponentProps['onThreadMouseLeave'];
  onThreadResolve?: ThreadListReactComponentProps['onThreadResolve'];
  onThreadReopen?: ThreadListReactComponentProps['onThreadReopen'];
};

const ThreadListImpl = withNewCSSComponentMaybe(
  newThreadListConfig,
  function ThreadListImpl(props: ThreadListImplProps) {
    const { t } = useCordTranslation('thread_list');
    const classes = useStyles();
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
      if (
        unresolvedThreadIDs === undefined ||
        resolvedThreadIDs === undefined
      ) {
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
            <ScrollContainerProvider2 className={classes.threadContainer}>
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
            </ScrollContainerProvider2>
          </ThreadListContext.Provider>
        </AnnotationPillDisplayContext.Provider>
      </CSSVariableOverrideContext.Provider>
    );
  },
);

type WrappedThreadProps = {
  threadID: UUID;
  onThreadClick?: ThreadListImplProps['onThreadClick'];
  onThreadMouseEnter?: ThreadListImplProps['onThreadMouseEnter'];
  onThreadMouseLeave?: ThreadListImplProps['onThreadMouseLeave'];
};

const useWrappedThreadStyles = createUseStyles({
  threadWrapper: {
    width: '100%',
    cursor: 'pointer',
  },
});
function WrappedThread({
  threadID,
  onThreadClick,
  onThreadMouseEnter,
  onThreadMouseLeave,
}: WrappedThreadProps) {
  const classes = useWrappedThreadStyles();
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
      className={classes.threadWrapper}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseOut={handleMouseOut}
      ref={containerRef}
    >
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
          showThreadOptions={true}
        />
      )}
    </div>
  );
}

// TODO: make this automatic
export default memo(ThreadList);
