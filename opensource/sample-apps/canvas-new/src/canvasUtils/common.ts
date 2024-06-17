import type { Stage } from 'konva/lib/Stage';
import type { ThreadSummary } from '@cord-sdk/types';

export const EXAMPLE_CORD_LOCATION = {
  page: 'canvas-new',
};

export const GROUPED_PINS_CLASS_NAME = 'groupedPins';

export type ThreadMetadata = {
  elementName: string;
  relativeX: number;
  relativeY: number;
};

export type CanvasThreadData = Pick<ThreadSummary, 'firstMessage' | 'total'> & {
  metadata: ThreadMetadata;
};

/**
 * x and y help us position the pins on the viewport (so when we pan, zoom, drag
 * shapes etc) where as relativeX and relativeY are purely to know the exact size
 * (at 1:1 scale) of the distance between pin position on the element.
 * That way we can calculate x, y.
 */
export type Pin = {
  threadID: string;
  thread: CanvasThreadData;
  x: number;
  y: number;
  repliers: string[];
};

export type OpenThread = {
  threadID: string;
  empty: boolean;
} | null;

export function getStageData(stage: Stage) {
  const { x, y } = stage.getPosition();
  const scale = stage.scaleX();
  const stagePointerPosition = stage.getPointerPosition() ?? { x: 0, y: 0 };
  return { stageX: x, stageY: y, scale, stagePointerPosition };
}

export function roundNumber(number: number) {
  return Number(number.toPrecision(4));
}

export function extractDataFromThreadMetadata(
  metadata: ThreadSummary['metadata'],
): ThreadMetadata | null {
  if (
    !('elementName' in metadata) ||
    typeof metadata['elementName'] !== 'string'
  ) {
    return null;
  }

  if (!('relativeX' in metadata) || typeof metadata['relativeX'] !== 'number') {
    return null;
  }

  if (!('relativeY' in metadata) || typeof metadata['relativeY'] !== 'number') {
    return null;
  }

  return {
    elementName: metadata.elementName,
    relativeX: metadata.relativeX,
    relativeY: metadata.relativeY,
  };
}
export const SAMPLE_GROUP_ID = 'my-first-group';
