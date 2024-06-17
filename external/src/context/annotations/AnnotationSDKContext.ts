import { createContext } from 'react';
import type { Location } from '@cord-sdk/types';
import type {
  LocationMatch,
  Annotation,
  AnnotationWithThreadID,
  AnnotationCapturePosition,
  Point2D,
} from 'common/types/index.ts';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

export type AnnotationSDKContextType = {
  getAnnotationPosition: (
    annotation: Annotation,
    coordsRelativeToTarget: Point2D,
  ) => {
    match: LocationMatch;
    x?: number;
    y?: number;
    element?: HTMLElement;
    elementRect?: DOMRect;
  };
  getAnnotationPositionStrict: (
    annotation: Annotation,
    coordsRelativeToTarget: Point2D,
  ) => {
    match: LocationMatch;
    x?: number;
    y?: number;
    elementRect?: DOMRect;
  };
  onAnnotationCapture: (
    location: Location,
    capturePosition: AnnotationCapturePosition,
    element: HTMLElement,
  ) =>
    | {
        extraLocation?: Location;
        label?: string;
      }
    | undefined
    | void;
  onAnnotationClick: (annotation: AnnotationWithThreadID) => unknown;
};

export const AnnotationSDKContext = createContext<
  AnnotationSDKContextType | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);
