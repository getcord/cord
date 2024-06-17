import { useCallback, useEffect, useRef, useState } from 'react';
import cx from 'classnames';

import type { ThreadData } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { CollapsedThreadFooter } from 'external/src/components/ui3/thread/CollapsedThreadFooter.tsx';
import { Message2 } from 'external/src/components/2/Message2.tsx';
import { MessageSeenObserverProvider } from 'external/src/context/messageSeenObserver/MessageSeenObserverProvider.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { useShowThreadListHighlight } from 'external/src/effects/useShowThreadListHighlight.ts';
import { ScrollContainerContext } from 'external/src/context/scrollContainer/ScrollContainerContext.ts';
import { Sizes } from 'common/const/Sizes.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { MODIFIERS } from 'common/ui/modifiers.ts';

import * as classes from 'external/src/components/ui3/thread/CollapsedThread.css.ts';

const EXTRA_PADDING_FOR_SCROLL = Sizes.XLARGE;

type Props = {
  thread: ThreadData;
  threadHeader?: JSX.Element;
  allowReply: boolean;
  showMessageOptions: boolean;
  showThreadOptions: boolean;
};

export function CollapsedThreadComponent({
  thread,
  threadHeader,
  allowReply,
  showMessageOptions,
  showThreadOptions,
}: Props) {
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
      <div
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={cx(classes.collapsedThread, {
          [MODIFIERS.highlighted]: highlightThread,
        })}
        ref={collapsedThreadRef}
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
          <CollapsedThreadFooter
            newMessageCount={newMessageCount}
            replyCount={thread.replyCount}
            hoveringOverThread={hover}
            allowReply={allowReply}
          />
        )}
      </div>
    </MessageSeenObserverProvider>
  );
}
