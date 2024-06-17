import { useRef, useCallback, useState } from 'react';
import cx from 'classnames';

const ICON_SIZE = 24;

export function CustomControls({
  duration,
  currentTime,
  isPlaying,
  muted,
  onPause,
  onPlay,
  onSeek,
  onToggleMute,
}: {
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  muted: boolean;
  onPlay: () => Promise<void> | undefined;
  onPause: () => void;
  onSeek: (newTime: number) => void;
  onToggleMute: () => void;
}) {
  // Local state so that dragging the thumb has 0 delay.
  const [seekXCoord, setSeekXCoord] = useState<number | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  const handleTogglePlaying = useCallback(() => {
    if (isPlaying) {
      onPause?.();
    } else {
      void onPlay?.();
    }
  }, [isPlaying, onPause, onPlay]);

  const getTimeAtCursor = useCallback(
    (cursorX: number) => {
      if (!progressRef.current) {
        return 0;
      }

      const { width, left, right } =
        progressRef.current.getBoundingClientRect();
      const safeCursorX = Math.min(Math.max(cursorX, left), right);
      return ((safeCursorX - left) / width) * duration;
    },
    [duration],
  );

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLElement> | MouseEvent) =>
      onSeek(getTimeAtCursor(e.clientX)),
    [getTimeAtCursor, onSeek],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      setSeekXCoord(e.clientX);
      handleSeek(e);
    },
    [handleSeek],
  );

  const handleStopSeeking = useCallback(() => {
    setSeekXCoord(null);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleStopSeeking);
  }, [handleMouseMove]);

  const handleStartSeeking = useCallback(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleStopSeeking);
  }, [handleMouseMove, handleStopSeeking]);

  const getProgressBarWidth = useCallback(() => {
    const time =
      seekXCoord !== null ? getTimeAtCursor(seekXCoord) : currentTime;
    return duration > 0 ? `${(time / duration) * 100}%` : 0;
  }, [currentTime, duration, getTimeAtCursor, seekXCoord]);

  return (
    <div className="custom-controls-container">
      <div className="custom-controls">
        <PlayButton
          isPlaying={isPlaying}
          handleTogglePlaying={handleTogglePlaying}
        />
        <span>{secondsToFormattedTimestamp(currentTime)}</span>
        <span className="duration">
          {!Number.isNaN(duration) &&
            ' / ' + secondsToFormattedTimestamp(duration)}
        </span>
        <MuteButton muted={muted} onToggleMute={onToggleMute} />
      </div>
      <div
        className={cx('timeline-container', {
          ['seeking']: seekXCoord !== null,
        })}
        onClick={handleSeek}
        onMouseDown={handleStartSeeking}
        ref={progressRef}
      >
        <div className="progress-bar-background" />
        <div
          className="progress-bar-foreground"
          style={{
            width: getProgressBarWidth(),
          }}
        />
      </div>
    </div>
  );
}

/**
 * Converts an amount of seconds to `hh:mm:ss` format.
 * @example
 * secondsToFormattedTimestamp(2061); // "34:21"
 */
export function secondsToFormattedTimestamp(durationSeconds: number) {
  const hrs = Math.floor(durationSeconds / 3600);
  const mins = Math.floor((durationSeconds % 3600) / 60);
  const secs = Math.floor(durationSeconds) % 60;

  let timestamp = '';
  if (hrs > 0) {
    timestamp += '' + hrs + ':' + (mins < 10 ? '0' : '');
  }
  timestamp += '' + mins + ':' + (secs < 10 ? '0' : '');
  timestamp += '' + secs;
  return timestamp;
}

function PlayButton({
  isPlaying,
  handleTogglePlaying,
}: {
  isPlaying: boolean;
  handleTogglePlaying: () => void;
}) {
  return (
    <svg
      className="play-pause-btn"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      height={ICON_SIZE}
      width={ICON_SIZE}
      onClick={handleTogglePlaying}
    >
      {isPlaying ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 5.25v13.5m-7.5-13.5v13.5"
        />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
        />
      )}
    </svg>
  );
}

function MuteButton({
  muted,
  onToggleMute,
}: {
  muted: boolean;
  onToggleMute: () => void;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="mute-btn"
      fill="white"
      width={ICON_SIZE}
      height={ICON_SIZE}
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      onClick={onToggleMute}
    >
      {muted ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.531V19.94a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.506-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.395C2.806 8.757 3.63 8.25 4.51 8.25H6.75z"
        />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
        />
      )}
    </svg>
  );
}
