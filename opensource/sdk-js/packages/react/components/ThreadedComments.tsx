import * as React from 'react';
import cx from 'classnames';
import type {
  ThreadSummary,
  ClientThreadData,
  ComposerWebComponentEvents,
  EntityMetadata,
  Location,
  MessageInfo,
  ResolvedStatus,
  SortBy,
  ThreadListFilter,
  ClientThreadFilter,
} from '@cord-sdk/types';
import type { Dispatch, SetStateAction } from 'react';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { logComponentInstantiation } from '../common/util.js';
import * as user from '../hooks/user.js';
import { useThreadCounts, useThread, useThreads } from '../hooks/thread.js';
import { useExtraClassnames } from '../hooks/useExtraClassnames.js';
import * as fonts from '../common/ui/atomicClasses/fonts.css.js';
import { MODIFIERS } from '../common/ui/modifiers.js';
import { useCallFunctionOnce } from '../common/effects/useCallFunctionOnce.js';
import { useCordTranslation } from '../hooks/useCordTranslation.js';
import { useEnsureHighlightedThreadVisible } from '../hooks/useEnsureHighlightedThreadVisible.js';
import { withGroupIDCheck } from '../common/hoc/withGroupIDCheck.js';
import { useStoreHighlightedThreads } from '../hooks/useStoreHighlightedThreads.js';
import { CordContext } from '../contexts/CordContext.js';
import type { ThreadListReactComponentProps } from './ThreadList.js';
import * as classes from './ThreadedComments.classnames.js';
import { Composer } from './Composer.js';
import { Avatar } from './Avatar.js';
import { Facepile } from './Facepile.js';
import { Message } from './Message.js';
import { Icon } from './helpers/Icon.js';
import { EmptyStateWithFacepile } from './helpers/EmptyStateWithFacepile.js';

const THREADED_COMMENTS_COMPONENT_NAME = 'CORD-THREADED-COMMENTS';

export type DisplayResolved =
  | 'interleaved'
  | 'sequentially'
  | 'tabbed'
  | 'resolvedOnly'
  | 'unresolvedOnly';
type ShowReplies =
  | 'initiallyCollapsed'
  | 'initiallyExpanded'
  | 'alwaysCollapsed';
type MessageOrder = 'newest_on_top' | 'newest_on_bottom';
type ScrollDirection = 'up' | 'down';
type ComposerPosition = 'top' | 'bottom' | 'none';
export type ThreadedCommentsReactComponentProps = {
  location: Location;
  groupId?: string;
  partialMatch?: boolean;
  filter?: ThreadListFilter;
  threadMetadata?: EntityMetadata;
  className?: string;
  /** @deprecated Use sortBy and scrollDirection instead. */
  messageOrder?: MessageOrder;
  sortBy?: SortBy;
  scrollDirection?: ScrollDirection;
  composerPosition?: ComposerPosition;
  threadUrl?: string;
  threadName?: string;
  topLevelComposerExpanded?: boolean;
  replyComposerExpanded?: boolean;
  showReplies?: ShowReplies;
  highlightThreadId?: string;
  displayResolved?: DisplayResolved;
  autofocus?: boolean;
  enableFacepileTooltip?: boolean;
  showPlaceholder?: boolean;
  onMessageClick?: (messageInfo: MessageInfo) => unknown;
  onMessageMouseEnter?: (messageInfo: MessageInfo) => unknown;
  onMessageMouseLeave?: (messageInfo: MessageInfo) => unknown;
  onMessageEditStart?: (messageInfo: MessageInfo) => unknown;
  onMessageEditEnd?: (messageInfo: MessageInfo) => unknown;
  onThreadResolve?: ThreadListReactComponentProps['onThreadResolve'];
  onThreadReopen?: ThreadListReactComponentProps['onThreadReopen'];
  onRender?: () => unknown;
  onLoading?: () => unknown;
  onComposerFocus?: (...args: ComposerWebComponentEvents['focus']) => unknown;
  onComposerBlur?: (...args: ComposerWebComponentEvents['blur']) => unknown;
  onComposerClose?: (...args: ComposerWebComponentEvents['close']) => unknown;
  onSend?: (...args: ComposerWebComponentEvents['send']) => unknown;
};

export const ThreadedComments =
  withGroupIDCheck<ThreadedCommentsReactComponentProps>(
    ThreadedCommentsImpl,
    'ThreadedComments',
    // We allow ThreadedComments to load threads from all of a user's groups so
    // long as the new thread composer is not shown at the bottom of the
    // component.  This is because it then can't create new threads, and so there
    // is no issue of which group new threads should belong to.
    (props) => props.composerPosition !== 'none',
    'This component must have a groupId prop unless the composerPosition prop is set to "none". This is so that it is clear which group new threads should belong to.',
  );

function ThreadedCommentsImpl({
  className,
  location,
  groupId: propGroupID,
  messageOrder = 'newest_on_bottom',
  sortBy = 'first_message_timestamp',
  scrollDirection,
  composerPosition = 'bottom',
  threadUrl,
  threadName,
  topLevelComposerExpanded = false,
  replyComposerExpanded = false,
  showReplies = 'initiallyCollapsed',
  highlightThreadId,
  partialMatch = false,
  filter: _filter,
  threadMetadata = {},
  displayResolved = 'unresolvedOnly',
  autofocus = false,
  enableFacepileTooltip = false,
  showPlaceholder = true,
  onMessageClick,
  onMessageMouseEnter,
  onMessageMouseLeave,
  onMessageEditStart,
  onMessageEditEnd,
  onThreadResolve,
  onThreadReopen,
  onRender,
  onLoading,
  onComposerFocus,
  onComposerBlur,
  onComposerClose,
  onSend,
}: ThreadedCommentsReactComponentProps) {
  const filterWithGroup = { ..._filter, groupID: propGroupID };
  const { thread: maybeThreadToHighlight } = useThread(highlightThreadId, {
    skip: !highlightThreadId,
    filter: {
      location: { value: location, partialMatch },
      groupID: propGroupID,
      metadata: filterWithGroup?.metadata,
      // We always need to fetch the thread to highlight, regardless of
      // the resolvedStatus. We then adjust the initial state of
      // ThreadedComments based on the resolvedStatus of that thread.
      resolvedStatus: 'any',
    },
  });
  const [resolvedTabSelected, setResolvedTabSelected] = useState(
    !!maybeThreadToHighlight?.resolved || displayResolved === 'resolvedOnly',
  );
  const [expandResolved, setExpandResolved] = useState(
    !!maybeThreadToHighlight?.resolved && displayResolved === 'sequentially',
  );

  useEnsureHighlightedThreadVisible({
    maybeThreadToHighlight: maybeThreadToHighlight ?? undefined,
    displayResolved,
    setResolvedTabSelected,
    setExpandResolved,
  });

  const threadCounts = useThreadCounts({
    filter: {
      ...filterWithGroup,
      // We are going to deprecate the location and resolvedStatus from the filter parameter.
      // In the meantime, we don't want anyone specifying their value for this hook.
      // This hook needs to fetch information about the location regardless of
      // what the aforementioned two filter parameters are set to.
      ...{ location: { value: location, partialMatch } },
      ...{ resolvedStatus: 'any' },
    },
  });

  // We have intentionally left the scrollDirection prop without a default, so we
  // can be sure whether developers have set it or not. We always want the
  // scrollDirection to take precedence over the deprecated messageOrder now on,
  // until we completely remove it. But for developers already using it, we want
  // to convert it below.
  if (!scrollDirection) {
    switch (messageOrder) {
      case 'newest_on_top': {
        scrollDirection = 'down';
        break;
      }
      // If neither the messageOrder or scrollDirection are set, the default value
      // of scrollDirection will be based on the default value of the messageOrder prop,
      // which is "newest_on_bottom".
      case 'newest_on_bottom': {
        scrollDirection = 'up';
        break;
      }
      default: {
        const _: never = messageOrder;
        scrollDirection = 'up';
        break;
      }
    }
  }

  // The property for ThreadedComments does not correspond 1:1 with the underlying
  // `resolvedStatus` API filter. If we want to see resolved and unresolved threads
  // together, we want to fetch `resolvedStatus: any`. Otherwise we only want to
  // fetch threads with the `resolvedStatus` of the tab which is currently active.
  let resolvedStatus: ResolvedStatus;
  switch (displayResolved) {
    case 'interleaved': {
      resolvedStatus = 'any';
      break;
    }
    case 'tabbed': {
      resolvedStatus = resolvedTabSelected ? 'resolved' : 'unresolved';
      break;
    }
    case 'resolvedOnly': {
      resolvedStatus = 'resolved';
      break;
    }
    case 'unresolvedOnly': {
      resolvedStatus = 'unresolved';
      break;
    }
    // This option renders open and resolved threads as two panels in the
    // same page. Open threads first, resolved threads second. The order
    // is directly tied to the sorting. For example, if the newest thread
    // is on top, the user will have to scroll to the bottom of the
    // ThreadedComments to view resolved threads.
    case 'sequentially': {
      resolvedStatus = 'unresolved';
      break;
    }
    default: {
      const _: never = displayResolved;
      resolvedStatus = 'any';
      break;
    }
  }
  const showResolvedInSamePage = displayResolved === 'sequentially';
  const locationHasResolvedThreads =
    !!threadCounts && threadCounts.resolved > 0;
  const composerOnTop = composerPosition === 'top';
  // When showing resolved threads only, we don't want to show the composer
  // since it does not make sense to create a new thread which is resolved.
  const showComposer =
    composerPosition !== 'none' && resolvedStatus !== 'resolved';
  const composer = (
    <Composer
      location={location}
      showExpanded={topLevelComposerExpanded}
      threadUrl={threadUrl}
      threadName={threadName}
      threadMetadata={threadMetadata}
      onFocus={onComposerFocus}
      onBlur={onComposerBlur}
      onSend={onSend}
      autofocus={autofocus}
      groupId={propGroupID}
    />
  );

  const resolvedStatusTabs = displayResolved === 'tabbed' && (
    <ResolvedStatusTabs
      showResolved={resolvedTabSelected}
      setShowResolved={setResolvedTabSelected}
    />
  );

  const newestOnTop = scrollDirection === 'down';

  const expandResolvedButton = showResolvedInSamePage &&
    locationHasResolvedThreads && (
      <ExpandResolvedButton
        key="expand_resolved_threads_button"
        isExpanded={expandResolved}
        onClick={() => setExpandResolved((prev) => !prev)}
        expandedArrow={
          newestOnTop ? <Icon name="UpSolid" /> : <Icon name="DownSolid" />
        }
        collapsedArrow={
          newestOnTop ? <Icon name="DownSolid" /> : <Icon name="UpSolid" />
        }
      />
    );

  const threadList = (
    <ThreadedCommentsThreadList
      key="main_list"
      groupId={propGroupID}
      location={location}
      partialMatch={partialMatch}
      filter={filterWithGroup}
      resolvedStatus={
        filterWithGroup?.resolvedStatus
          ? filterWithGroup?.resolvedStatus
          : resolvedStatus
      }
      sortBy={sortBy}
      scrollDirection={scrollDirection}
      showReplies={showReplies}
      replyComposerExpanded={replyComposerExpanded}
      highlightThread={maybeThreadToHighlight ?? undefined}
      enableFacepileTooltip={enableFacepileTooltip}
      showPlaceholder={showPlaceholder}
      onRender={onRender}
      onLoading={onLoading}
      onMessageClick={onMessageClick}
      onMessageMouseEnter={onMessageMouseEnter}
      onMessageMouseLeave={onMessageMouseLeave}
      onMessageEditStart={onMessageEditStart}
      onMessageEditEnd={onMessageEditEnd}
      onThreadResolve={onThreadResolve}
      onThreadReopen={onThreadReopen}
      onComposerFocus={onComposerFocus}
      onComposerBlur={onComposerBlur}
      onComposerClose={onComposerClose}
      onSend={onSend}
    />
  );
  const resolvedThreadList = showResolvedInSamePage && expandResolved && (
    <ThreadedCommentsThreadList
      key="resolved_list"
      location={location}
      partialMatch={partialMatch}
      filter={filterWithGroup}
      resolvedStatus={'resolved'}
      highlightThread={maybeThreadToHighlight ?? undefined}
      sortBy={sortBy}
      scrollDirection={scrollDirection}
      showReplies={showReplies}
      enableFacepileTooltip={enableFacepileTooltip}
      showPlaceholder={showPlaceholder}
      onMessageClick={onMessageClick}
      onMessageMouseEnter={onMessageMouseEnter}
      onMessageMouseLeave={onMessageMouseLeave}
      onThreadResolve={onThreadResolve}
      onThreadReopen={onThreadReopen}
    />
  );

  // When displayResolved is set to `sequentially` we display: unresolved threads,
  // a button to trigger the showing of resolved threads and the resolved threads.
  // The order is directly tied to the sort order of the messages, so we use an
  // array to be able to easily reverse how these components are displayed
  const threadListOrderedArray = [
    threadList,
    expandResolvedButton,
    resolvedThreadList,
  ];

  return (
    <div
      className={cx(classes.comments, className, {
        [classes.unresolvedOnly]: displayResolved === 'unresolvedOnly',
        [classes.resolvedOnly]: displayResolved === 'resolvedOnly',
      })}
    >
      {resolvedStatusTabs}
      {composerOnTop && showComposer && composer}
      <div className={classes.threadList}>
        {newestOnTop
          ? threadListOrderedArray
          : threadListOrderedArray.reverse()}
      </div>
      {!composerOnTop && showComposer && composer}
    </div>
  );
}

function ThreadedCommentsThreadList({
  location,
  partialMatch = false,
  groupId: propGroupID,
  filter,
  resolvedStatus,
  sortBy = 'first_message_timestamp',
  scrollDirection = 'up',
  replyComposerExpanded = false,
  showReplies = 'initiallyCollapsed',
  highlightThread,
  enableFacepileTooltip = false,
  showPlaceholder = true,
  onRender,
  onLoading,
  onMessageClick,
  onMessageMouseEnter,
  onMessageMouseLeave,
  onMessageEditStart,
  onMessageEditEnd,
  onThreadResolve,
  onThreadReopen,
  onComposerFocus,
  onComposerBlur,
  onComposerClose,
  onSend,
}: {
  location: Location;
  partialMatch?: boolean;
  groupId?: string;
  filter?: ThreadListFilter;
  resolvedStatus: ResolvedStatus;
  threadMetadata?: EntityMetadata;
  sortBy?: SortBy;
  scrollDirection?: ScrollDirection;
  composerPosition?: ComposerPosition;
  threadUrl?: string;
  threadName?: string;
  topLevelComposerExpanded?: boolean;
  replyComposerExpanded?: boolean;
  showReplies?: ShowReplies;
  highlightThread?: ThreadSummary;
  autofocus?: boolean;
  enableFacepileTooltip?: boolean;
  showPlaceholder?: boolean;
  onMessageClick?: (messageInfo: MessageInfo) => unknown;
  onMessageMouseEnter?: (messageInfo: MessageInfo) => unknown;
  onMessageMouseLeave?: (messageInfo: MessageInfo) => unknown;
  onMessageEditStart?: (messageInfo: MessageInfo) => unknown;
  onMessageEditEnd?: (messageInfo: MessageInfo) => unknown;
  onThreadResolve?: ThreadListReactComponentProps['onThreadResolve'];
  onThreadReopen?: ThreadListReactComponentProps['onThreadReopen'];
  onRender?: () => unknown;
  onLoading?: () => unknown;
  onComposerFocus?: (...args: ComposerWebComponentEvents['focus']) => unknown;
  onComposerBlur?: (...args: ComposerWebComponentEvents['blur']) => unknown;
  onComposerClose?: (...args: ComposerWebComponentEvents['close']) => unknown;
  onSend?: (...args: ComposerWebComponentEvents['send']) => unknown;
}) {
  const [groupMemberIDs, setGroupMemberIDs] = useState<string[]>([]);

  const clientThreadFilter = {
    ...filter,
    location: { value: location, partialMatch },
    resolvedStatus,
  };
  const { threads, hasMore, loading, fetchMore } = useThreads({
    sortBy,
    sortDirection: 'descending',
    filter: clientThreadFilter,
  });
  // The highlightedThreads are used to store any threads highlighted
  // by ThreadedComments in the current render-cycle
  const highlightedThreads = useStoreHighlightedThreads({
    currentHighlightedThread: highlightThread,
    sortBy,
  });

  const localThreads = useMemo(() => {
    const existingIdSet = new Set(threads.map((t) => t.id));
    const newThreads = threads.slice();

    highlightedThreads.map((t) => {
      if (!existingIdSet.has(t.id)) {
        newThreads.push(t);
      }
    });
    return newThreads;
  }, [threads, highlightedThreads]);

  const { sdk: cordSDK } = useContext(CordContext);
  const viewerData = user.useViewerData();

  // This is a bit convoluted.  There are 3 scenarios:
  // 1) The group is passed as a prop, because there is no group in the token, or
  // 2) The group is in the token, or
  // 3) The group is not passed as a prop OR in the token - this is only allowed
  // to happen if the new thread composer is not shown (composerPosition = none).
  // In this case we can just choose (arbitrarily) the first group that the user
  // is a member of.
  const groupID = propGroupID ?? cordSDK?.groupID ?? viewerData?.groups?.[0];

  const { t } = useCordTranslation('threaded_comments');

  const dispatchLoadingEvent = useCallFunctionOnce(onLoading);
  const dispatchRenderEvent = useCallFunctionOnce(onRender);
  const dispatchLogComponentEvent = useCallFunctionOnce(
    logComponentInstantiation,
  );
  useEffect(() => {
    if (loading) {
      dispatchLoadingEvent();
    } else {
      dispatchRenderEvent();
      dispatchLogComponentEvent(THREADED_COMMENTS_COMPONENT_NAME);
    }
  }, [
    dispatchLoadingEvent,
    dispatchLogComponentEvent,
    dispatchRenderEvent,
    loading,
  ]);

  const renderedThreads = localThreads.map((oneThread) => (
    <CommentsThread
      key={oneThread.id}
      threadExtraClassnames={oneThread.extraClassnames}
      threadId={oneThread.id}
      showReplies={showReplies}
      highlightThread={oneThread.id === highlightThread?.id}
      enableFacepileTooltip={enableFacepileTooltip}
      replyComposerExpanded={replyComposerExpanded}
      filter={clientThreadFilter}
      onMessageClick={onMessageClick}
      onMessageMouseEnter={onMessageMouseEnter}
      onMessageMouseLeave={onMessageMouseLeave}
      onMessageEditStart={onMessageEditStart}
      onMessageEditEnd={onMessageEditEnd}
      onThreadResolve={onThreadResolve}
      onThreadReopen={onThreadReopen}
      onComposerFocus={onComposerFocus}
      onComposerBlur={onComposerBlur}
      onComposerClose={onComposerClose}
      onSend={onSend}
    />
  ));

  const newestOnTop = scrollDirection === 'down';
  if (!newestOnTop) {
    renderedThreads.reverse();
  }

  const fetchMoreButton =
    !loading && hasMore ? <FetchMoreButton fetchMore={fetchMore} /> : null;

  const titlePlaceholder =
    resolvedStatus === 'resolved'
      ? t('resolved_placeholder_title')
      : t('placeholder_title');
  const bodyPlaceholder =
    resolvedStatus === 'resolved'
      ? t('resolved_placeholder_body')
      : t('placeholder_body');

  return (
    <>
      {groupID && (
        <GroupMemberFetcher
          groupID={groupID}
          setGroupMemberIDs={setGroupMemberIDs}
        />
      )}
      {showPlaceholder && threads.length === 0 && !loading && (
        <EmptyStateWithFacepile
          users={groupMemberIDs}
          titlePlaceholder={titlePlaceholder}
          bodyPlaceholder={bodyPlaceholder}
        />
      )}
      {!newestOnTop && fetchMoreButton}
      {threads.length !== 0 && renderedThreads}
      {newestOnTop && fetchMoreButton}
    </>
  );
}

function ExpandResolvedButton({
  isExpanded,
  onClick,
  expandedArrow,
  collapsedArrow,
}: {
  isExpanded: boolean;
  onClick: () => void;
  expandedArrow: JSX.Element;
  collapsedArrow: JSX.Element;
}) {
  const { t } = useCordTranslation('threaded_comments');

  return (
    <button
      type="button"
      className={cx(classes.expandResolvedButton, fonts.fontSmall)}
      onClick={onClick}
    >
      {isExpanded
        ? t('hide_resolved_threads_action')
        : t('show_resolved_threads_action')}
      {isExpanded ? expandedArrow : collapsedArrow}
    </button>
  );
}

function FetchMoreButton({
  fetchMore,
}: {
  fetchMore: (howMany: number) => Promise<void>;
}) {
  const { t } = useCordTranslation('threaded_comments');
  return (
    <button
      className={cx(classes.showMore, fonts.fontSmall)}
      onClick={() => void fetchMore(5)}
      type="button"
    >
      {t('load_more_action')}
    </button>
  );
}

function ResolvedStatusTabs({
  showResolved,
  setShowResolved,
}: {
  showResolved: boolean;
  setShowResolved: Dispatch<SetStateAction<boolean>>;
}) {
  const { t } = useCordTranslation('threaded_comments');
  return (
    <div className={classes.tabContainer}>
      <button
        type="button"
        className={cx(fonts.fontSmall, classes.tab, {
          [MODIFIERS.active]: !showResolved,
        })}
        onClick={() => setShowResolved(false)}
      >
        {t('show_unresolved')}
      </button>
      <button
        type="button"
        className={cx(fonts.fontSmall, classes.tab, {
          [MODIFIERS.active]: showResolved,
        })}
        onClick={() => setShowResolved(true)}
      >
        {t('show_resolved')}
      </button>
    </div>
  );
}

function CommentsThread({
  threadId,
  threadExtraClassnames,
  showReplies,
  highlightThread,
  enableFacepileTooltip,
  replyComposerExpanded,
  filter,
  onMessageClick,
  onMessageMouseEnter,
  onMessageMouseLeave,
  onMessageEditStart,
  onMessageEditEnd,
  onThreadResolve,
  onThreadReopen,
  onComposerFocus,
  onComposerBlur,
  onComposerClose,
  onSend,
}: {
  threadId: string;
  threadExtraClassnames: string | null;
  showReplies: ShowReplies;
  highlightThread: boolean;
  enableFacepileTooltip: boolean;
  replyComposerExpanded?: boolean;
  filter?: ClientThreadFilter;
  onMessageClick?: (messageInfo: MessageInfo) => unknown;
  onMessageMouseEnter?: (messageInfo: MessageInfo) => unknown;
  onMessageMouseLeave?: (messageInfo: MessageInfo) => unknown;
  onMessageEditStart?: (messageInfo: MessageInfo) => unknown;
  onMessageEditEnd?: (messageInfo: MessageInfo) => unknown;
  onThreadResolve?: ThreadListReactComponentProps['onThreadResolve'];
  onThreadReopen?: ThreadListReactComponentProps['onThreadReopen'];
  onComposerFocus?: (...args: ComposerWebComponentEvents['focus']) => unknown;
  onComposerBlur?: (...args: ComposerWebComponentEvents['blur']) => unknown;
  onComposerClose?: (...args: ComposerWebComponentEvents['close']) => unknown;
  onSend?: (...args: ComposerWebComponentEvents['send']) => unknown;
}) {
  const threadData = useThread(threadId, { filter, skip: !threadId });
  const viewerData = user.useViewerData();
  const allowReplies = showReplies !== 'alwaysCollapsed';
  const initiallyExpandedReplies = showReplies === 'initiallyExpanded';
  const [showingReplies, setShowingReplies] = useState<boolean>(
    initiallyExpandedReplies,
  );
  const [showingComposer, setShowingComposer] = useState<boolean>(false);
  const threadRef = useRef<HTMLDivElement>(null);

  const handleCollapsedRepliesClick = useCallback(() => {
    if (allowReplies) {
      setShowingReplies(true);
      // When we have initially expanded replies and a user collapses and
      // reopens a thread, we don't want to show a composer (as we would in initiallyCollapsed)
      // state. We want to show consistent behavior.
      setShowingComposer(!initiallyExpandedReplies);
    }
  }, [allowReplies, initiallyExpandedReplies]);

  const extraClassnames = useExtraClassnames(threadExtraClassnames);

  const threadSummary = threadData?.thread;
  if (!threadSummary || !threadSummary.firstMessage?.id) {
    return null;
  }
  const isResolved = threadSummary.resolved;
  const hasReplies = threadSummary.userMessages > 1;
  const showReplyComponent = allowReplies && (!hasReplies || showingReplies);

  return (
    <div
      ref={threadRef}
      className={cx(classes.thread, extraClassnames, {
        [MODIFIERS.highlighted]: highlightThread,
        [MODIFIERS.resolved]: isResolved,
        [MODIFIERS.noReplies]: !hasReplies,
        [MODIFIERS.subscribed]:
          viewerData?.id && threadSummary.subscribers.includes(viewerData?.id),
      })}
      data-cord-thread-id={threadId}
      data-cord-group-id={threadData?.thread?.groupID}
    >
      {isResolved && (
        <ResolvedThreadHeader
          threadId={threadId}
          threadSummary={threadSummary}
          onThreadReopen={onThreadReopen}
        />
      )}
      <Message
        messageId={threadSummary.firstMessage?.id}
        threadId={threadId}
        // Marking a single message as seen is not available just yet. When
        // we have a thread with no replies, we shouldn't be stuck in unread
        // state. If the message has replies, we can wait for the user to open
        // the replies to mark it as seen.
        markAsSeen={threadSummary.total === 1}
        onClick={onMessageClick}
        onMouseEnter={onMessageMouseEnter}
        onMouseLeave={onMessageMouseLeave}
        onEditStart={onMessageEditStart}
        onEditEnd={onMessageEditEnd}
        onThreadResolve={onThreadResolve}
        onThreadReopen={onThreadReopen}
        onRender={() => {
          if (highlightThread) {
            // By setting `block: nearest` we are preventing ThreadedComments from
            // scrolling too much and causing the rest of the page to jump
            threadRef.current?.scrollIntoView({ block: 'nearest' });
          }
        }}
      />

      {showingReplies &&
      // Don't show the expanded version until we actually have the thread data,
      // to prevent replacing the collapsed version with an empty div while the
      // thread data loads.
      (threadData.messages.length > 0 || !threadData.loading) ? (
        <ThreadReplies
          threadId={threadId}
          threadData={threadData}
          setShowingReplies={setShowingReplies}
          setShowingComposer={setShowingComposer}
          onMessageClick={onMessageClick}
          onMessageMouseEnter={onMessageMouseEnter}
          onMessageMouseLeave={onMessageMouseLeave}
          onMessageEditStart={onMessageEditStart}
          onMessageEditEnd={onMessageEditEnd}
        />
      ) : (
        <CollapsedReplies
          threadSummary={threadSummary}
          enableFacepileTooltip={enableFacepileTooltip}
          onClick={handleCollapsedRepliesClick}
        />
      )}
      {showReplyComponent && (
        <ReplyComponent
          threadId={threadId}
          showingComposer={showingComposer}
          replyComposerExpanded={replyComposerExpanded}
          setShowingComposer={setShowingComposer}
          setShowingReplies={setShowingReplies}
          onComposerFocus={onComposerFocus}
          onComposerBlur={onComposerBlur}
          onComposerClose={onComposerClose}
          onSend={onSend}
          onThreadReopen={(args) =>
            onThreadReopen?.({ threadID: args.threadId, thread: threadSummary })
          }
        />
      )}
    </div>
  );
}

function CollapsedReplies({
  threadSummary,
  enableFacepileTooltip,
  onClick,
}: {
  threadSummary: ThreadSummary;
  enableFacepileTooltip: boolean;
  onClick: () => void;
}) {
  const { t } = useCordTranslation('threaded_comments');
  // The thread summary has an unread count covering the entire thread. The UI we
  // render below looks like we are talking about the number of unread *replies*,
  // so if the first message itself is unread, subtract that from the number.
  // This prevents, for example, rendering "2 new replies" and then you click and
  // only one message appears (because the first message, already displayed, was
  // included in that count).
  let unreadNumber = threadSummary.unread;
  if (threadSummary.firstMessage && !threadSummary.firstMessage.seen) {
    unreadNumber--;
  }

  const hasUnread = unreadNumber > 0;
  // We are including only user messages in the reply count,
  // as it doesn't make sense to count action messages such as
  // "User X resolved this thread".
  // Then, the number of replies is one less than the total number of messages
  // unless the first message is deleted in which case all user messages are replies
  const replyCount =
    threadSummary.userMessages -
    (threadSummary.firstMessage?.deletedTimestamp ? 0 : 1);
  const hasReplies = replyCount > 0;
  const allRepliers = Array.from(
    new Set([
      ...threadSummary.repliers,
      ...threadSummary.actionMessageRepliers,
    ]),
  );
  return (
    <>
      {hasReplies && (
        <button
          className={cx(classes.expandReplies, fonts.fontSmall, {
            [MODIFIERS.unseen]: hasUnread,
          })}
          onClick={onClick}
          type="button"
        >
          <Facepile users={allRepliers} enableTooltip={enableFacepileTooltip} />
          {hasUnread
            ? t('show_replies_action_unread', { count: unreadNumber })
            : t('show_replies_action_read', { count: replyCount })}
        </button>
      )}
    </>
  );
}

function ThreadReplies({
  threadId,
  threadData,
  setShowingReplies,
  setShowingComposer,
  onMessageClick,
  onMessageMouseEnter,
  onMessageMouseLeave,
  onMessageEditStart,
  onMessageEditEnd,
}: {
  threadId: string;
  threadData: ClientThreadData;
  setShowingReplies: Dispatch<SetStateAction<boolean>>;
  setShowingComposer: Dispatch<SetStateAction<boolean>>;
  onMessageClick?: (messageInfo: MessageInfo) => unknown;
  onMessageMouseEnter?: (messageInfo: MessageInfo) => unknown;
  onMessageMouseLeave?: (messageInfo: MessageInfo) => unknown;
  onMessageEditStart?: (messageInfo: MessageInfo) => unknown;
  onMessageEditEnd?: (messageInfo: MessageInfo) => unknown;
}) {
  const { t } = useCordTranslation('threaded_comments');
  const { messages, hasMore, fetchMore } = threadData;

  // The useThreadData hook will also return the first message, but
  // since we are already rendering it, we need to remove it when
  // we receive it
  const restOfMessages = hasMore ? messages : messages.slice(1);

  const hasReplies = restOfMessages.length > 0;

  return (
    <>
      {hasReplies && (
        <>
          <button
            className={cx(classes.hideReplies, fonts.fontSmall)}
            onClick={() => {
              setShowingReplies(false);
              setShowingComposer(false);
            }}
            type="button"
          >
            {t('hide_replies_action')}
          </button>

          {hasMore && (
            <button
              className={cx(classes.showMore, fonts.fontSmall)}
              onClick={() => void fetchMore(5)}
              type="button"
            >
              {t('show_more_replies_action')}
            </button>
          )}
          <div className={classes.repliesContainer}>
            {restOfMessages.map((message) => {
              return (
                // We are not passing the onThreadResolve/onThreadReopen events
                // to the remaining messages, because we can only resolve/reopen
                // from the first message of a thread.
                <Message
                  key={message.id}
                  threadId={threadId}
                  messageId={message.id}
                  onClick={onMessageClick}
                  onMouseEnter={onMessageMouseEnter}
                  onMouseLeave={onMessageMouseLeave}
                  onEditStart={onMessageEditStart}
                  onEditEnd={onMessageEditEnd}
                />
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

function ReplyComponent({
  threadId,
  showingComposer,
  replyComposerExpanded,
  setShowingComposer,
  setShowingReplies,
  onComposerFocus,
  onComposerBlur,
  onComposerClose,
  onSend,
  onThreadReopen,
}: {
  threadId: string;
  showingComposer: boolean;
  replyComposerExpanded?: boolean;
  setShowingComposer: Dispatch<SetStateAction<boolean>>;
  setShowingReplies: Dispatch<SetStateAction<boolean>>;
  onComposerFocus?: (...args: ComposerWebComponentEvents['focus']) => unknown;
  onComposerBlur?: (...args: ComposerWebComponentEvents['blur']) => unknown;
  onComposerClose?: (...args: ComposerWebComponentEvents['close']) => unknown;
  onSend?: (...args: ComposerWebComponentEvents['send']) => unknown;
  onThreadReopen?: (
    ...args: ComposerWebComponentEvents['threadreopen']
  ) => unknown;
}) {
  const { t } = useCordTranslation('threaded_comments');
  const viewerData = user.useViewerData();
  const userId = viewerData?.id;

  return showingComposer ? (
    <div className={classes.viewerAvatarWithComposer}>
      {userId && <Avatar userId={userId} />}
      <Composer
        threadId={threadId}
        showExpanded={replyComposerExpanded}
        showCloseButton
        size={'small'}
        autofocus
        onFocus={onComposerFocus}
        onBlur={onComposerBlur}
        onClose={(args) => {
          setShowingComposer(false);
          onComposerClose?.(args);
        }}
        onSend={onSend}
        onThreadReopen={onThreadReopen}
      />
    </div>
  ) : (
    <button
      className={cx(classes.expandReplies, fonts.fontSmall)}
      onClick={() => {
        setShowingComposer(true);
        setShowingReplies(true);
      }}
      type="button"
    >
      {t('reply_action')}
    </button>
  );
}

function ResolvedThreadHeader({
  threadId,
  threadSummary,
  onThreadReopen,
}: {
  threadId: string;
  threadSummary: ThreadSummary;
  onThreadReopen?: ThreadListReactComponentProps['onThreadReopen'];
}) {
  const { t } = useCordTranslation('threaded_comments');
  const setUnresolved = useCallback(() => {
    if (window.CordSDK) {
      void window.CordSDK.thread.updateThread(threadId, {
        resolved: false,
      });
    }
  }, [threadId]);
  return (
    <div className={cx(classes.resolvedThreadHeader, fonts.fontSmall)}>
      <Icon name={'CheckCircle'} />
      {t('resolved_status')}
      <button
        type="button"
        className={cx(classes.reopenButton, fonts.fontSmall)}
        onClick={() => {
          setUnresolved();
          onThreadReopen?.({ threadID: threadId, thread: threadSummary });
        }}
      >
        {t('unresolve_action')}
      </button>
    </div>
  );
}

// In its own component to handle the situation where groupID is undefined
// because the viewer data hasn't loaded yet (as passing undefined will result
// in an error in useGroupMembers, and we can't skip the hook call because that
// disobeys React's hooks rules)
function GroupMemberFetcher({
  groupID,
  setGroupMemberIDs,
}: {
  groupID: string;
  setGroupMemberIDs: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const { groupMembers } = user.useGroupMembers({ groupID });

  useEffect(() => {
    setGroupMemberIDs(groupMembers.map((member) => member.id));
  }, [groupMembers, setGroupMemberIDs]);

  return null;
}
