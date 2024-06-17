import { getTransformValues } from 'external/src/delegate/util.ts';
import { getFirstNormallyPositionedChild } from 'external/src/lib/nativeScreenshot/util/adjustScrollPositions.ts';
import { isSvgElement } from 'external/src/lib/nativeScreenshot/util/nodeTypeCheckers.ts';

export type ScrollAdjustment = {
  type: 'position' | 'margin';
  left: number;
  top: number;
};

export function getScrollContainerForChildren({
  nativeNode,
  reversedScrollOrder,
  containingWindow,
}: {
  nativeNode: HTMLElement | SVGElement;
  reversedScrollOrder: boolean;
  containingWindow: Window;
}) {
  if (
    isSvgElement(nativeNode, containingWindow) ||
    !nativeNode.firstElementChild
  ) {
    return null;
  }
  const scrollContainer = isElementScrolled(nativeNode) ? nativeNode : null;
  if (!scrollContainer) {
    return null;
  }
  return new ScrollContainerHandler({
    scrollContainer,
    reversedScrollOrder,
    containingWindow,
  });
}

export class ScrollContainerHandler {
  private scrollContainer: HTMLElement;
  private scrollContainerRect: DOMRect;
  private reversedScrollOrder: boolean;
  private containingWindow: Window;
  private marginSet = false;

  constructor({
    scrollContainer,
    reversedScrollOrder,
    containingWindow,
  }: {
    scrollContainer: HTMLElement;
    reversedScrollOrder: boolean;
    containingWindow: Window;
  }) {
    this.containingWindow = containingWindow;
    this.scrollContainer = scrollContainer;
    this.scrollContainerRect = this.scrollContainer.getBoundingClientRect();
    this.reversedScrollOrder = reversedScrollOrder;
  }

  shouldCloneChild(nativeNode: HTMLElement | SVGElement, elementRect: DOMRect) {
    const aboveScroll = elementRect.bottom < this.scrollContainerRect.top;
    const belowScroll = elementRect.top > this.scrollContainerRect.bottom;
    const leftOfScroll = elementRect.right < this.scrollContainerRect.left;
    const rightOfScroll = elementRect.left > this.scrollContainerRect.right;
    if (
      belowScroll ||
      (aboveScroll && nativeNode.scrollHeight <= nativeNode.clientHeight) ||
      rightOfScroll ||
      (leftOfScroll && nativeNode.scrollWidth <= nativeNode.clientWidth)
    ) {
      // Don't clone if out of scroll (and no overflow which could be within scroll)
      return false;
    }
    return true;
  }

  getChildAdjustment({
    nativeNode,
    elementRect,
    elementStyles,
  }: {
    nativeNode: HTMLElement | SVGElement;
    elementRect: DOMRect;
    elementStyles: CSSStyleDeclaration;
  }): ScrollAdjustment | null {
    try {
      if (isSvgElement(nativeNode, this.containingWindow)) {
        return null;
      }
      const position = elementStyles.position;
      if (position === 'fixed' || position === 'sticky') {
        return null;
      }
      const elementTopRelativeToScrollContainer =
        elementRect.top - this.scrollContainerRect.top;
      const elementLeftRelativeToScrollContainer =
        elementRect.left - this.scrollContainerRect.left;
      if (position === 'absolute') {
        // If positioned absolutely versus either the scrollContainer or an
        // inner scroll container, it should be left at the same position
        // relative to the scrollContainer. With no scroll (as is the case for
        // the cloned scroll container), the inner scroll container will line up
        // with the scroll container.
        if (
          nativeNode.offsetParent === this.scrollContainer ||
          nativeNode.offsetParent === this.scrollContainer.children[0]
        ) {
          // We need to deduct any translate values, as top/left are calculated
          // independently of those
          const { translateX, translateY } = getTransformValues(elementStyles);
          return {
            type: 'position',
            top: elementTopRelativeToScrollContainer - translateY,
            left: elementLeftRelativeToScrollContainer - translateX,
          };
        } else {
          // If positioned using an element outside of the scrollContainer, leave as is
          return null;
        }
      }
      if (this.marginSet) {
        return null;
      }
      // Apply topMargin to first visible child to position it in
      // correct place vs scroll view, given we have skipped all the
      // elements above
      const firstChild = getFirstNormallyPositionedChild(
        nativeNode.parentElement!,
        this.containingWindow,
      )!;
      const { scrollTop, scrollLeft } = this.getScrollPosition();
      const { top: firstChildTop, left: firstChildLeft } =
        firstChild.getBoundingClientRect();
      const gapAtTopOfScrollContainer =
        firstChildTop + scrollTop - this.scrollContainerRect.top;
      const gapAtLeftOfScrollContainer =
        firstChildLeft + scrollLeft - this.scrollContainerRect.left;
      const topMarginNeeded =
        elementTopRelativeToScrollContainer - gapAtTopOfScrollContainer;
      const leftMarginNeeded =
        elementLeftRelativeToScrollContainer - gapAtLeftOfScrollContainer;
      this.marginSet = true;
      return { type: 'margin', top: topMarginNeeded, left: leftMarginNeeded };
    } catch (e) {
      console.warn('Error in native screenshot adjustScrollContainerChild', e);
      return null;
    }
  }

  private getScrollPosition() {
    const scroll = {
      scrollTop: this.scrollContainer.scrollTop,
      scrollLeft: this.scrollContainer.scrollLeft,
    };
    if (this.reversedScrollOrder) {
      scroll.scrollTop +=
        this.scrollContainer.scrollHeight - this.scrollContainer.clientHeight;
      scroll.scrollLeft +=
        this.scrollContainer.scrollWidth - this.scrollContainer.clientWidth;
    }
    return scroll;
  }
}

function isElementScrolled(element: Element) {
  return element.scrollTop > 0;
}

export function isAbsolutelyPositionedVsDocument(
  element: HTMLElement | SVGElement,
  styles: CSSStyleDeclaration,
) {
  if (styles.position !== 'absolute') {
    return false;
  }
  return (
    'offsetParent' in element &&
    (element.offsetParent?.nodeName === 'BODY' ||
      element.offsetParent?.nodeName === 'HTML')
  );
}
