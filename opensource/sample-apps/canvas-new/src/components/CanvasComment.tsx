import type { ThreadReactComponentProps } from '@cord-sdk/react';
import { Thread, Message, user, Facepile, Avatar } from '@cord-sdk/react';
import type { ThreadInfo } from '@cord-sdk/types';

import cx from 'classnames';

import { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { CanvasAndCommentsContext } from '../CanvasAndCommentsContext';
import { EXAMPLE_CORD_LOCATION, SAMPLE_GROUP_ID } from '../canvasUtils/common';
import type { Pin } from '../canvasUtils/common';

type CanvasCommentType = {
  pin: Pin;
};
const CANVAS_THREAD_MAX_HEIGHT = 400;

export function CanvasComment({ pin: { threadID, x, y } }: CanvasCommentType) {
  const userData = user.useViewerData();

  const {
    isPanningCanvas,
    setIsPanningCanvas,
    openThread,
    setOpenThread,
    threads,
    canvasContainerRef,
  } = useContext(CanvasAndCommentsContext)!;

  // Enable panning canvas while mouse is on an open thread
  const canvasCommentContainerRef = useRef<HTMLDivElement>(null);
  // Get the scroll height of the open thread so we can disable panning over
  // the thread if it's meant to be scrollable
  const scrollHeightOfOpenThread = useMemo(() => {
    // only run this if there's an open thread
    if (!openThread) {
      return;
    }
    const openThreadID = openThread.threadID;
    const threadScrollContainer = document.querySelector(
      `[data-cord-thread-id="${openThreadID}"] > .cord-inline-thread > .cord-scroll-container`,
    );

    return threadScrollContainer?.scrollHeight;
  }, [openThread]);

  const handleMouseWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      setIsPanningCanvas(true);
    },
    [setIsPanningCanvas],
  );
  useEffect(() => {
    const { current: canvasComment } = canvasCommentContainerRef;
    if (
      !canvasComment ||
      isPanningCanvas ||
      (scrollHeightOfOpenThread &&
        scrollHeightOfOpenThread > CANVAS_THREAD_MAX_HEIGHT)
    ) {
      return;
    }

    canvasComment.addEventListener('wheel', handleMouseWheel, {
      passive: false,
    });

    return () => {
      canvasComment.removeEventListener('wheel', handleMouseWheel);
    };
  }, [handleMouseWheel, isPanningCanvas, scrollHeightOfOpenThread]);

  // Calculate the best place to position the open thread for
  // visibility depending on how close the pin is to the canvas edges.
  const threadPositionOnCanvas = useMemo(() => {
    if (!canvasContainerRef.current) {
      return;
    }
    const canvasrect = canvasContainerRef.current.getBoundingClientRect();
    // the thread's default position is on the right-hand side of the pin so we only
    // need to know when we should position it on the left or top side.
    return {
      top: (y / canvasrect.height) * 100 > 50,
      left: (x / canvasrect.width) * 100 > 50,
    };
  }, [canvasContainerRef, y, x]);

  const threadData = useMemo(() => {
    const thread = threads.get(threadID);
    if (!thread) {
      throw new Error('Thread does not exist');
    }

    return thread;
  }, [threadID, threads]);

  const onThreadInfoChange: ThreadReactComponentProps['onThreadInfoChange'] =
    useCallback(
      (threadInfo: ThreadInfo) => {
        if (threadInfo.messageCount > 0 && openThread?.threadID === threadID) {
          setOpenThread({ threadID: threadID, empty: false });
        }
      },
      [openThread?.threadID, setOpenThread, threadID],
    );

  const onPinClick: React.MouseEventHandler<HTMLDivElement> =
    useCallback(() => {
      if (openThread?.threadID === threadID && !openThread.empty) {
        setOpenThread(null);
        return;
      }
      if (openThread?.threadID !== threadID) {
        setOpenThread({ threadID: threadID, empty: false });
        return;
      }
    }, [openThread, threadID, setOpenThread]);

  if (!userData || !threadData) {
    return null;
  }

  const firstMessageAuthorID = threadData.thread.firstMessage
    ? threadData.thread.firstMessage.authorID
    : userData.id;

  // Only show facepile in pin if repliers include other people than the thread author
  const threadOtherRepliersCount = threadData.repliers.filter(
    (id) => id !== firstMessageAuthorID,
  ).length;

  return (
    // Need the canvasComment wrapper so the pin can grow in size from the bottom
    <div
      className={cx('canvasComment', {
        ['panning']: isPanningCanvas,
      })}
      style={{
        position: 'absolute',
        left: x,
        top: y,
      }}
      ref={canvasCommentContainerRef}
    >
      <div
        id={threadID}
        className={cx('canvasPin', {
          ['previewMessage']:
            openThread?.threadID !== threadID && threadData.thread.firstMessage,
          ['active']: openThread?.threadID === threadID,
          ['no-repliers']: !threadOtherRepliersCount,
          ['one-replier']: threadOtherRepliersCount === 1,
          ['two-repliers']: threadOtherRepliersCount > 1,
        })}
        onClick={onPinClick}
      >
        {threadOtherRepliersCount ? (
          <Facepile
            users={[firstMessageAuthorID, ...threadData.repliers].slice(0, 3)}
          />
        ) : (
          <Avatar userId={firstMessageAuthorID} />
        )}
        {threadData.thread.firstMessage && (
          <Message
            threadId={threadID}
            messageId={threadData.thread.firstMessage.id}
          />
        )}
      </div>
      <Thread
        groupId={SAMPLE_GROUP_ID}
        location={EXAMPLE_CORD_LOCATION}
        threadId={threadID}
        metadata={threadData.thread.metadata}
        showHeader={false}
        showPlaceholder={false}
        className={cx({
          ['active']: openThread?.threadID === threadID,
          ['hidden']: openThread?.threadID !== threadID,
          ['thread-on-the-left']: threadPositionOnCanvas?.left,
          ['thread-on-the-top']: threadPositionOnCanvas?.top,
          ['empty']: openThread?.threadID === threadID && openThread.empty,
        })}
        onThreadInfoChange={onThreadInfoChange}
      />
    </div>
  );
}
