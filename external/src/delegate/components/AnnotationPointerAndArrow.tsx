import { useState, useEffect, useCallback, useMemo } from 'react';

import type { DelegateState } from 'external/src/context/delegate/DelegateContext.ts';
import { createAnnotationInstance } from 'external/src/delegate/annotations/index.ts';
import type { AnnotationPosition } from 'external/src/delegate/annotations/types.ts';
import {
  doNothing,
  getHighlightedTextConfigFromAnnotation,
} from 'external/src/lib/util.ts';
import { Portal } from 'external/src/components/Portal.tsx';
import { AnnotationArrow } from 'external/src/delegate/components/AnnotationArrow.tsx';
import { AnnotationPointer } from 'external/src/delegate/components/AnnotationPointer.tsx';
import { Overlay } from 'external/src/delegate/components/Overlay.tsx';
import { AnnotationsOnPageContext } from 'external/src/context/annotationsOnPage/AnnotationsOnPageContext.ts';
import type { LocationMatch, MessageAnnotation } from 'common/types/index.ts';
import { AnnotationSDKContext } from 'external/src/context/annotations/AnnotationSDKContext.ts';
import { useAnnotationPositionUpdater } from 'external/src/delegate/hooks/useAnnotationPositionUpdater.ts';
import { MediaModalContext } from 'external/src/context/mediaModal/MediaModalContext.tsx';
import { validPinnedAnnotationMatchTypes } from 'external/src/delegate/components/AnnotationPointers.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { PinnedAnnotationsContext } from 'external/src/context/annotations/PinnedAnnotationsContext.ts';

// (In its current implementation in the extension and sdk) This component is always
// rendered, but usually not visible because most of the time it just renders an
// invisible Overlay. It will show an annotation pin and/or an arrow if these are set
// in the Delegate context via Delegate actions such as SHOW_ANNOTATION_ARROW or
// SHOW_ANNOTATION.  Other logic applies, e.g. to avoid showing a duplicate annotation
// pin if one is already being rendered for the annotation in question.
export function AnnotationPointerAndArrow({
  annotation,
  annotationArrow,
  scrollingToAnnotation,
  thirdPartyObjects,
}: {
  // `annotation` can be undefined if e.g. we want to just show arrow pointing to edge of screen.
  annotation: MessageAnnotation | undefined;
  annotationArrow: DelegateState['annotationArrow'];
  scrollingToAnnotation: boolean;
  thirdPartyObjects: DelegateState['thirdPartyObjects'];
}) {
  const { annotationSetID } = useContextThrowingIfNoProvider(
    AnnotationsOnPageContext,
  );

  const { isAnnotationOnPage } = useContextThrowingIfNoProvider(
    PinnedAnnotationsContext,
  );
  const { mediaModal: imageModal } =
    useContextThrowingIfNoProvider(MediaModalContext);

  const [positionInfo, setPositionInfo] = useState<AnnotationPosition | null>(
    null,
  );
  const [matchType, setMatchType] = useState<LocationMatch | null>(null);

  const { getAnnotationPosition } =
    useContextThrowingIfNoProvider(AnnotationSDKContext);
  const annotationInstance = useMemo(
    () =>
      annotation
        ? createAnnotationInstance({
            annotation,
            thirdPartyObjects,
            getAnnotationPosition,
          })
        : null,
    [annotation, getAnnotationPosition, thirdPartyObjects],
  );

  // When we add an annotation, before sending a message, we show the pointer on the page.
  // In order for this pointer to stay in place when scrolling/resizing/etc, we need to update
  // its position.
  const updateAnnotationPosition = useCallback(async () => {
    if (!annotationInstance) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    const [positionInfo, matchType] = await Promise.all([
      annotationInstance.getPosition(),
      annotationInstance.getMatchType(),
    ]);
    setPositionInfo(positionInfo);
    setMatchType(matchType);
  }, [annotationInstance]);

  useAnnotationPositionUpdater(updateAnnotationPosition, annotationArrow);

  useEffect(() => {
    let isMounted = true;

    if (!annotationInstance) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    void annotationInstance.getPosition().then((positionInfo) => {
      if (isMounted) {
        setPositionInfo(positionInfo);
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    void annotationInstance.getMatchType().then((matchType) => {
      if (isMounted) {
        setMatchType(matchType);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [annotationInstance, getAnnotationPosition]);

  if (imageModal) {
    return null;
  }

  const isPinnedAnnotationAlreadyOnScreen =
    annotation &&
    isAnnotationOnPage(annotationSetID, annotation.id) &&
    matchType &&
    validPinnedAnnotationMatchTypes.includes(matchType);

  return (
    <Overlay
      allowPointerEvents={false}
      withoutSidebar={true}
      zIndexLayer="annotation"
    >
      {/* Renders the pin IF the annotation place is on screen (e.g. not
      off the edge), we know where to show the pin vs the viewport, and there
      isn't already a pin shown on the page */}
      {annotation && positionInfo && !isPinnedAnnotationAlreadyOnScreen && (
        <AnnotationPointer
          annotation={annotation}
          key={annotation.id}
          highlightedTextConfig={getHighlightedTextConfigFromAnnotation(
            annotation,
          )}
          positionVsViewport={{
            x: positionInfo?.xVsViewport ?? 0,
            y: positionInfo?.yVsViewport ?? 0,
          }}
          isHotspotAnnotation={false}
          setHiddenAnnotation={doNothing}
          hidden={!positionInfo?.visible}
          hasOpenThread={false}
        />
      )}
      {annotationArrow && !scrollingToAnnotation && (
        <Portal>
          <AnnotationArrow {...annotationArrow} />
        </Portal>
      )}
    </Overlay>
  );
}
