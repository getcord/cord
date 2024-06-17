import { useCallback, useEffect, useMemo, useState } from 'react';
import { ANNOTATION_ARROW_ON_ADD_MS } from 'common/const/Timing.ts';
import type { MessageAnnotation, Point2D } from 'common/types/index.ts';
import { EmbedContext } from 'external/src/context/embed/EmbedContext.ts';
import { useUpdatingRef } from 'external/src/effects/useUpdatingRef.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

type Props = {
  editorFocused: boolean;
  annotation: MessageAnnotation | undefined;
  getStartPosition: () => Point2D;
};

export function useAnnotationArrow({
  editorFocused,
  annotation,
  getStartPosition,
}: Props) {
  const [arrowShowing, setArrowShowing] = useState(true);

  const { drawArrowToAnnotation, removeAnnotationArrow } =
    useContextThrowingIfNoProvider(EmbedContext);

  // When annotation added, show arrow for 2 seconds before fading out
  useEffect(() => {
    setTimeout(() => {
      setArrowShowing(false);
    }, ANNOTATION_ARROW_ON_ADD_MS);
  }, []);

  useEffect(() => {
    // Hide arrow on editor losing focus
    if (!editorFocused) {
      setArrowShowing(false);
    }
  }, [editorFocused]);

  // Ref avoids this effect being called when attachment finishes uploading (--> annotation updates)
  const annotationRef = useUpdatingRef(annotation);

  useEffect(() => {
    const currentAnnotationRef = annotationRef.current;
    if (!currentAnnotationRef) {
      return;
    }

    return () => removeAnnotationArrow(currentAnnotationRef);
  }, [removeAnnotationArrow, annotationRef]);

  useEffect(() => {
    if (!annotationRef.current) {
      return;
    }
    if (arrowShowing) {
      drawArrowToAnnotation(annotationRef.current, getStartPosition());
    } else {
      removeAnnotationArrow(annotationRef.current);
    }
  }, [
    annotationRef,
    arrowShowing,
    drawArrowToAnnotation,
    getStartPosition,
    removeAnnotationArrow,
  ]);

  const showArrow = useCallback(() => {
    setArrowShowing(true);
  }, []);

  const hideArrow = useCallback(() => {
    setArrowShowing(false);
  }, []);

  return useMemo(
    () => ({
      arrowShowing,
      showArrow,
      hideArrow,
    }),
    [showArrow, arrowShowing, hideArrow],
  );
}
