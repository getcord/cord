import type { Annotation, HighlightedTextConfig } from '@cord-sdk/types';
import type { MessageAnnotation, Point2D } from 'common/types/index.ts';
import { LocationMatch } from 'common/types/index.ts';
import type { AnnotationSDKContextType } from 'external/src/context/annotations/AnnotationSDKContext.ts';
import type {
  AnnotationArrowPosition,
  AnnotationPosition,
  BaseAnnotation,
} from 'external/src/delegate/annotations/types.ts';
import {
  computeAnnotationPositionUsingHeuristics,
  getActiveScrollParents,
  scrollToPromise,
} from 'external/src/delegate/location/util.ts';
import { isHighlightedTextPresent } from 'external/src/delegate/location/textHighlights.ts';
import { clamp } from 'common/util/clamp.ts';

function isPointInRect(
  { x, y }: { x: number; y: number },
  {
    left,
    top,
    right,
    bottom,
  }: { left: number; top: number; bottom: number; right: number },
) {
  return x >= left && x <= right && y >= top && y <= bottom;
}

function isPointVisible(
  point: { x: number; y: number },
  elementRect?: DOMRect,
) {
  const isWithinViewport = isPointInRect(point, {
    left: 0,
    top: 0,
    right: window.innerWidth,
    bottom: window.innerHeight,
  });

  const isWithinElement = elementRect
    ? isPointInRect(point, elementRect)
    : true;

  return isWithinViewport && isWithinElement;
}

export class CustomAnnotation implements BaseAnnotation {
  annotation: Annotation;
  target?: Element | null = null;
  private coordsRelativeToTarget: Point2D;
  private customHighlightedTextConfig: HighlightedTextConfig | null;

  constructor(
    annotation: MessageAnnotation,
    private getAnnotationPosition: AnnotationSDKContextType['getAnnotationPosition'],
  ) {
    this.annotation = {
      id: annotation.id,
      location: annotation.customLocation!,
    };
    this.coordsRelativeToTarget = annotation.coordsRelativeToTarget!;
    this.customHighlightedTextConfig = annotation.customHighlightedTextConfig;
  }

  async getPosition(): Promise<AnnotationPosition | null> {
    const documentCoordinates = this.getAnnotationPosition(
      this.annotation,
      this.coordsRelativeToTarget,
    );
    if (
      documentCoordinates.match === LocationMatch.NONE ||
      documentCoordinates.x === undefined ||
      documentCoordinates.y === undefined
    ) {
      return null;
    }

    const xVsViewport = documentCoordinates.x - window.scrollX;
    const yVsViewport = documentCoordinates.y - window.scrollY;
    const target = documentCoordinates.element;
    if (!target) {
      return {
        xVsViewport,
        yVsViewport,
        visible: isPointVisible(
          { x: xVsViewport, y: yVsViewport },
          documentCoordinates.elementRect,
        ),
      };
    } else {
      // So we can use it elsewhere
      this.target = target;

      const result = computeAnnotationPositionUsingHeuristics({
        rightBoundary: window.innerWidth,
        target,
        xVsViewport,
        yVsViewport,
        textConfig: null,
      });

      if (!result) {
        return {
          xVsViewport,
          yVsViewport,
          visible: false,
        };
      }

      const {
        visible,
        hasInnerScrollContainer,
        closestScrollParentRect,
        xVsClosestScrollParent,
        yVsClosestScrollParent,
      } = result;

      return {
        visible,
        xVsViewport,
        yVsViewport,
        scrollContainer: hasInnerScrollContainer
          ? {
              topVsViewport: closestScrollParentRect.top,
              leftVsViewport: closestScrollParentRect.left,
              bottomVsViewport: closestScrollParentRect.bottom,
              rightVsViewport: closestScrollParentRect.right,
            }
          : undefined,
        matchType: documentCoordinates.match,
        // For scrollTo function:
        xVsClosestScrollParent,
        yVsClosestScrollParent,
      };
    }
  }

  async getMatchType(): Promise<LocationMatch> {
    if (this.customHighlightedTextConfig) {
      return isHighlightedTextPresent(this.customHighlightedTextConfig)
        ? LocationMatch.EXACT
        : LocationMatch.NONE;
    }

    return this.getAnnotationPosition(
      this.annotation,
      this.coordsRelativeToTarget,
    ).match;
  }

  async isOutsideScroll(): Promise<boolean> {
    const position = await this.getPosition();
    return Boolean(position && !position.visible);
  }

  async scrollTo(): Promise<void> {
    const position = await this.getPosition();
    if (!position || !this.target) {
      return;
    }

    const scrollParents = getActiveScrollParents(this.target);

    const { xVsClosestScrollParent = 0, yVsClosestScrollParent = 0 } = position;

    for (let i = 0; i < scrollParents.length; i++) {
      const currentScrollParent = scrollParents[i];
      const isLastScrollParent = !scrollParents[i + 1];
      if (currentScrollParent.nodeName !== 'HTML') {
        // Don't need to scroll main HTML into view
        currentScrollParent.scrollIntoView({
          block:
            currentScrollParent.clientHeight < window.innerHeight
              ? 'center'
              : 'start',
          inline:
            currentScrollParent.clientWidth < window.innerWidth
              ? 'center'
              : 'start',
        });
      }
      if (isLastScrollParent) {
        const scroller =
          currentScrollParent.nodeName === 'HTML' ||
          currentScrollParent.nodeName === 'BODY'
            ? window
            : currentScrollParent;

        const scrollY =
          yVsClosestScrollParent -
          Math.min(currentScrollParent.clientHeight, window.innerHeight) / 2;

        const targetScrollY = Math.floor(
          Math.min(
            Math.max(0, scrollY),
            currentScrollParent.scrollHeight - currentScrollParent.clientHeight,
          ),
        );

        const scrollX =
          xVsClosestScrollParent -
          Math.min(currentScrollParent.clientWidth, window.innerWidth) / 2;

        const targetScrollX = Math.floor(
          Math.min(
            Math.max(0, scrollX),
            currentScrollParent.scrollWidth - currentScrollParent.clientWidth,
          ),
        );

        await scrollToPromise({
          top: targetScrollY,
          left: targetScrollX,
          behavior: 'smooth',
          scrollElement: scroller,
        });
      }
    }
  }

  async getPositionForArrow(): Promise<AnnotationArrowPosition | null> {
    const documentCoordinates = this.getAnnotationPosition(
      this.annotation,
      this.coordsRelativeToTarget,
    );
    if (
      documentCoordinates.match === LocationMatch.NONE ||
      documentCoordinates.x === undefined ||
      documentCoordinates.y === undefined
    ) {
      return null;
    }

    let xVsViewport = documentCoordinates.x - window.scrollX;
    let yVsViewport = documentCoordinates.y - window.scrollY;

    const withinScroll = isPointVisible(
      { x: xVsViewport, y: yVsViewport },
      documentCoordinates.elementRect,
    );

    if (documentCoordinates.elementRect) {
      xVsViewport = clamp(
        xVsViewport,
        documentCoordinates.elementRect.left,
        documentCoordinates.elementRect.right,
      );

      yVsViewport = clamp(
        yVsViewport,
        documentCoordinates.elementRect.top,
        documentCoordinates.elementRect.bottom,
      );
    }

    xVsViewport = clamp(xVsViewport, 0, window.innerWidth);
    yVsViewport = clamp(yVsViewport, 0, window.innerHeight);

    return {
      xVsViewport,
      yVsViewport,
      withinScroll,
    };
  }
}
