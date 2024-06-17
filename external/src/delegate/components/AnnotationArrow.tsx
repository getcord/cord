import * as React from 'react';
import { useEffect, useState } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { LocationMatch } from 'common/types/index.ts';
import type { DelegateState } from 'external/src/context/delegate/DelegateContext.ts';
import { DelegateContext } from 'external/src/context/delegate/DelegateContext.ts';
import { Arrow } from 'external/src/delegate/components/Arrow.tsx';
import { ANNOTATION_POINTER_TRANSITION_OUT_MS } from 'common/const/Timing.ts';
import { createAnnotationInstance } from 'external/src/delegate/annotations/index.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { AnnotationsOnPageContext } from 'external/src/context/annotationsOnPage/AnnotationsOnPageContext.ts';
import { AnnotationSDKContext } from 'external/src/context/annotations/AnnotationSDKContext.ts';
import { PinnedAnnotationsContext } from 'external/src/context/annotations/PinnedAnnotationsContext.ts';
import { DEFAULT_PIN_SCALE } from 'external/src/delegate/components/AnnotationPointer.tsx';

const useStyles = createUseStyles({
  arrowWrapper: {
    opacity: 1,
    transition: `opacity ${ANNOTATION_POINTER_TRANSITION_OUT_MS}ms`,
  },
  arrowWrapperHidden: {
    opacity: 0,
  },
});

type Props = NonNullable<DelegateState['annotationArrow']>;

export const AnnotationArrow = React.memo(function AnnotationArrow({
  annotation,
  fromPosition,
  animatingOut,
}: Props) {
  const {
    state: { thirdPartyObjects },
  } = useContextThrowingIfNoProvider(DelegateContext);
  const { annotationSetID } = useContextThrowingIfNoProvider(
    AnnotationsOnPageContext,
  );

  const { isAnnotationOnPage, annotationPinSize } =
    useContextThrowingIfNoProvider(PinnedAnnotationsContext);
  const [positionForArrow, setPositionForArrow] = useState<{
    xVsViewport: number;
    yVsViewport: number;
    withinScroll: boolean;
  } | null>(null);
  const [locationMatch, setLocationMatch] = useState<LocationMatch | null>(
    null,
  );
  const pointerWidth = annotationPinSize;
  const pointerHeight = annotationPinSize;

  const classes = useStyles();

  const { getAnnotationPosition } =
    useContextThrowingIfNoProvider(AnnotationSDKContext);

  useEffect(() => {
    const annotationInstance = createAnnotationInstance({
      annotation,
      thirdPartyObjects,
      getAnnotationPosition,
    });
    void annotationInstance
      .getMatchType()
      .then((matchType) => setLocationMatch(matchType));
    void annotationInstance
      .getPositionForArrow()
      .then((position) => setPositionForArrow(position));
  }, [
    annotation,
    annotation.location,
    annotation.customLocation,
    thirdPartyObjects,
    getAnnotationPosition,
  ]);

  if (!positionForArrow || !locationMatch) {
    return null;
  }
  const fromY = fromPosition.y;

  // eslint-disable-next-line prefer-const
  let { yVsViewport: toY, xVsViewport: toX, withinScroll } = positionForArrow;
  let arrowGoingDown = toY - pointerHeight > fromY;

  if (withinScroll) {
    // If the arrow is going down, we want it to point to the top
    // of the pointer icon. Highlighted text doesn't have a pointer icon,
    // unless it's a hotspot annotation.
    const isTextHighlight = Boolean(annotation.location?.highlightedTextConfig);
    const shouldAccountForPointer =
      arrowGoingDown &&
      locationMatch !== LocationMatch.OUTSIDE_ACCESSIBLE_VIRTUALISED_LIST &&
      (!isTextHighlight || isAnnotationOnPage(annotationSetID, annotation.id));
    if (shouldAccountForPointer) {
      const adjustment =
        pointerHeight * (isTextHighlight ? 1 : DEFAULT_PIN_SCALE);
      toY -= adjustment;
    }
    toX += pointerWidth / 2;
  } else {
    arrowGoingDown = toY > fromY;
  }

  const tooltipText = !withinScroll
    ? 'Click annotation to scroll'
    : getAnnotationTooltipText(locationMatch);

  return (
    <div
      className={cx(classes.arrowWrapper, {
        [classes.arrowWrapperHidden]: animatingOut,
      })}
    >
      <Arrow
        fromPosition={fromPosition}
        toPosition={{
          x: toX,
          y: toY,
        }}
        tooltipText={tooltipText}
        arrowGoingDown={arrowGoingDown}
        pointingToWidth={withinScroll ? pointerWidth : undefined}
      />
    </div>
  );
});

function getAnnotationTooltipText(locationMatchType: LocationMatch) {
  switch (locationMatchType) {
    case LocationMatch.CHART:
      return 'This chart may have changed. View screenshot for original';
    case LocationMatch.STALE:
      return 'This content has changed. View screenshot for original';
    case LocationMatch.MAYBE_STALE:
      return 'This content may have changed. View screenshot for original';
    case LocationMatch.OUTSIDE_ACCESSIBLE_VIRTUALISED_LIST:
      // Only tree nodes can be within scroll but with this location match value
      // In this case the node is in a collapsed node which is visible on screen
      return 'Click to expand';
    case LocationMatch.MULTIMEDIA:
      return 'Click to skip to annotated time';
    default:
      return null;
  }
}
