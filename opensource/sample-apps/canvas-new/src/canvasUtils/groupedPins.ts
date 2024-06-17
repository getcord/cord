import type { Stage } from 'konva/lib/Stage';
import type { Point2D } from '@cord-sdk/types';
import type { Pin } from './common';
import { getStageData, roundNumber } from './common';
import { getPinPositionOnStage } from './pin';

export const PROXIMITY_VALUE = 50;

function getGroupedPinsPositionOnStage(stage: Stage, pins: Pin[]) {
  const pinPositionsInGroup: Pin[] = [];
  pins.forEach((pin) => {
    const pinPosition = getPinPositionOnStage(stage, pin);
    if (pinPosition) {
      pinPositionsInGroup.push(pinPosition);
    }
  });

  const { averageX, averageY } = getAverageCoordsOfPins(pinPositionsInGroup);
  return { x: averageX, y: averageY };
}

export function expandGroupedPins(
  stage: Stage,
  pins: Pin[],
  stageCenter: Point2D,
) {
  const { scale: oldScale } = getStageData(stage);

  const largestDistanceOfClosestPins = findLargestDistanceCoordsOfPins(pins);

  const positionOnStage = getGroupedPinsPositionOnStage(stage, pins);

  // Calculate the middle of the grouped pins
  const newScale =
    oldScale / (largestDistanceOfClosestPins / (PROXIMITY_VALUE + 10));

  const newStagePosition = {
    x: roundNumber(stageCenter.x - (positionOnStage.x / oldScale) * newScale),
    y: roundNumber(stageCenter.y - (positionOnStage.y / oldScale) * newScale),
  };

  return {
    newScale,
    newStagePosition,
  };
}

function calculateDistance(point1: Pin, point2: Pin) {
  const x1 = point1.x;
  const y1 = point1.y;
  const x2 = point2.x;
  const y2 = point2.y;
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function findClosestPins(pinsArray: Pin[]) {
  let minDistance = Infinity;
  let closestPins = null;

  for (let i = 0; i < pinsArray.length; i++) {
    for (let j = i + 1; j < pinsArray.length; j++) {
      const distance = calculateDistance(pinsArray[i], pinsArray[j]);
      if (distance < minDistance) {
        minDistance = distance;
        closestPins = [pinsArray[i], pinsArray[j]];
      }
    }
  }

  return closestPins;
}

export function findLargestDistanceCoordsOfPins(pins: Pin[]) {
  const closestPins = findClosestPins(pins);
  const pinsX: number[] = [];
  const pinsY: number[] = [];
  if (!closestPins) {
    return 0;
  }

  closestPins.forEach((pin) => {
    pinsX.push(pin.x);
    pinsY.push(pin.y);
  });
  return Math.max(findMaxDistance(pinsX), findMaxDistance(pinsY));
}

function findMaxDistance(numbers: number[]) {
  if (numbers.length < 2) {
    throw new Error('The array should contain at least two numbers.');
  }

  // Sort the array in ascending order
  numbers.sort((a, b) => a - b);

  let maxDistance = Number.NEGATIVE_INFINITY;

  // Calculate the difference between adjacent elements and find the maximum difference
  for (let i = 1; i < numbers.length; i++) {
    const diff = Math.abs(numbers[i] - numbers[i - 1]);
    if (diff > maxDistance) {
      maxDistance = diff;
    }
  }

  return roundNumber(maxDistance);
}

export function getAverageCoordsOfPins(pins: Pin[]) {
  let totalX = 0;
  let totalY = 0;

  pins.forEach((pin) => {
    totalX += pin.x;
    totalY += pin.y;
  });

  const average = {
    averageX: roundNumber(totalX / pins.length),
    averageY: roundNumber(totalY / pins.length),
  };
  return average;
}
