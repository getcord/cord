import { useCallback, useEffect, useRef, useState } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import type { ThreadData } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { CollapsedThreadFooter2 } from 'external/src/components/2/thread2/CollapsedThreadFooter2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import { useThreadHoverStyles2 } from 'external/src/components/2/hooks/useThreadHoverStyles2.ts';
import { CSSVariableOverrideContext } from 'external/src/context/cssVariableOverride/CSSVariableOverrideContext.tsx';
import { Message2 } from 'external/src/components/2/Message2.tsx';
import { MessageSeenObserverProvider } from 'external/src/context/messageSeenObserver/MessageSeenObserverProvider.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { useShowThreadListHighlight } from 'external/src/effects/useShowThreadListHighlight.ts';
import { ScrollContainerContext } from 'external/src/context/scrollContainer/ScrollContainerContext.ts';
import { Sizes } from 'common/const/Sizes.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { MODIFIERS } from 'common/ui/modifiers.ts';

const EXTRA_PADDING_FOR_SCROLL = Sizes.XLARGE;
const useStyles = createUseStyles({
  thread: {
    display: 'flex',
    flexDirection: 'column',
    gap: cssVar('space-3xs'),
    '&:hover': {
      boxShadow: cssVar('shadow-small'),
    },
    borderTop: cssVar('thread-border-top'),
    borderRight: cssVar('thread-border-right'),
    borderBottom: cssVar('thread-border-bottom'),
    borderLeft: cssVar('thread-border-left'),
  },
  collapsedThreadOptionsButton: {
    position: 'absolute',
    right: cssVar('space-xs'),
    top: cssVar('space-xs'),
  },
  highlighted: {
    backgroundColor: cssVar('thread-list-thread-highlight-background-color'),
  },
});

type Props = {
  thread: ThreadData;
  threadHeader?: JSX.Element;
  allowReply: boolean;
  showMessageOptions: boolean;
  showThreadOptions: boolean;
};

export function CollapsedThreadComponent2({
  thread,
  threadHeader,
  allowReply,
  showMessageOptions,
  showThreadOptions,
}: Props) {
  const classes = useStyles();
  const hoverClasses = useThreadHoverStyles2();
  const cssOverrideContext = useContextThrowingIfNoProvider(
    CSSVariableOverrideContext,
  );

  const scrollContainerContext = useContextThrowingIfNoProvider(
    ScrollContainerContext,
  );

  const [hover, setHover] = useState(false);

  const onMouseEnter = useCallback(() => setHover(true), []);
  const onMouseLeave = useCallback(() => setHover(false), []);

  const newMessageCount = thread.newMessagesCount + thread.newReactionsCount;

  const excludeFooter = thread.resolved && thread.replyCount === 0;

  const highlightThread = useShowThreadListHighlight();

  const collapsedThreadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      highlightThread &&
      collapsedThreadRef.current &&
      scrollContainerContext.scrollContainerRef.current
    ) {
      const scrollContainer = scrollContainerContext.scrollContainerRef.current;
      scrollContainer.scrollTo({
        top: collapsedThreadRef.current.offsetTop - EXTRA_PADDING_FOR_SCROLL,
        behavior: 'smooth',
      });
    }
  }, [highlightThread, scrollContainerContext.scrollContainerRef]);

  // Collapsed threads shouldn't mark messages as seen
  const doNotMarkMessagesAsSeenRef = useRef(null);

  const { logWarning } = useLogger();

  if (!thread.messages[0]) {
    logWarning('No messages found for collapsed thread', {
      threadID: thread.id,
    });
    return null;
  }

  return (
    <MessageSeenObserverProvider
      containerRef={doNotMarkMessagesAsSeenRef}
      disabled
    >
      <Box2
        padding="3xs"
        position="relative"
        borderColor="base-x-strong"
        borderRadius="medium"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        cssVariablesOverride={cssOverrideContext.inlineThread}
        className={cx(
          classes.thread,
          hoverClasses.resolvedThreadHover,
          hoverClasses.collapsedThread,
          {
            [classes.highlighted]: highlightThread,
            [MODIFIERS.highlighted]: highlightThread,
          },
        )}
        forwardRef={collapsedThreadRef}
      >
        {threadHeader}
        <Message2
          message={thread.messages[0]}
          isFirstMessageOfBlock={true}
          threadHeaderPresent={Boolean(threadHeader)}
          showMessageOptions={showMessageOptions}
          showThreadOptions={showThreadOptions}
        />
        {!excludeFooter && (
          <CollapsedThreadFooter2
            newMessageCount={newMessageCount}
            replyCount={thread.replyCount}
            hoveringOverThread={hover}
            allowReply={allowReply}
          />
        )}
      </Box2>
    </MessageSeenObserverProvider>
  );
}
