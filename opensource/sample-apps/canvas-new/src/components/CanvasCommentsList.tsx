import { useCallback, useContext } from 'react';
import { ThreadedComments } from '@cord-sdk/react';
import type { MessageInfo } from '@cord-sdk/types';
import type { Stage } from 'konva/lib/Stage';
import { CanvasAndCommentsContext } from '../CanvasAndCommentsContext';
import {
  getPinElementOnStage,
  getPinPositionOnStage,
} from '../canvasUtils/pin';
import {
  EXAMPLE_CORD_LOCATION,
  GROUPED_PINS_CLASS_NAME,
  SAMPLE_GROUP_ID,
} from '../canvasUtils/common';
import { expandGroupedPins } from '../canvasUtils/groupedPins';

function getStageCenter(stage: Stage) {
  return {
    x: stage.width() / 2,
    y: stage.height() / 2,
  };
}

export function CanvasCommentsList() {
  const {
    threads,
    canvasStageRef,
    setOpenThread,
    recomputePinPositions,
    openThread,
    zoomAndCenter,
  } = useContext(CanvasAndCommentsContext)!;

  const navigateToGroupPin = useCallback(
    (pinElement: Element, stage: Stage, threadID: string) => {
      const groupedPinsThreadIDs = pinElement.id.split('/');

      const pinsInGroup = Array.from(threads)
        .filter(([id]) => groupedPinsThreadIDs.includes(id))
        .map(([_, pinThread]) => pinThread);
      const { newStagePosition: center, newScale } = expandGroupedPins(
        stage,
        pinsInGroup,
        getStageCenter(stage),
      );
      zoomAndCenter({
        newScale,
        center,
        animate: true,
        onFinish: () => setOpenThread({ threadID, empty: false }),
      });
    },
    [setOpenThread, threads, zoomAndCenter],
  );

  const navigateToPin = useCallback(
    (messageInfo: MessageInfo) => {
      const stage = canvasStageRef.current;
      if (!stage) {
        return;
      }

      const foundPin = threads.get(messageInfo.threadId);
      if (!foundPin) {
        console.warn('Could not find pin on the page');
        return;
      }

      const pinElement = getPinElementOnStage(messageInfo.threadId);
      if (!pinElement) {
        console.warn('Could not find pin on the page');
        return;
      }
      const isGroupPin = pinElement?.classList.contains(
        GROUPED_PINS_CLASS_NAME,
      );

      if (isGroupPin) {
        navigateToGroupPin(pinElement, stage, messageInfo.threadId);
      } else {
        const pinPositionOnStage = getPinPositionOnStage(stage, foundPin);

        if (!pinPositionOnStage) {
          return;
        }

        const stageCenter = getStageCenter(stage);
        canvasStageRef.current.to({
          x: stageCenter.x - pinPositionOnStage.x,
          y: stageCenter.y - pinPositionOnStage.y,
          duration: 0.2,
          onUpdate: () => {
            setOpenThread(null);
            recomputePinPositions();
          },
          onFinish: () =>
            setOpenThread({ threadID: foundPin.threadID, empty: false }),
        });
      }
    },
    [
      threads,
      canvasStageRef,
      recomputePinPositions,
      setOpenThread,
      navigateToGroupPin,
    ],
  );

  const handleMessageClick = useCallback(
    (messageInfo: MessageInfo) => {
      if (openThread?.threadID === messageInfo.threadId) {
        setOpenThread(null);
      } else {
        navigateToPin(messageInfo);
      }
    },
    [navigateToPin, openThread?.threadID, setOpenThread],
  );

  return (
    <ThreadedComments
      groupId={SAMPLE_GROUP_ID}
      location={EXAMPLE_CORD_LOCATION}
      composerPosition="none"
      onMessageClick={handleMessageClick}
      showReplies="alwaysCollapsed"
      highlightThreadId={openThread?.threadID}
      messageOrder="newest_on_top"
      displayResolved="tabbed"
    />
  );
}
