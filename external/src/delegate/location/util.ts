import type { LocationTextConfig } from 'common/types/index.ts';
import { ACTION_MODAL_ID } from 'common/const/ElementIDs.ts';
import { matchesHash } from 'common/util/index.ts';
import type { BasicLogger } from 'external/src/delegate/BasicLogger.ts';
import { findLast } from '@cord-sdk/react/common/lib/findLast.ts';

export function isWebpagePdf() {
  return (
    document.body.firstChild?.nodeName === 'EMBED' &&
    (document.body.firstChild as HTMLEmbedElement).type === 'application/pdf'
  );
}

function getTopLevelScrollParent(documentElement: Document) {
  return documentElement.scrollingElement ?? documentElement.documentElement;
}

function isElementScrollable(element: Element, windowElement: Window) {
  // window.HTMLElement because Iframe window has own HTMLElement type
  const isElement = element instanceof (windowElement as any).HTMLElement;
  if (!isElement) {
    return false;
  }
  const { overflowX, overflowY } = windowElement.getComputedStyle(element);
  return (
    (overflowY !== 'visible' && overflowY !== 'hidden') ||
    (overflowX !== 'visible' && overflowX !== 'hidden')
  );
}

/**
 * Get closest scrollContainer of element, not including the window
 */
function getScrollContainer(node: Element, windowElement: Window) {
  let parent = node.parentElement;
  while (parent && parent.nodeName !== 'BODY') {
    if (isElementScrollable(parent, windowElement)) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

/**
 * Get all scroll parents of element, including the window
 */
function getScrollParents(
  node: Element,
  windowElement: Window,
  documentElement: Document,
) {
  const scrollParents: Element[] = [];
  let parent = node.parentElement;
  while (parent && parent.nodeName !== 'BODY') {
    if (isElementScrollable(parent, windowElement)) {
      scrollParents.unshift(parent);
    }
    parent = parent.parentElement;
  }
  return [getTopLevelScrollParent(documentElement), ...scrollParents];
}

const MATCHING_TEXT_TARGET_LENGTH = 50;
const MATCHING_TEXT_MINIMUM_LENGTH = 15;

export function getTextAtPointConfig(
  documentElement: Document,
  target: Element,
  x: number,
  y: number,
  hashAnnotations: boolean,
  logWarning?: BasicLogger['logWarning'],
): LocationTextConfig | null {
  if (hashAnnotations) {
    return null;
  }
  // Return null if method not available (i.e. in firefox) or target doesn't contain text
  // https://caniuse.com/mdn-api_document_caretrangefrompoint
  if (![...target.childNodes].some(isTextNode)) {
    return null;
  }
  let range = null;
  if ('caretRangeFromPoint' in documentElement) {
    range = documentElement.caretRangeFromPoint(x, y);
  } else {
    const caretPosition = caretPositionFromPoint(
      documentElement,
      {
        x,
        y,
      },
      logWarning,
    );
    if (!caretPosition) {
      return null;
    }
    const { textNode, offset } = caretPosition;
    range = document.createRange();
    range.setStart(textNode, offset);
    range.setEnd(textNode, offset);
  }
  if (!range) {
    return null;
  }

  if (isTextNode(range.startContainer)) {
    const selectedCharOffset = range.startOffset;
    const textNode = range.startContainer;
    const textLength = textNode.textContent!.length;
    range.setEnd(textNode, selectedCharOffset);
    const rangeRect = range.getBoundingClientRect();
    const xVsPointer = rangeRect.x - x;
    const yVsPointer = rangeRect.y - y;
    // Try to record 25 chars before and after pointer, so that we can find the text later
    range.setEnd(
      textNode,
      Math.min(
        selectedCharOffset + MATCHING_TEXT_TARGET_LENGTH / 2,
        textLength - 1,
      ),
    );
    range.setStart(
      textNode,
      Math.max(selectedCharOffset - MATCHING_TEXT_TARGET_LENGTH / 2, 0),
    );
    const textToMatch = range.toString();
    const textToMatchOffset = range.startOffset;
    if (textToMatch.length < MATCHING_TEXT_MINIMUM_LENGTH) {
      return null;
    }

    return {
      textToMatch,
      selectedCharOffset,
      textToMatchOffset,
      xVsPointer,
      yVsPointer,
      nodeIndex: Array.from(textNode.parentNode!.childNodes).indexOf(
        textNode as any,
      ),
    };
  }
  return null;
}

export function isTextNode(node: Node): node is Text {
  return node.nodeName === '#text';
}

export function isMediaElement(
  element: Element | null,
): element is HTMLMediaElement {
  return !!element && 'currentTime' in element;
}

export function isIframe(element: Element): element is HTMLIFrameElement {
  return element.nodeName === 'IFRAME';
}

function getTextNodeAndOffset(
  element: Element,
  textConfig: LocationTextConfig,
) {
  const { textToMatch, selectedCharOffset, textToMatchOffset } = textConfig;
  const childNode = element.childNodes[textConfig.nodeIndex];

  if (childNode && isTextNode(childNode)) {
    if (matchesHash(childNode.textContent ?? '', textToMatch)) {
      return { childNode, selectedCharOffset };
    }

    if (
      childNode.textContent?.slice(
        textToMatchOffset,
        textToMatchOffset + textToMatch.length,
      ) === textToMatch
    ) {
      // Text content is in exactly the same position as when annotation was made
      return { childNode, selectedCharOffset };
    } else {
      const index = childNode.textContent?.indexOf(textToMatch) ?? -1;
      if (index > -1) {
        // Text content is in same index node, but at a different offset
        return {
          childNode,
          selectedCharOffset: index + (selectedCharOffset - textToMatchOffset),
        };
      }
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  for (const childNode of element.childNodes) {
    // Text content not in same index node. Look for it in other nodes
    if (isTextNode(childNode)) {
      const index = childNode.textContent?.indexOf(textToMatch) ?? -1;
      if (index > -1) {
        return {
          childNode,
          selectedCharOffset: index + (selectedCharOffset - textToMatchOffset),
        };
      }
    }
  }
  // Text content not found in any nodes
  return null;
}

function getPositionFromTextAtPointConfig(
  documentElement: Document,
  element: Element,
  textConfig: LocationTextConfig,
) {
  const textNodeAndOffset = getTextNodeAndOffset(element, textConfig);

  if (!textNodeAndOffset) {
    return null;
  }
  const { childNode, selectedCharOffset } = textNodeAndOffset;
  const range = documentElement.createRange();
  range.setStart(childNode, selectedCharOffset);
  range.setEnd(childNode, selectedCharOffset);
  const rangeRect = range.getBoundingClientRect();
  return {
    x: rangeRect.x - textConfig.xVsPointer,
    y: rangeRect.y - textConfig.yVsPointer,
  };
}

const suitableLargeElementTags = ['VIDEO', 'IMG', 'EMBED', 'IFRAME'];
export function isElementSuitableForDocLocation(targetElement: Element) {
  if (suitableLargeElementTags.includes(targetElement.tagName)) {
    return true;
  }
  if (targetElement.id === ACTION_MODAL_ID) {
    return false;
  }
  const rect = targetElement.getBoundingClientRect();
  return (
    elementTakesSpace(rect) && (targetElement.scrollHeight || rect.height) < 800
  );
}

// Don't include elements that don't take any space (which includes `display: none` elements)
function elementTakesSpace(elementRect: DOMRect) {
  return Boolean(elementRect.width && elementRect.height);
}

// Iterate towards left/right, and to a lesser extent above,
// until we have found a suitable element to position the location relative to
export function findSuitableElementForDocLocation(
  documentElement: Document,
  windowElement: Window,
  xVsViewport: number,
  yVsViewport: number,
  originalElement: Element,
  excludeElementRef?: React.RefObject<HTMLElement>,
) {
  function getPointsToCheck(distance: number) {
    const points = [];
    for (const adj of [0, -10, 10, -20, 20, -30, 30, -40, 40]) {
      points.push([xVsViewport + distance, yVsViewport + adj]);
      points.push([xVsViewport - distance, yVsViewport + adj]);
      points.push([xVsViewport + adj, yVsViewport + distance / 2]);
      points.push([xVsViewport + adj, yVsViewport - distance / 2]);
    }
    return points;
  }
  // If the unsuitable target element is or is inside a scrollContainer, we want
  // to avoid setting the target to an element outside the scrollContainer
  const firstChild = originalElement.firstElementChild;
  const scrollContainer = !firstChild
    ? false
    : getScrollContainer(firstChild, windowElement);

  let distance = 0;
  while (distance <= 500) {
    distance += 25;
    const points = getPointsToCheck(distance);
    for (const point of points) {
      const element = documentElement.elementFromPoint(point[0], point[1]);
      if (
        !element ||
        element.nodeName === 'IFRAME' ||
        (scrollContainer && !scrollContainer.contains(element)) ||
        (excludeElementRef &&
          (element === excludeElementRef.current ||
            excludeElementRef.current?.contains(element))) ||
        isFixedOrInsideFixedElement(element)
      ) {
        continue;
      }
      if (isElementSuitableForDocLocation(element)) {
        return element;
      }
    }
  }
  return null;
}

export function hasNumber(myString: string) {
  return /\d/.test(myString);
}

// https://stackoverflow.com/questions/52292603/is-there-a-callback-for-window-scrollto
export function scrollTo({
  scrollY,
  scrollX,
  scrollParent,
  windowElement,
}: {
  scrollY: number;
  scrollX: number;
  scrollParent: Element;
  windowElement: Window;
}) {
  return new Promise<void>((resolve) => {
    // Listener goes on scroller
    // onScroll doesn't fire on every tick for HTML/BODY - use window instead
    const scroller =
      scrollParent.nodeName === 'HTML' || scrollParent.nodeName === 'BODY'
        ? windowElement
        : scrollParent;

    // Round to avoid imprecision errors, and clamp to [0, maxScrollY]
    const targetScrollY = Math.floor(
      Math.min(
        Math.max(0, scrollY),
        scrollParent.scrollHeight - scrollParent.clientHeight,
      ),
    );
    const targetScrollX = Math.floor(
      Math.min(
        Math.max(0, scrollX),
        scrollParent.scrollWidth - scrollParent.clientWidth,
      ),
    );

    const onScroll = () => {
      if (
        scrollParent.scrollTop === targetScrollY &&
        scrollParent.scrollLeft === targetScrollX
      ) {
        scroller.removeEventListener('scroll', onScroll);
        resolve();
      }
    };

    scroller.addEventListener('scroll', onScroll);
    onScroll();
    scrollParent.scrollTo({
      top: targetScrollY,
      left: targetScrollX,
      behavior: 'smooth',
    });
  });
}

const SCROLL_TO_PROMISE_TIMEOUT_MS = 100;
/**
 * `await`able version of `window.scrollTo`
 */
export function scrollToPromise({
  top,
  left,
  behavior,
  scrollElement = window,
}: ScrollToOptions & { scrollElement?: Element | Window }) {
  return new Promise<void>((resolve) => {
    let finishedScrollingTimer: NodeJS.Timeout | null = null;

    const onScroll = () => {
      if (finishedScrollingTimer) {
        clearTimeout(finishedScrollingTimer);
      }

      finishedScrollingTimer = setTimeout(() => {
        scrollElement.removeEventListener('scroll', onScroll);
        resolve();
      }, SCROLL_TO_PROMISE_TIMEOUT_MS);
    };

    scrollElement.addEventListener('scroll', onScroll);
    onScroll();
    scrollElement.scrollTo({
      top,
      left,
      behavior,
    });
  });
}

export function isDocument(node: Element | Document | null): node is Document {
  return node?.nodeName === '#document';
}

export function isInputOrTextArea(node: Node | null): node is InputOrTextArea {
  return node?.nodeName === 'TEXTAREA' || node?.nodeName === 'INPUT';
}

export type InputOrTextArea = HTMLInputElement | HTMLTextAreaElement;

export function getNodesFromRange<N extends Node>(
  range: Range,
  includeNodeTypeGuard: (node: Node) => node is N,
  containingDocument: Document,
): N[] {
  const iterator = containingDocument.createNodeIterator(
    range.commonAncestorContainer,
    NodeFilter.SHOW_ALL,
    {
      acceptNode: (node: Node) => {
        if (
          // We started iterating from range.commonAncestorContainer, so
          // the node might not be in the range
          range.intersectsNode(node) &&
          includeNodeTypeGuard(node)
        ) {
          return NodeFilter.FILTER_ACCEPT;
        } else {
          return NodeFilter.FILTER_SKIP;
        }
      },
    },
  );

  const nodes = [];
  while (iterator.nextNode()) {
    nodes.push(iterator.referenceNode);

    if (iterator.referenceNode === range.endContainer) {
      break;
    }
  }
  return nodes as N[];
}

export function getActiveScrollParents(
  element: Element,
  containingWindow: Window = window,
  containingDocument = document,
) {
  return getScrollParents(element, containingWindow, containingDocument).filter(
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    (element): element is Element =>
      Boolean(element && (element.nodeName === 'HTML' || hasOverflow(element))),
  );
}

// We exclude scrollParents that don't have any overflow from our
// scroll-to-annotation logic
function hasOverflow(element: Element) {
  return (
    element.scrollHeight > element.clientHeight ||
    element.scrollWidth > element.clientWidth
  );
}

export function caretPositionFromPoint(
  containingDocument: Document,
  { x, y }: { x: number; y: number },
  logWarning?: BasicLogger['logWarning'],
) {
  // caretRangeFromPoint exists in chrome, edge, safari
  // caretPositionFromPoint exists in firefox
  // https://caniuse.com/mdn-api_document_caretrangefrompoint
  // https://caniuse.com/mdn-api_document_caretpositionfrompoint
  if (containingDocument.caretRangeFromPoint) {
    const range: Range | null = containingDocument.caretRangeFromPoint(x, y);
    if (!range || !isTextNode(range.startContainer)) {
      return null;
    }

    return {
      textNode: range.startContainer,
      offset: range.startOffset,
    };
  } else if ('caretPositionFromPoint' in containingDocument) {
    const position = (containingDocument as any).caretPositionFromPoint(x, y);
    if (!position || !isTextNode(position.offsetNode)) {
      return null;
    }
    return {
      textNode: position.offsetNode as Text,
      offset: position.offset as number,
    };
  } else {
    logWarning?.(
      'Neither caretRangeFromPoint or caretPositionFromPoint supported in browser',
    );
    return null;
  }
}

export function getPositionRelativeToElement(
  positionVsViewport: { x: number; y: number },
  element: Element,
) {
  const rect = element.getBoundingClientRect();
  return {
    x: positionVsViewport.x - rect.x,
    y: positionVsViewport.y - rect.y,
  };
}

export function iframePositionToViewportPosition(
  positionVsIframeViewport: { x: number; y: number },
  iframeElement: HTMLIFrameElement,
) {
  const iframeRect = iframeElement.getBoundingClientRect();
  return {
    x: positionVsIframeViewport.x + iframeRect.x,
    y: positionVsIframeViewport.y + iframeRect.y,
  };
}

// Minimise choosing fixed elements when searching for
// suitable elements for the documentation location
function isFixedOrInsideFixedElement(element: Element): boolean {
  if (window.getComputedStyle(element).position === 'fixed') {
    return true;
  }

  const parent = element.parentElement;
  if (parent && parent.nodeName !== ('BODY' || 'HTML')) {
    return isFixedOrInsideFixedElement(parent);
  }

  return false;
}

type ComputeAnnotationPositionUsingHeuristicsProps = {
  target: Element;
  textConfig: LocationTextConfig | null;
  rightBoundary: number;
  xVsViewport: number;
  yVsViewport: number;
};

type ComputeAnnotationPositionUsingHeuristicsResult = {
  visible: boolean;
  hasInnerScrollContainer: boolean;
  closestScrollParentRect: DOMRect;
  xVsClosestScrollParent: number;
  yVsClosestScrollParent: number;
};

export function computeAnnotationPositionUsingHeuristics({
  target,
  rightBoundary,
  textConfig,
  xVsViewport,
  yVsViewport,
}: ComputeAnnotationPositionUsingHeuristicsProps): ComputeAnnotationPositionUsingHeuristicsResult | null {
  const scrollParents = getActiveScrollParents(target) ?? [
    document.documentElement,
  ];
  // Reasons for distinction between scrollParent and (ex-HTML) innerScrollContainer:
  // - Calculation of relative y is different (we don't need to add HTML scrollTop)
  // - We don't need to consider position of arrow versus HTML - viewport suffices
  const innerScrollContainer = findLast(
    scrollParents.filter((el) => el.nodeName !== 'HTML'),
  );
  const hasInnerScrollContainer = Boolean(innerScrollContainer);

  const closestScrollParent = innerScrollContainer ?? document.documentElement;
  if (!closestScrollParent) {
    return null;
  }

  const closestScrollParentRect = closestScrollParent.getBoundingClientRect();

  // If text element, position pointer by hooking onto same part of text
  if (textConfig) {
    const positionFromText = getPositionFromTextAtPointConfig(
      document,
      target,
      textConfig,
    );
    if (positionFromText) {
      xVsViewport = positionFromText.x;
      yVsViewport = positionFromText.y;
    }
  }

  let yVsClosestScrollParent = yVsViewport - closestScrollParentRect.y;
  let xVsClosestScrollParent = xVsViewport - closestScrollParentRect.x;
  if (hasInnerScrollContainer) {
    yVsClosestScrollParent += closestScrollParent.scrollTop;
    xVsClosestScrollParent += closestScrollParent.scrollLeft;
  }

  const cantScrollToAnnotation =
    yVsClosestScrollParent < 0 ||
    yVsClosestScrollParent > closestScrollParent.scrollHeight ||
    xVsClosestScrollParent < 0 ||
    xVsClosestScrollParent > closestScrollParent.scrollWidth;
  if (cantScrollToAnnotation) {
    return null;
  }

  const offScreen =
    yVsViewport < 0 ||
    xVsViewport < 0 ||
    yVsViewport > window.innerHeight ||
    xVsViewport > rightBoundary;
  const outsideScrollContainer =
    hasInnerScrollContainer &&
    (yVsViewport < closestScrollParentRect.y ||
      xVsViewport < closestScrollParentRect.x ||
      yVsViewport > closestScrollParentRect.bottom ||
      xVsViewport > closestScrollParentRect.right);

  const visible = !offScreen && !outsideScrollContainer;

  return {
    visible,
    hasInnerScrollContainer,
    closestScrollParentRect,
    xVsClosestScrollParent,
    yVsClosestScrollParent,
  };
}
