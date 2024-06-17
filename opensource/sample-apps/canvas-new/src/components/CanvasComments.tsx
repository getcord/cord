import cx from 'classnames';
import type { Point2D } from '@cord-sdk/types';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Avatar } from '@cord-sdk/react';
import { CanvasAndCommentsContext } from '../CanvasAndCommentsContext';
import type { Pin } from '../canvasUtils/common';
import { GROUPED_PINS_CLASS_NAME } from '../canvasUtils/common';
import {
  getAverageCoordsOfPins,
  expandGroupedPins,
  PROXIMITY_VALUE,
} from '../canvasUtils/groupedPins';
import { CanvasComment } from './CanvasComment';

function arePinsClose(pin1: Point2D, pin2: Point2D) {
  return (
    Math.abs(pin1.x - pin2.x) < PROXIMITY_VALUE &&
    Math.abs(pin1.y - pin2.y) < PROXIMITY_VALUE
  );
}

function findGroupForPin(pin: Pin, groups: Pin[][]) {
  for (const group of groups) {
    const { averageX, averageY } = getAverageCoordsOfPins(group);
    if (arePinsClose(pin, { x: averageX, y: averageY })) {
      return group;
    }
  }
  return null;
}

export function CanvasComments() {
  const { threads, openThread } = useContext(CanvasAndCommentsContext)!;

  const pins = useMemo(
    () => Array.from(threads).map(([_id, pin]) => pin),
    [threads],
  );

  const pinsGroupedByProximity = useMemo(() => {
    const groups: Pin[][] = [];

    for (const pin of pins) {
      const pinGroup = findGroupForPin(pin, groups);
      const isDraftPin =
        pin.threadID === openThread?.threadID && openThread?.empty;
      if (pinGroup && !isDraftPin) {
        pinGroup.push(pin);
      } else {
        groups.push([pin]);
      }
    }

    return groups;
  }, [openThread?.empty, openThread?.threadID, pins]);

  return pinsGroupedByProximity.map((pinsInGroup, index) => {
    if (pinsInGroup.length === 1) {
      const pin = pinsInGroup[0];
      return <CanvasComment key={`grouped-pins-${index}`} pin={pin} />;
    } else {
      return (
        <CanvasCommentGroup pins={pinsInGroup} key={`grouped-pins-${index}`} />
      );
    }
  });
}

function CanvasCommentGroup({ pins }: { pins: Pin[] }) {
  const {
    openThread,
    isPanningCanvas,
    removeThreadIfEmpty,
    setOpenThread,
    canvasStageRef,
    recomputePinPositions,
    zoomAndCenter,
  } = useContext(CanvasAndCommentsContext)!;
  const [isHoveringOverGroup, setIsHoveringOverGroup] = useState(false);

  useEffect(() => {
    if (pins.find((pin) => pin.threadID === openThread?.threadID)) {
      setOpenThread(null);
    }
  }, [openThread?.threadID, pins, setOpenThread]);

  const onGroupClick = useCallback(() => {
    removeThreadIfEmpty(openThread);
    setOpenThread(null);
    const stage = canvasStageRef.current;
    if (!stage) {
      return;
    }

    const stageHeight = stage.height();
    const stageWidth = stage.width();

    const stageCenter = {
      x: stageWidth / 2,
      y: stageHeight / 2,
    };

    const { newScale, newStagePosition: center } = expandGroupedPins(
      stage,
      pins,
      stageCenter,
    );
    zoomAndCenter({ newScale, center, animate: true });
    recomputePinPositions();
  }, [
    canvasStageRef,
    openThread,
    pins,
    recomputePinPositions,
    removeThreadIfEmpty,
    setOpenThread,
    zoomAndCenter,
  ]);

  const { averageX, averageY } = getAverageCoordsOfPins(pins);

  const threadAuthorsList = pins.map(
    (pin) => pin.thread.firstMessage?.authorID,
  );
  const uniqueThreadAuthors = [...new Set(threadAuthorsList)];
  // The ghost Avatar is used when all thread authors in a group
  // are the same user.
  const showGhost =
    uniqueThreadAuthors.length === 1 && threadAuthorsList.length > 1;

  const handleStartHoverOverGroup = useCallback(
    () => setIsHoveringOverGroup(true),
    [],
  );
  const handleStopHoverOverGroup = useCallback(
    () => setIsHoveringOverGroup(false),
    [],
  );

  const groupedAuthorAvatars = uniqueThreadAuthors
    .slice(0, 3)
    .map((userId, _, slicedArray) =>
      userId ? (
        <Avatar
          key={userId}
          className={cx('groupedAvatar', {
            ['oneTotalAvatar']: slicedArray.length === 1,
            ['twoTotalAvatars']: slicedArray.length === 2,
            ['threeTotalAvatars']: slicedArray.length === 3,
          })}
          userId={userId}
        />
      ) : null,
    );

  return (
    <>
      <div
        id={pins.map((pin) => pin.threadID).join('/')}
        className={cx(GROUPED_PINS_CLASS_NAME, {
          ['totalPinsNumber']: isHoveringOverGroup,
        })}
        role="button"
        style={{
          left: averageX,
          top: averageY,
          pointerEvents: isPanningCanvas ? 'none' : 'auto',
        }}
        onClick={onGroupClick}
        onMouseEnter={handleStartHoverOverGroup}
        onMouseLeave={handleStopHoverOverGroup}
      >
        {isHoveringOverGroup ? (
          <p>{pins.length}</p>
        ) : (
          <>
            {showGhost && (
              <Avatar
                className={cx('groupedAvatar', 'ghost')}
                userId={uniqueThreadAuthors[0]!}
              />
            )}
            {groupedAuthorAvatars}
          </>
        )}
      </div>
    </>
  );
}
