import type * as React from 'react';
import { useCallback } from 'react';
import type { MessageAnnotation, Point2D } from 'common/types/index.ts';
import { EmbedContext } from 'external/src/context/embed/EmbedContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

// This is a hook just to avoid repeating the same custom logic in two places
// (AnnotationElement and MessageAnnotationElement)
export function useScrollToAndShowAnnotation(
  annotation: MessageAnnotation | undefined,
  getStartPosition: () => Point2D,
  focusRef: React.MutableRefObject<boolean>,
) {
  const {
    scrollToAnnotation,
    showAnnotation,
    hideAnnotation,
    drawArrowToAnnotation,
  } = useContextThrowingIfNoProvider(EmbedContext);

  return useCallback(async () => {
    if (!annotation) {
      return;
    }
    await scrollToAnnotation(annotation);
    showAnnotation(annotation);
    if (focusRef.current) {
      // If mouse no longer over annotation, don't show arrow - just show pointer for 1 second
      drawArrowToAnnotation(annotation, getStartPosition());
    } else {
      setTimeout(() => {
        if (!focusRef.current) {
          hideAnnotation(annotation);
        }
      }, 1000);
    }
  }, [
    annotation,
    drawArrowToAnnotation,
    focusRef,
    getStartPosition,
    hideAnnotation,
    scrollToAnnotation,
    showAnnotation,
  ]);
}
