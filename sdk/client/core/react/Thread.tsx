import { memo, useEffect, useMemo, useRef } from 'react';
import { jss } from 'react-jss';
import { isEqual } from '@cord-sdk/react/common/lib/fast-deep-equal.ts';
import type {
  EntityMetadata,
  ThreadInfo,
  ThreadCallbackInfo,
  ThreadCallbackInfoWithThreadID,
} from '@cord-sdk/types';
import type { ThreadReactComponentProps } from '@cord-sdk/react';

import { Thread2 } from 'external/src/components/2/thread2/index.tsx';
import { ComponentPageContextProvider } from 'sdk/client/core/react/ComponentPageContextProvider.tsx';
import { CSSVariableOverrideContext } from 'external/src/context/cssVariableOverride/CSSVariableOverrideContext.tsx';
import { ThreadCSSOverrides } from 'sdk/client/core/css/overrides.ts';
import {
  MaybeThreadNameContext,
  ThreadNameContext,
} from 'external/src/context/page/ThreadNameContext.tsx';
import { cordCssVarName, cssVar } from 'common/ui/cssVariables.ts';
import { ThreadHeader } from 'external/src/components/ui3/thread/ThreadHeader.tsx';
import { GlobalElementProvider } from 'external/src/context/globalElement/GlobalElementProvider.tsx';
import { DisabledAnnotationsOnPageProvider } from 'external/src/context/annotationsOnPage/AnnotationsOnPageProvider.tsx';
import { DisabledScrollContainerProvider } from 'external/src/components/2/ScrollContainer2.tsx';
import { DisabledAnnotationPillDisplayProvider } from 'external/src/context/annotations/AnnotationPillDisplayContext.tsx';
import { DisabledThreadListContext } from 'sdk/client/core/react/ThreadList.tsx';
import { AnnotationsConfigProvider } from 'external/src/context/annotations/AnnotationConfigContext.tsx';
import { useThreadByExternalID } from 'external/src/context/threads2/useThreadByExternalID.ts';
import { ScreenshotConfigProvider } from 'external/src/context/screenshotConfig/ScreenshotConfigContext.tsx';
import { useDispatchEventOnce } from 'external/src/effects/useDispatchEventOnce.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ThreadsContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { useUpdatingRef } from 'external/src/effects/useUpdatingRef.ts';
import { PartialConfigurationProvider } from 'external/src/context/config/PartialConfigurationProvider.tsx';
import { ConfigurationContext } from 'external/src/context/config/ConfigurationContext.ts';
import {
  useSetThreadNameMutation,
  useSetThreadMetadataMutation,
} from 'external/src/graphql/operations.ts';
import { withNewCSSComponentMaybe } from 'external/src/components/ui3/withNewComponent.tsx';
import { newThreadConfig } from 'external/src/components/ui3/thread/ThreadImpl.tsx';
import {
  OrgOverrideProvider,
  OrganizationContext,
} from 'external/src/context/organization/OrganizationContext.tsx';
import { PagePresenceAndVisitorsShim } from 'sdk/client/core/react/PagePresenceAndVisitorsShim.tsx';
import { getThreadSummary } from 'common/util/convertToExternal/thread.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';

export const THREAD_STYLE = {
  display: 'block',
  backgroundColor: cssVar('thread-background-color'),
  overflow: 'hidden',
  minWidth: '250px',
};

const THREAD_HOST_STYLE = {
  '@global': {
    ':host': {
      ...THREAD_STYLE,
      border: cssVar('thread-border'),
      borderRadius: cssVar('thread-border-radius'),
      borderTop: cssVar('thread-border-top'),
      borderRight: cssVar('thread-border-right'),
      borderBottom: cssVar('thread-border-bottom'),
      borderLeft: cssVar('thread-border-left'),
      height: cssVar('thread-height'),
      maxHeight: cssVar('thread-max-height'),
      width: cssVar('thread-width'),
    },
    //  disable border properties, they are applied on the :host and web-component element instead
    ':host > *': {
      position: 'relative',
      [`--cord-${ThreadCSSOverrides.inlineThread.borderRadius}`]: 'none',
      [`--cord-${ThreadCSSOverrides.inlineThread.border}`]: 'none',
      [cordCssVarName('thread-border-top')]: 'none',
      [cordCssVarName('thread-border-right')]: 'none',
      [cordCssVarName('thread-border-bottom')]: 'none',
      [cordCssVarName('thread-border-left')]: 'none',
    },
    ':host > div': {
      height: '100%',
      maxHeight: 'inherit',
    },
  },
};

// NOTE: threadId instead of threadID here because <cord-thread>'s attribute
// "thread-id" converts to threadId, not threadID
// TODO: collapsing a thread currently loses your draft composer message
function Thread({
  threadId,
  threadName,
  metadata,
  context,
  location,
  collapsed,
  showHeader,
  showPlaceholder,
  composerExpanded,
  composerDisabled,
  threadOptions,
  autofocus,
  screenshotConfig,
  groupId,
  onThreadInfoChange,
  onClose,
  onResolved,
}: ThreadReactComponentProps) {
  const existingConfig = useContextThrowingIfNoProvider(ConfigurationContext);
  const configValues = useMemo(() => {
    if (!threadOptions?.additional_subscribers_on_create.length) {
      return {};
    }
    if (
      !existingConfig.threadOptions?.additional_subscribers_on_create.length
    ) {
      return {
        threadOptions: {
          additional_subscribers_on_create:
            threadOptions.additional_subscribers_on_create,
        },
      };
    }
    const mergedSubscribers = [
      ...existingConfig.threadOptions.additional_subscribers_on_create,
      ...threadOptions.additional_subscribers_on_create,
    ];
    return {
      threadOptions: {
        additional_subscribers_on_create: mergedSubscribers,
      },
    };
  }, [threadOptions, existingConfig]);

  return (
    <OrgOverrideProvider externalOrgID={groupId}>
      <ScreenshotConfigProvider screenshotConfig={screenshotConfig}>
        <PartialConfigurationProvider config={configValues}>
          <ComponentPageContextProvider location={location ?? context}>
            <MaybeThreadNameContext threadName={threadName}>
              <GlobalElementProvider>
                <DisabledAnnotationsOnPageProvider>
                  {/* For a single Thread, we don't need a scroll container. */}
                  <DisabledScrollContainerProvider>
                    <DisabledAnnotationPillDisplayProvider>
                      <AnnotationsConfigProvider showPinsOnPage={false}>
                        <DisabledThreadListContext>
                          <ThreadImpl
                            key={threadId}
                            externalThreadID={threadId}
                            metadata={metadata}
                            collapsed={collapsed}
                            showHeader={showHeader}
                            showPlaceholder={showPlaceholder}
                            composerExpanded={composerExpanded}
                            composerDisabled={composerDisabled}
                            onThreadInfoChange={onThreadInfoChange}
                            onClose={onClose}
                            onResolved={onResolved}
                            shouldFocusOnMount={autofocus}
                          />
                        </DisabledThreadListContext>
                      </AnnotationsConfigProvider>
                    </DisabledAnnotationPillDisplayProvider>
                  </DisabledScrollContainerProvider>
                </DisabledAnnotationsOnPageProvider>
              </GlobalElementProvider>
            </MaybeThreadNameContext>
          </ComponentPageContextProvider>
        </PartialConfigurationProvider>
      </ScreenshotConfigProvider>
    </OrgOverrideProvider>
  );
}

const ThreadImpl = withNewCSSComponentMaybe(
  newThreadConfig,
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

    const { organization } =
      useContextThrowingIfNoProvider(OrganizationContext);

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

    const threadStyles = useMemo(
      () => jss.createStyleSheet(THREAD_HOST_STYLE).toString(),
      [],
    );

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
    const { threadName: threadNameFromContext, default: threadNameDefault } =
      useContextThrowingIfNoProvider(ThreadNameContext);

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
        !threadNameDefault
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
      threadNameDefault,
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

    if (
      collapsed &&
      (!threadToRender || threadToRender.messages.length === 0)
    ) {
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
          <style>{threadStyles}</style>
          <Thread2
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
  },
);

// TODO: make this automatic
export default memo(Thread);
