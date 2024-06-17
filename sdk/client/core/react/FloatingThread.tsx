import { useEffect, useMemo } from 'react';
import { Thread2 } from 'external/src/components/2/thread2/index.tsx';
import {
  ThreadsContext2,
  ThreadsDataContext2,
  threadFragmentToThreadData,
} from 'external/src/context/threads2/ThreadsContext2.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ThreadHeader } from 'sdk/client/core/react/ThreadHeader.tsx';
import { THREAD_STYLE } from 'sdk/client/core/react/Thread.tsx';
import { useLazyThread2Query } from 'external/src/graphql/operations.ts';
import {
  cssVar,
  cssVarWithCustomFallback,
  CSS_VAR_CUSTOM_FALLBACKS,
} from 'common/ui/cssVariables.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { extractUsersFromThread2 } from 'external/src/context/users/util.ts';
import { GlobalElementProvider } from 'external/src/context/globalElement/GlobalElementProvider.tsx';
import type { AnnotationPosition } from 'external/src/delegate/annotations/types.ts';
import { useCloseThreadWithWarning } from 'sdk/client/core/react/useCloseThreadWithWarning.ts';
import { FloatingThreadsContext } from 'external/src/context/floatingThreads/FloatingThreadsContext.ts';
import { useEscapeListener } from 'external/src/effects/useEscapeListener.ts';
import { useClickOutsideMany } from 'external/src/effects/useClickOutside.ts';
import { getFloatingElementCoords } from 'external/src/delegate/annotations/util.ts';
import { useHeightTracker } from 'external/src/effects/useDimensionTracker.ts';
import { DisabledScrollContainerProvider } from 'external/src/components/2/ScrollContainer2.tsx';
import { PinnedAnnotationsContext } from 'external/src/context/annotations/PinnedAnnotationsContext.ts';
import { PagePresenceAndVisitorsShim } from 'sdk/client/core/react/PagePresenceAndVisitorsShim.tsx';

type Props = {
  threadID: string;
  annotationPosition: AnnotationPosition;
  pinRef: React.RefObject<HTMLElement>;
  hidden?: boolean;
  onClose?: () => void;
};

export function FloatingThread({
  threadID,
  annotationPosition,
  pinRef,
  onClose,
}: Props) {
  const threadData = useContextThrowingIfNoProvider(ThreadsDataContext2);
  const { annotationPinSize } = useContextThrowingIfNoProvider(
    PinnedAnnotationsContext,
  );

  const thread = threadData[threadID];
  const { mergeThread } = useContextThrowingIfNoProvider(ThreadsContext2);
  const {
    addUsers,
    byInternalID: { requestUsers },
  } = useContextThrowingIfNoProvider(UsersContext);

  const [fetchThread, { data: fetchedThreadData }] = useLazyThread2Query();

  const [floatingThreadRef] = useHeightTracker<HTMLDivElement>();

  const floatingThreadCtx = useContextThrowingIfNoProvider(
    FloatingThreadsContext,
  );

  const isOpenThread = floatingThreadCtx?.openThreadID === threadID;
  const closeThreadWithWarning = useCloseThreadWithWarning(() => {
    onClose?.();
    floatingThreadCtx?.setOpenThreadID(null);
  });
  const { draftMessageInComposer } =
    useContextThrowingIfNoProvider(ThreadsContext2);

  const elements = useMemo(() => {
    const elems: React.RefObject<HTMLElement>[] = [floatingThreadRef];
    if (!draftMessageInComposer) {
      elems.push(pinRef);
    }
    return elems;
  }, [draftMessageInComposer, floatingThreadRef, pinRef]);
  useClickOutsideMany({
    elements,
    onMouseDown: closeThreadWithWarning,
    disabled: !isOpenThread,
    capture: true,
  });
  useEscapeListener(closeThreadWithWarning, !isOpenThread);

  useEffect(() => {
    if (!thread) {
      void fetchThread({ variables: { threadID } });
    }
  }, [threadID, thread, fetchThread]);

  useEffect(() => {
    if (fetchedThreadData) {
      extractUsersFromThread2(fetchedThreadData.thread, addUsers, requestUsers);
      mergeThread(threadFragmentToThreadData(fetchedThreadData.thread));
    }
  }, [fetchedThreadData, mergeThread, addUsers, requestUsers]);

  if (!thread) {
    return <></>;
  }

  return (
    <div
      style={{
        ...THREAD_STYLE,
        boxShadow: cssVar('shadow-large'),
        borderRadius: cssVar('thread-border-radius'),
        position: 'absolute',
        ...getFloatingElementCoords(
          annotationPosition,
          floatingThreadRef.current?.getBoundingClientRect(),
          annotationPinSize,
        ),
        visibility: isOpenThread ? 'visible' : 'hidden',
        width: cssVarWithCustomFallback(
          'thread-width',
          CSS_VAR_CUSTOM_FALLBACKS.NESTED_THREAD.width,
        ),
        height: cssVar('thread-height'),
        maxHeight: cssVarWithCustomFallback(
          'thread-max-height',
          CSS_VAR_CUSTOM_FALLBACKS.NESTED_THREAD.maxHeight,
        ),
      }}
      ref={floatingThreadRef}
      // When the React key changes, react re-renders the component and we use
      // this to clear the composer when a user discards a draft message
      key={`${threadID}${isOpenThread}`}
    >
      <GlobalElementProvider>
        <PagePresenceAndVisitorsShim>
          {/* For a single Thread, we don't need a scroll container. */}
          <DisabledScrollContainerProvider>
            <Thread2
              threadID={threadID}
              externalThreadID={thread.externalID}
              mode="inline"
              observeMessagesToMarkAsSeen={isOpenThread ? true : false}
              threadHeader={
                <ThreadHeader
                  threadId={threadID}
                  onClose={closeThreadWithWarning}
                />
              }
              shouldFocusOnMount={true}
            />
          </DisabledScrollContainerProvider>
        </PagePresenceAndVisitorsShim>
      </GlobalElementProvider>
    </div>
  );
}
