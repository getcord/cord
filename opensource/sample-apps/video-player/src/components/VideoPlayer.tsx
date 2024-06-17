import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import cx from 'classnames';
import {
  ThreadedComments,
  PagePresence,
  NotificationListLauncher,
  thread,
} from '@cord-sdk/react';
import type { Location, MessageInfo, Point2D } from '@cord-sdk/types';
import { ThreadsProvider, ThreadsContext } from '../ThreadsContext';
import { useMutationObserver } from '../hooks/useMutationObserver';
import { CustomControls } from './CustomControls';
import { useAddTimestamp } from './useAddTimestamp';
import { VideoPin, isPinWithinInterval } from './VideoPin';

const LOCATION = { page: 'video' };
const HOVERED_COMPONENT_ATTRIBUTE_NAME = 'data-hovered-component';
export const SAMPLE_GROUP_ID = 'my-first-group';

export function VideoPlayer({
  video,
  delayAutofocus = false,
}: {
  video: string;
  delayAutofocus?: boolean;
}) {
  return (
    <ThreadsProvider location={LOCATION} delayAutofocus={delayAutofocus}>
      <CommentableVideo video={video} location={LOCATION} />
    </ThreadsProvider>
  );
}

/**
 * A clickable video, which will record the position and timestamp of the click.
 */
function CommentableVideo({
  video,
  location,
}: {
  video: string;
  location: Location;
}) {
  const {
    threads,
    addThread,
    removeThread,
    setOpenThread,
    openThread,
    allowAutofocus,
  } = useContext(ThreadsContext)!;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // Keeping video related state in our components State to trigger re-renders.
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  // Add a tooltip following the cursor when hovering on the video.
  const [cursorTooltipPosition, setCursorTooltipPosition] =
    useState<Point2D | null>(null);
  const [cursorTooltipText, setCursorTooltipText] = useState<
    'Click to comment' | 'Click to resume'
  >(isPlaying ? 'Click to comment' : 'Click to resume');
  // We want to know if there are any resolved threads at LOCATION,
  // so we can show ThreadedComments  "Resolved" tab only if there
  // are any resolved threads.
  const threadCounts = thread.useThreadCounts({
    filter: { location: LOCATION },
  });
  const [highlightedComponent, setHighlightedComponent] = useState<
    string | null
  >(null);

  // When users add a new comment, we'll add the current timestamp
  // to their message.
  useAddTimestamp();

  // The following callback, useMutationObserver and useEffect
  // only exist for the Cord demo. They are used to highlight
  // components.
  // They are not necessary if you are building this yourself!
  const rootDiv = document.getElementById('root');
  const handleHoveredAttributeChange: MutationCallback = useCallback(
    (mutations: MutationRecord[]) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === HOVERED_COMPONENT_ATTRIBUTE_NAME &&
          rootDiv
        ) {
          const attributeValue = rootDiv.getAttribute(
            HOVERED_COMPONENT_ATTRIBUTE_NAME,
          );
          setHighlightedComponent(attributeValue);
        }
      });
    },
    [rootDiv],
  );
  useMutationObserver(rootDiv, handleHoveredAttributeChange);

  // Because the odds of not having a thread in view are quite high
  // in this demo, if one is not open, we open and bring into view a
  // random thread to showcase the Pin and Thread component when
  // highlighting any of the two.
  useEffect(() => {
    const highlightedPinOrThread =
      highlightedComponent === 'cord-thread' ||
      highlightedComponent === 'cord-pin';

    if (!threads.size || !highlightedPinOrThread || !videoRef.current) {
      return;
    }

    const threadArray = Array.from(threads);
    const pinInView = threadArray.find(([_, { metadata }]) => {
      return isPinWithinInterval(
        metadata.timestamp,
        videoRef.current!.currentTime,
      );
    });

    // If the video is not at a timestamp where we have a pin, we choose a
    // random one to bring into view (We've already checked that there's
    // at least one thread above).
    const [
      _,
      {
        metadata: { timestamp },
      },
    ] = threadArray[0];

    if (!pinInView) {
      videoRef.current.pause();
      videoRef.current.currentTime = timestamp;
    }
  }, [highlightedComponent, threads]);

  const handleCloseThread = useCallback(() => {
    if (!openThread) {
      return;
    }

    if (threads.get(openThread)?.totalMessages === 0) {
      removeThread(openThread);
    }
    setOpenThread(null);
  }, [openThread, removeThread, setOpenThread, threads]);

  const onVideoClick = useCallback(
    (e: React.MouseEvent<HTMLVideoElement>) => {
      if (!videoRef.current) {
        return;
      }
      if (!(e.target instanceof HTMLVideoElement)) {
        return;
      }

      // Toggle the video play/pause, just like you'd expect
      if (videoRef.current.paused) {
        void videoRef.current.play();
      } else {
        videoRef.current.pause();
      }

      // We either close the currently open thread..
      if (openThread) {
        handleCloseThread();
        return;
      }
      // ..Or create a new thread!
      e.preventDefault();
      const rect = e.target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const timestamp = videoRef.current.currentTime;
      const threadID = `video-thread-${x}-${y}-${timestamp}`;
      addThread(
        threadID,
        {
          // We store a percentage of where the user has clicked,
          // so we can show the Pin in the right spot no matter
          // what are the dimensions of the video.
          xPercent: (x / rect.width) * 100,
          yPercent: (y / rect.height) * 100,
          timestamp,
        },
        0,
      );
      setOpenThread(threadID);
    },
    [videoRef, openThread, addThread, setOpenThread, handleCloseThread],
  );

  // This is a browser native callback. I.e. the browser will call this when
  //  the time of the video is updated.
  // We update our internal state, which triggers a re-render and e.g.
  // updates our CustomControls bar.
  const onVideoTimeUpdate = useCallback(() => {
    if (!videoRef.current) {
      return;
    }
    setCurrentTime(videoRef.current.currentTime);
    setDuration(videoRef.current.duration);
  }, [videoRef]);
  // OnPlay/Pause are also browser native callbacks.
  const onVideoPlay = useCallback(() => {
    setIsPlaying(true);
    setCursorTooltipText('Click to comment');
    handleCloseThread();
  }, [handleCloseThread]);
  const onVideoPause = useCallback(() => {
    setIsPlaying(false);
    setCursorTooltipText('Click to resume');
  }, []);

  const onMessageFocus = useCallback(
    (threadID: string, _messageID?: string) => {
      if (!videoRef.current) {
        return;
      }
      const threadMetadata = threads.get(threadID)?.metadata;
      if (!threadMetadata) {
        console.log(`Thread ${threadID} not found`);
        return;
      }

      videoRef.current.currentTime = threadMetadata.timestamp;
      videoRef.current.pause();
      setOpenThread(threadID);
    },
    [videoRef, setOpenThread, threads],
  );

  // Let's connect ThreadedComments to the video! Clicking on
  // a message in ThreadedComment will move the video time to
  // the timestamp of that message, and open the thread.
  const onMessageClick = useCallback(
    (mi: MessageInfo) => {
      onMessageFocus(mi.threadId, mi.messageId);
    },
    [onMessageFocus],
  );

  const onComposerFocus = useCallback(
    ({ threadId }: { threadId: string }) => {
      onMessageFocus(threadId);
    },
    [onMessageFocus],
  );

  // Close open thread when users press ESCAPE
  const handlePressEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseThread();
      }
    },
    [handleCloseThread],
  );

  useEffect(() => {
    document.addEventListener('keydown', handlePressEscape);
    return () => document.removeEventListener('keydown', handlePressEscape);
  }, [handlePressEscape]);

  // When hovering on the video, we want to show the cursor tooltip.
  const handleMouseMoveOnCommentableElement = useCallback(
    ({ clientX: x, clientY: y }: React.MouseEvent<HTMLVideoElement>) => {
      setCursorTooltipPosition({ x, y });
    },
    [],
  );
  const handleLeaveCommentableElement = useCallback(
    () => setCursorTooltipPosition(null),
    [],
  );
  // `mousemove` events on the video are not triggered when scrolling.
  // We listen for `wheel` events, check whether we're above the video, and
  // show the cursor tooltip accordingly
  const handleWheel = useCallback(({ clientX: x, clientY: y }: MouseEvent) => {
    const hoveredElement = document.elementFromPoint(x, y);
    if (hoveredElement instanceof HTMLVideoElement) {
      setCursorTooltipPosition({ x, y });
    } else {
      setCursorTooltipPosition(null);
    }
  }, []);
  useEffect(() => {
    document.addEventListener('wheel', handleWheel, { passive: true });
    return () => document.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Changes the time of the video. E.g. updateCurrentTime(0) makes
  // the video start from the beginning.
  const updateCurrentTime = useCallback(
    (newTimeSeconds: number) => {
      if (!videoRef.current) {
        return;
      }
      videoRef.current.currentTime = newTimeSeconds;
    },
    [videoRef],
  );

  const isVideoReadyRef = useRef(false);
  const handleReadyToPlay = useCallback(() => {
    // Set up our internal state.
    onVideoTimeUpdate();

    isVideoReadyRef.current = true;
  }, [onVideoTimeUpdate]);

  return (
    <>
      <div id="video-player-demo-container">
        {/* Used to catch clicks outside the thread, and close it. */}
        <div
          className="thread-underlay"
          style={{
            display: openThread !== null ? 'block' : 'none',
          }}
          onClick={handleCloseThread}
        />
        <div id="top-bar">
          <PagePresence groupId={SAMPLE_GROUP_ID} location={location} />
          <NotificationListLauncher
            label="Notifications"
            onClickNotification={(e, { message }) => {
              e.preventDefault();
              message && onMessageFocus(message.threadID, message.id);
            }}
          />
        </div>
        <div id="content">
          <div id="commentableVideo">
            <div
              id="videoWrapper"
              className={cx({ ['ready']: isVideoReadyRef.current })}
            >
              <video
                ref={videoRef}
                disablePictureInPicture
                controlsList="nofullscreen"
                onClick={onVideoClick}
                onTimeUpdate={onVideoTimeUpdate}
                onCanPlay={handleReadyToPlay}
                src={video}
                muted={isVideoMuted}
                onMouseMove={handleMouseMoveOnCommentableElement}
                onMouseLeave={handleLeaveCommentableElement}
                onPause={onVideoPause}
                onPlay={onVideoPlay}
              ></video>
              <CustomControls
                duration={duration}
                currentTime={currentTime}
                isPlaying={isPlaying}
                muted={isVideoMuted}
                onPlay={() => videoRef.current?.play()}
                onPause={() => videoRef.current?.pause()}
                onToggleMute={() => setIsVideoMuted((prev) => !prev)}
                onSeek={updateCurrentTime}
              />
              {Array.from(threads).map(([key, { metadata }]) => {
                return (
                  <VideoPin
                    key={key}
                    id={key}
                    location={location}
                    metadata={metadata}
                    currentTime={currentTime}
                    duration={duration}
                  />
                );
              })}
            </div>
          </div>
          <ThreadedComments
            groupId={SAMPLE_GROUP_ID}
            location={location}
            composerPosition="none"
            messageOrder="newest_on_top"
            showPlaceholder={false}
            onMessageClick={onMessageClick}
            highlightThreadId={
              allowAutofocus && openThread ? openThread : undefined
            }
            displayResolved={
              (threadCounts?.resolved ?? 0) > 0 ? 'tabbed' : 'unresolvedOnly'
            }
            onComposerFocus={onComposerFocus}
          />
        </div>
      </div>
      {cursorTooltipPosition && (
        <div
          className="cursor-tooltip"
          style={{
            left: `calc(16px + ${cursorTooltipPosition.x}px)`,
            top: `calc(20px + ${cursorTooltipPosition.y}px)`,
          }}
        >
          {cursorTooltipText}
        </div>
      )}
    </>
  );
}
