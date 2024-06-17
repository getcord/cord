import { useEffect, useMemo, useRef } from 'react';
import { isEqual } from '@cord-sdk/react/common/lib/fast-deep-equal.ts';
import type {
  EntityMetadata,
  ThreadInfo,
  ThreadCallbackInfo,
  ThreadCallbackInfoWithThreadID,
} from '@cord-sdk/types';

import { ThreadWithProvider } from 'external/src/components/ui3/thread/ThreadWithProvider.tsx';
import { CSSVariableOverrideContext } from 'external/src/context/cssVariableOverride/CSSVariableOverrideContext.tsx';
import { ThreadCSSOverrides } from 'sdk/client/core/css/overrides.ts';
import { ThreadNameContext } from 'external/src/context/page/ThreadNameContext.tsx';
import { ThreadHeader } from 'external/src/components/ui3/thread/ThreadHeader.tsx';
import { useThreadByExternalID } from 'external/src/context/threads2/useThreadByExternalID.ts';
import { useDispatchEventOnce } from 'external/src/effects/useDispatchEventOnce.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ThreadsContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { useUpdatingRef } from 'external/src/effects/useUpdatingRef.ts';
import {
  useSetThreadNameMutation,
  useSetThreadMetadataMutation,
} from 'external/src/graphql/operations.ts';

import 'external/src/components/ui3/thread/Thread.css';
import { PagePresenceAndVisitorsShim } from 'sdk/client/core/react/PagePresenceAndVisitorsShim.tsx';
import { getThreadSummary } from 'common/util/convertToExternal/thread.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';

function ThreadImpl({
  externalThreadID,
  metadata = undefined,
  collapsed = false,
  showHeader = false,
  composerExpanded = false,
  composerDisabled = false,
  shouldFocusOnMount = false,
  showPlaceholder = true,
  onThreadInfoChange,
  onClose,
  onResolved,
}: {
  externalThreadID: string;
  metadata?: EntityMetadata;
  collapsed?: boolean;
  showHeader?: boolean;
  composerExpanded?: boolean;
  composerDisabled?: boolean;
  shouldFocusOnMount?: boolean;
  showPlaceholder?: boolean;
  onThreadInfoChange?: (arg: ThreadInfo) => unknown;
  onClose?: (arg: ThreadCallbackInfoWithThreadID) => unknown;
  onResolved?: (arg: ThreadCallbackInfo) => unknown;
}) {
  const threadRef = useRef<HTMLDivElement>(null);
  const {
    byInternalID: { userByID: userByInternalID },
  } = useContextThrowingIfNoProvider(UsersContext);

  const { organization } = useContextThrowingIfNoProvider(OrganizationContext);

  const {
    thread: threadToRender,
    threadID,
    loading,
  } = useThreadByExternalID(externalThreadID);

  useEffect(() => {
    if (threadToRender === undefined) {
      return;
    }
    onThreadInfoChange?.({
      messageCount: threadToRender.messagesCountExcludingDeleted,
      thread: getThreadSummary(threadToRender, userByInternalID),
    });
  }, [onThreadInfoChange, threadToRender, userByInternalID]);

  const isResolvedRef = useRef(threadToRender?.resolved);
  useEffect(() => {
    if (
      isResolvedRef?.current !== undefined &&
      isResolvedRef?.current !== threadToRender?.resolved &&
      threadToRender?.resolved
    ) {
      onResolved?.({
        thread: getThreadSummary(threadToRender, userByInternalID),
      });
    }
    isResolvedRef.current = threadToRender?.resolved;
  }, [onResolved, threadToRender, userByInternalID]);

  const dispatchLoadingEvent = useDispatchEventOnce('loading');
  const dispatchRenderEvent = useDispatchEventOnce('render');

  useEffect(() => {
    if (loading) {
      dispatchLoadingEvent();
    } else {
      dispatchRenderEvent();
    }
  }, [dispatchLoadingEvent, dispatchRenderEvent, loading]);

  const { setName, setProperties } =
    useContextThrowingIfNoProvider(ThreadsContext2);
  const [setNameMutation] = useSetThreadNameMutation();
  const [setMetadataMutation] = useSetThreadMetadataMutation();

  // Name from threadName prop or similar.
  const {
    threadName: threadNameFromContext,
    default: threadNameFromContextDefault,
  } = useContextThrowingIfNoProvider(ThreadNameContext);
  // Name actually in DB.
  const currentThreadNameRef = useUpdatingRef(threadToRender?.name);
  const currentThreadMetadataRef = useUpdatingRef(threadToRender?.metadata);

  const maybeThreadID = threadToRender?.id;

  useEffect(() => {
    // Generally, we want to update the thread's name in the DB if that name
    // differs from the name passed to us via the threadName prop or similar.
    // However, we only want to do that if the threadName prop changes (or the
    // first time we render) -- in other words, if we detect the DB name has
    // changed out from under us, we do *not* want to try to set it back. This
    // is to prevent two components/tabs/whatever from getting into an infinite
    // loop fighting with each other about what the name should be. Thus we
    // `useUpdatingRef` to hide the DB name from React, so we can know what it
    // is, but we don't re-run if it changes.
    if (
      maybeThreadID &&
      threadNameFromContext &&
      threadNameFromContext !== currentThreadNameRef.current &&
      !threadNameFromContextDefault
    ) {
      // NB: this will cause a DB write to update the name (after optimistically
      // updating our store). This code is specifically inside the
      // `<cord-thread>` component directly, and NOT in the general thread
      // renderer, specifcally so that this code DOES NOT RUN for other elements
      // which render threads, importantly sidebar and inbox. The issue is that
      // those elements can render threads from other pages, pulling from some
      // sort of more global name out of the context, which would cause us to
      // overwrite the names of random threads with the current page's
      // title/URL.
      setName(maybeThreadID, threadNameFromContext);
      void setNameMutation({
        variables: { threadID: maybeThreadID, name: threadNameFromContext },
      });
    }
  }, [
    threadNameFromContext,
    currentThreadNameRef,
    setName,
    maybeThreadID,
    setNameMutation,
    threadNameFromContextDefault,
  ]);

  useEffect(() => {
    // This effect uses the same logic as the previous one, which handles
    // setting the name. See the comments there, which (I have _assumed_) apply
    // to metadata as well.
    if (
      maybeThreadID &&
      metadata &&
      !isEqual(metadata, currentThreadMetadataRef.current)
    ) {
      setProperties(maybeThreadID, { metadata });
      void setMetadataMutation({
        variables: {
          threadID: maybeThreadID,
          metadata: metadata,
        },
      });
    }
  }, [
    currentThreadMetadataRef,
    setProperties,
    maybeThreadID,
    setMetadataMutation,
    metadata,
  ]);

  const threadHeader = useMemo(() => {
    return threadID && showHeader && !collapsed ? (
      <ThreadHeader
        threadId={threadID}
        thread={threadToRender}
        showContextMenu={
          !!(threadToRender && threadToRender.messages.length > 0)
        }
        onClose={onClose}
      />
    ) : undefined;
  }, [collapsed, onClose, showHeader, threadID, threadToRender]);

  if (loading || !threadID) {
    // TODO: Do we want to show some loading indicator here? Probably not, we
    // instead give the 'loading' event to customers so that they can render
    // loading state that they want.
    return null;
  }

  if (collapsed && (!threadToRender || threadToRender.messages.length === 0)) {
    // collapsing an empty thread gives you nothing
    return null;
  }

  const createNewThread = !threadToRender;
  const groupID = organization?.id;

  if (createNewThread && !groupID) {
    throw new Error('Must specify a groupId if creating a new thread');
  }

  return (
    <CSSVariableOverrideContext.Provider value={ThreadCSSOverrides}>
      <PagePresenceAndVisitorsShim>
        <ThreadWithProvider
          threadID={threadID}
          externalThreadID={externalThreadID}
          mode={collapsed ? 'collapsed' : 'inline'}
          threadHeader={threadHeader}
          shouldFocusOnMount={shouldFocusOnMount}
          showPlaceholder={showPlaceholder}
          composerExpanded={composerExpanded}
          composerDisabled={composerDisabled}
          forwardRef={threadRef}
          threadMetadata={metadata}
        />
      </PagePresenceAndVisitorsShim>
    </CSSVariableOverrideContext.Provider>
  );
}

export const newThreadConfig = {
  NewComp: ThreadImpl,
  configKey: 'thread',
} as const;
