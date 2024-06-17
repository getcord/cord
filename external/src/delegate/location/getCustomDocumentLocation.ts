import type { Location } from '@cord-sdk/types';

import type {
  AnnotationCapturePosition,
  HighlightedTextConfig,
} from 'common/types/index.ts';
import { isLocation } from 'common/types/index.ts';
import type { AnnotationSDKContextType } from 'external/src/context/annotations/AnnotationSDKContext.ts';

export function getCustomDocumentLocation({
  clickTarget,
  highlightedTextConfig,
  location,
  onAnnotationCapture,
  position,
}: {
  location: Location;
  position: AnnotationCapturePosition;
  clickTarget: HTMLElement;
  highlightedTextConfig: HighlightedTextConfig | null;
  onAnnotationCapture: AnnotationSDKContextType['onAnnotationCapture'];
}) {
  const { extraLocation, label } =
    onAnnotationCapture(location, position, clickTarget) ?? {};

  const currentTargetBox = position.element.getBoundingClientRect();

  return {
    location: null,
    customLocation: {
      ...location,
      ...(extraLocation && isLocation(extraLocation)
        ? extraLocation
        : undefined),
    },
    customHighlightedTextConfig: highlightedTextConfig,
    customLabel: label ?? highlightedTextConfig?.textToDisplay ?? null,
    coordsRelativeToTarget: {
      x: position.x / currentTargetBox.width,
      y: position.y / currentTargetBox.height,
    },
  };
}
