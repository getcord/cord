import { Sizes } from 'common/const/Sizes.ts';
import type { DocumentLocation } from 'common/types/index.ts';
import { LocationMatch } from 'common/types/index.ts';
import { findTarget } from 'external/src/delegate/location/findTarget.ts';
import { isHighlightedTextPresent } from 'external/src/delegate/location/textHighlights.ts';
import {
  computeAnnotationPositionUsingHeuristics,
  getActiveScrollParents,
  iframePositionToViewportPosition,
  isIframe,
  isMediaElement,
  scrollTo,
} from 'external/src/delegate/location/util.ts';
import { getSidebarXPosition } from 'external/src/delegate/util.ts';
import type {
  AnnotationPosition,
  BaseAnnotation,
} from 'external/src/delegate/annotations/types.ts';
import { sendEmbedXFrameMessage } from 'external/src/embed/embedXFrame/index.ts';
import { isIframeAccessible } from 'external/src/delegate/trackAccessibleIframes.ts';

const { ANNOTATION_POINTER_MIN_GAP_VS_SCREEN_EDGE: pointerGapVsScreenEdge } =
  Sizes;

type AnnotationArgs = {
  location: DocumentLocation;
};

export class Annotation implements BaseAnnotation {
  location: DocumentLocation;
  target?: Element | null = null;

  constructor({ location }: AnnotationArgs) {
    this.location = location;
  }

  private getRightBoundary() {
    return getSidebarXPosition();
  }

  async getPosition(): Promise<AnnotationPosition | null> {
    const { location } = this;
    const { textConfig } = location;
    const [iframeSelector, ...remainingIframeSelectors] =
      this.location.iframeSelectors;

    if (iframeSelector) {
      const iframe = this.getIFrame(iframeSelector);
      if (!iframe) {
        return null;
      }

      const position = await sendEmbedXFrameMessage(
        iframe.contentWindow,
        'CORD_GET_ANNOTATION_POSITION',
        {
          documentLocation: {
            ...this.location,
            iframeSelectors: remainingIframeSelectors,
          },
        },
      );

      if (!position) {
        return null;
      }

      const { x, y } = iframePositionToViewportPosition(
        { x: position.xVsViewport, y: position.yVsViewport },
        iframe,
      );

      let visible = position.visible;
      if (visible) {
        if (x < 0 || x > window.innerWidth || y < 0 || y > window.innerHeight) {
          visible = false;
        }
      }

      return {
        ...position,
        visible,
        xVsViewport: x,
        yVsViewport: y,
      };
    }

    const { target, matchType } = findTarget({
      location,
      includeContainingListItemBehaviour: true,
    });
    if (!target) {
      return null;
    }

    const targetElementRect = target.getBoundingClientRect();
    const xVsViewport =
      targetElementRect.x + location.x * targetElementRect.width;
    const yVsViewport =
      targetElementRect.y + location.y * targetElementRect.height;

    const result = computeAnnotationPositionUsingHeuristics({
      rightBoundary: this.getRightBoundary(),
      target,
      textConfig,
      xVsViewport,
      yVsViewport,
    });
    if (!result) {
      return null;
    }

    // Save target to instance so scrollTo has access to it. We can't include
    // target in return value because it needs to be serialised when called
    // inside an iframe
    this.target = target;

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
      matchType,
      // For scrollTo function:
      xVsClosestScrollParent,
      yVsClosestScrollParent,
    };
  }

  async getMatchType() {
    const [iframeSelector, ...remainingIframeSelectors] =
      this.location.iframeSelectors;

    if (iframeSelector) {
      const iframe = this.getIFrame(iframeSelector);
      if (!iframe) {
        return LocationMatch.NONE;
      }

      return await sendEmbedXFrameMessage(
        iframe.contentWindow,
        'CORD_GET_ANNOTATION_MATCH_TYPE',
        {
          documentLocation: {
            ...this.location,
            iframeSelectors: remainingIframeSelectors,
          },
        },
      );
    }

    if (this.location.highlightedTextConfig) {
      return isHighlightedTextPresent(this.location.highlightedTextConfig)
        ? LocationMatch.EXACT
        : LocationMatch.NONE;
    }
    const { matchType } = findTarget({
      location: this.location,
      includeContainingListItemBehaviour: true,
    });
    return matchType;
  }

  async isOutsideScroll() {
    const position = await this.getPosition();
    return Boolean(position && !position.visible);
  }

  async scrollTo() {
    const [iframeSelector, ...remainingIframeSelectors] =
      this.location.iframeSelectors;

    if (iframeSelector) {
      const iframe = this.getIFrame(iframeSelector);
      if (!iframe) {
        return;
      }

      iframe.scrollIntoView({ behavior: 'smooth' });

      await sendEmbedXFrameMessage(
        iframe.contentWindow,
        'CORD_SCROLL_TO_ANNOTATION',
        {
          documentLocation: {
            ...this.location,
            iframeSelectors: remainingIframeSelectors,
          },
        },
      );

      return;
    }

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
        await scrollTo({
          scrollY:
            yVsClosestScrollParent -
            Math.min(currentScrollParent.clientHeight, window.innerHeight) / 2,
          scrollX:
            xVsClosestScrollParent -
            Math.min(currentScrollParent.clientWidth, window.innerWidth) / 2,
          scrollParent: currentScrollParent,
          windowElement: window,
        });
      }
    }
  }

  async getPositionForArrow() {
    const [iframeSelector, ...remainingIframeSelectors] =
      this.location.iframeSelectors;

    if (iframeSelector) {
      const iframe = this.getIFrame(iframeSelector);
      if (!iframe) {
        return null;
      }

      const position = await sendEmbedXFrameMessage(
        iframe.contentWindow,
        'CORD_GET_ANNOTATION_ARROW_POSITION',
        {
          documentLocation: {
            ...this.location,
            iframeSelectors: remainingIframeSelectors,
          },
        },
      );

      if (!position) {
        return null;
      }

      let { x: xVsViewport, y: yVsViewport } = iframePositionToViewportPosition(
        { x: position.xVsViewport, y: position.yVsViewport },
        iframe,
      );
      const sidebarX = this.getRightBoundary();
      let withinScroll = position.withinScroll;
      if (yVsViewport < 0) {
        yVsViewport = pointerGapVsScreenEdge;
        withinScroll = false;
      } else if (yVsViewport > window.innerHeight) {
        withinScroll = false;
        yVsViewport = window.innerHeight - pointerGapVsScreenEdge;
      }
      if (xVsViewport < 0) {
        withinScroll = false;
        xVsViewport = pointerGapVsScreenEdge;
      } else if (xVsViewport > sidebarX) {
        withinScroll = false;
        xVsViewport = sidebarX - pointerGapVsScreenEdge;
      }

      return {
        withinScroll,
        xVsViewport,
        yVsViewport,
      };
    }

    const position = await this.getPosition();
    if (!position) {
      return null;
    }
    if (position.visible) {
      return {
        xVsViewport: position.xVsViewport,
        yVsViewport: position.yVsViewport,
        withinScroll: true,
      };
    }
    const rightBoundary = this.getRightBoundary();
    let toX: number = position.xVsViewport;
    let toY: number = position.yVsViewport;
    let vertScroll: 'within' | 'above' | 'below' = 'within';
    let horizScroll: 'within' | 'left' | 'right' = 'within';
    if (position.yVsViewport < 0) {
      vertScroll = 'above';
      toY = 0;
    } else if (position.yVsViewport > window.innerHeight) {
      vertScroll = 'below';
      toY = window.innerHeight;
    }
    if (position.xVsViewport < 0) {
      horizScroll = 'left';
      toX = 0;
    } else if (position.xVsViewport > rightBoundary) {
      horizScroll = 'right';
      toX = rightBoundary;
    }
    if (position.scrollContainer) {
      // Annotations may not be within the scroll of their container
      // We position the pointer at edge of scroll container if that is within the viewport
      if (position.yVsViewport < position.scrollContainer.topVsViewport) {
        vertScroll = 'above';
        toY = Math.max(
          position.scrollContainer.topVsViewport,
          toY ?? -Infinity,
        );
      } else if (
        position.yVsViewport > position.scrollContainer.bottomVsViewport
      ) {
        vertScroll = 'below';
        toY = Math.min(
          position.scrollContainer.bottomVsViewport,
          toY ?? Infinity,
        );
      }
      if (position.xVsViewport < position.scrollContainer.leftVsViewport) {
        horizScroll = 'left';
        toX = Math.max(
          position.scrollContainer.leftVsViewport,
          toX ?? -Infinity,
        );
      } else if (
        position.xVsViewport > position.scrollContainer.rightVsViewport
      ) {
        horizScroll = 'right';
        toX = Math.min(
          position.scrollContainer.rightVsViewport,
          toX ?? Infinity,
        );
      }
    }
    toX +=
      (horizScroll === 'left' ? 1 : horizScroll === 'right' ? -1 : 0) *
      pointerGapVsScreenEdge;
    toY +=
      (vertScroll === 'above' ? 1 : vertScroll === 'below' ? -1 : 0) *
      pointerGapVsScreenEdge;
    return {
      xVsViewport: toX,
      yVsViewport: toY,
      withinScroll: false,
    };
  }

  async skipMediaToAnnotatedTime() {
    const { target, matchType } = findTarget({
      location: this.location,
      includeContainingListItemBehaviour: true,
    });
    if (matchType !== LocationMatch.MULTIMEDIA || !isMediaElement(target)) {
      return;
    }

    const currentTime = this.location.multimediaConfig?.currentTime;
    if (currentTime) {
      target.currentTime = currentTime;
    }
  }

  private getIFrame(selector: string) {
    const iframe = document.querySelector(selector);
    if (!iframe || !isIframe(iframe) || !isIframeAccessible(iframe)) {
      return null;
    }

    return iframe;
  }
}
