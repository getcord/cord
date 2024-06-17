import { v4 as uuid } from 'uuid';
import type { Stage } from 'konva/lib/Stage';
import type { ThreadSummary } from '@cord-sdk/types';
import {
  roundNumber,
  extractDataFromThreadMetadata,
  getStageData,
} from './common';
import type { CanvasThreadData, Pin, ThreadMetadata } from './common';

export function createNewPin({
  threadMetadata,
  x,
  y,
}: {
  threadMetadata: ThreadMetadata;
  x: number;
  y: number;
}): Pin {
  return {
    threadID: uuid(),
    thread: {
      metadata: threadMetadata,
      firstMessage: null,
      total: 0,
    },
    repliers: [],
    x: roundNumber(x),
    y: roundNumber(y),
  };
}

export function getPinFromThread(
  stage: Stage,
  thread: ThreadSummary,
): Pin | null {
  const metadata = extractDataFromThreadMetadata(thread.metadata);
  if (!metadata) {
    return null;
  }
  return computePinPosition(
    stage,
    thread.id,
    { ...thread, metadata },
    thread.repliers,
    true,
  );
}

export function computePinPosition(
  stage: Stage,
  threadID: string,
  thread: CanvasThreadData,
  repliers: string[],
  // Including the stage means we are calculating where the new pin position
  // should be otherwise we are getting the position of the existing pin
  includeStageCoords: boolean,
): Pin | null {
  const { elementName, relativeX, relativeY } = thread.metadata;

  const { stageX, stageY, scale } = getStageData(stage);

  let pinX, pinY: number;

  if (elementName === 'stage') {
    pinX = relativeX * scale;
    pinY = relativeY * scale;
  } else {
    const node = stage.findOne(`.${elementName}`);
    if (!node) {
      return null;
    }

    const elementPosition = node.getPosition();

    pinX = (elementPosition.x + relativeX) * scale;
    pinY = (elementPosition.y + relativeY) * scale;
  }

  if (includeStageCoords) {
    pinX = pinX + stageX;
    pinY = pinY + stageY;
  }

  return {
    threadID,
    thread,
    repliers,
    x: roundNumber(pinX),
    y: roundNumber(pinY),
  };
}

export function updatePinPositionOnStage(stage: Stage, pin: Pin) {
  return computePinPosition(
    stage,
    pin.threadID,
    pin.thread,
    pin.repliers,
    true,
  );
}

export function getPinPositionOnStage(stage: Stage, pin: Pin) {
  return computePinPosition(
    stage,
    pin.threadID,
    pin.thread,
    pin.repliers,
    false,
  );
}

export function getPinElementOnStage(threadID: string) {
  return document.querySelector(`div[id*="${threadID}"]`);
}

// TODO - tweak to avoid header
export function isPinInView(stage: Stage, pinElement: Element | null) {
  if (!pinElement) {
    throw new Error('Pin does not exist');
  }

  // Gets position relative to the viewport
  const pinRects = pinElement?.getBoundingClientRect();

  if (!pinRects) {
    return false;
  }
  // Buffer of 50px around the left and right edges, and remove additional 300
  // for the comments list
  if (pinRects.x < 50 || pinRects.x > stage.width() - 300 + 50) {
    return false;
  }

  // Buffer of 100px on the top and bottom
  if (pinRects.y < 100 || pinRects.y > stage.height() - 100) {
    return false;
  }

  return true;
}
