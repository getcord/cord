import { isDiv } from 'external/src/lib/nativeScreenshot/util/nodeTypeCheckers.ts';
import { getCssText } from 'external/src/lib/util.ts';
import type { Point2D } from 'common/types/index.ts';
import { Sizes } from 'common/const/Sizes.ts';
import type { AnnotationPosition } from 'external/src/delegate/annotations/types.ts';

export const MONACO_SELECTORS = {
  linesContainer: '.view-lines',
  singleLine: '.view-line',
  editorContainer: '[data-mprt="3"].overflow-guard',
};

export function isWithinMonacoEditor(element: Element) {
  const monacoEditor = element.closest(MONACO_SELECTORS.editorContainer);
  return Boolean(monacoEditor);
}

export function isMonacoLine(element: Element) {
  return `.${element.className}` === MONACO_SELECTORS.singleLine;
}

export function getMonacoLineSelector(element: Element) {
  if (isMonacoLine(element)) {
    return `[style="${getCssText(element)}"]`;
  }

  return null;
}

function getMonacoLine(
  element: Element | null,
  linesContainer: Element | null,
) {
  if (!linesContainer) {
    return null;
  }

  const lineBelongsToIntendedMonacoEditor =
    element?.parentElement === linesContainer;
  if (element && isMonacoLine(element) && lineBelongsToIntendedMonacoEditor) {
    return element;
  }

  // User can click on a line's <span> child, hence why we check the parent
  const closestParentLine = element?.closest(MONACO_SELECTORS.singleLine);
  const parentLineBelongsToIntendedMonacoEditor =
    closestParentLine?.parentElement === linesContainer;
  if (closestParentLine && parentLineBelongsToIntendedMonacoEditor) {
    return closestParentLine;
  }

  return null;
}

// Starting from where the user clicked, search left/right until we bump into
// a Monaco Editor line we already know how to handle.
// This deals with users clicking on a line number or the scrollbar.
// If we cannot find a line, users likely clicked at the bottom of a file,
// so hook to the bottom most line.
export function findClosestMonacoLine(
  { x, y }: Point2D,
  // Used to find the line in a specific Monaco Editor (in case there are >1)
  linesContainer: Element | null,
): Element | null {
  let distance = 0;
  while (distance <= 100) {
    distance += 10;
    const elementToTheRight = document.elementFromPoint(x + distance, y);
    let closestLine = getMonacoLine(elementToTheRight, linesContainer);
    if (closestLine) {
      return closestLine;
    }

    const elementToTheLeft = document.elementFromPoint(x - distance, y);
    closestLine = getMonacoLine(elementToTheLeft, linesContainer);
    if (closestLine) {
      return closestLine;
    }
  }

  distance = 0;
  while (distance <= 500) {
    distance += 10;
    const elementAbove = document.elementFromPoint(x, y - distance);
    const closestLine = getMonacoLine(elementAbove, linesContainer);
    if (closestLine) {
      return closestLine;
    }
  }

  return null;
}

export function calculateMonacoLineNumberFromStyle(line: Element | null) {
  // Should not happen if we pass the right `line`
  if (!line || !isDiv(line)) {
    return -1;
  }
  const { top, height } = line.style;
  if (!top || !height) {
    return -1;
  }
  return Math.floor(parseInt(top) / parseInt(height)) + 1;
}

const PADDING = Sizes.LARGE;
/**
 * We render the floating element to the side of the annotation pin.
 * We want to minimize the element jumping around, so we don't
 * move the it if users can scroll to reveal its contents.
 * So, we only move it if the annotation is close to the bottom
 * of the page, or to the right side of the page.
 */
export function getFloatingElementCoords(
  annotationPosition: AnnotationPosition,
  floatingElementRect: DOMRect | undefined,
  pinSize: number,
) {
  let { xVsViewport, yVsViewport } = annotationPosition;
  const pin = {
    width: pinSize,
    height: pinSize,
  };

  yVsViewport -= pin.height;
  xVsViewport += pin.width + PADDING / 2;

  const bottomOfViewport = window.scrollY + window.innerHeight;
  const bottomOfAllContent =
    document.scrollingElement?.scrollHeight ?? bottomOfViewport;
  // E.g. annotation very close to the bottom of the page.
  const threadBelowScrollableContent =
    window.scrollY +
      yVsViewport +
      (floatingElementRect?.height ?? 0) +
      PADDING >
    bottomOfAllContent;
  const pinStillOnScreen = window.scrollY + yVsViewport < bottomOfViewport;
  if (threadBelowScrollableContent && pinStillOnScreen) {
    yVsViewport =
      window.innerHeight - (floatingElementRect?.height ?? 0) - PADDING;
  }

  const rightEdgeOfViewport = window.scrollX + window.innerWidth;
  const rightEdgeOfAllContent =
    document.scrollingElement?.scrollWidth ?? rightEdgeOfViewport;
  const threadOutisdeScrollableContent =
    window.scrollX + xVsViewport + (floatingElementRect?.width ?? 0) + PADDING >
    rightEdgeOfAllContent;
  if (threadOutisdeScrollableContent) {
    xVsViewport -= pin.width + (floatingElementRect?.width ?? 0) + PADDING;
  }

  return {
    left: xVsViewport,
    top: yVsViewport,
  };
}
