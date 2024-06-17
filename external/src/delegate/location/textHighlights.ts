import { Colors } from 'common/const/Colors.ts';
import type { HighlightedTextConfig, UUID } from 'common/types/index.ts';
import {
  getNodesFromRange,
  isIframe,
  isInputOrTextArea,
  isTextNode,
} from 'external/src/delegate/location/util.ts';
import { getSidebarXPosition } from 'external/src/delegate/util.ts';
import { getSelector } from 'external/src/lib/getSelector/index.ts';
import { TYPEFORM_TEXT_TOOLBAR_CLASS } from 'external/src/lib/nativeScreenshot/options.ts';
import { matchesHash, sha256HashAndSalt } from 'common/util/index.ts';
import type { BasicLogger } from 'external/src/delegate/BasicLogger.ts';
import { sendEmbedXFrameMessage } from 'external/src/embed/embedXFrame/index.ts';
import { CORD_ANNOTATION_ALLOWED_DATA_ATTRIBUTE } from '@cord-sdk/types';
import { cordifyClassname } from 'common/ui/style.ts';

const MAX_TEXT_TO_DISPLAY_LENGTH = 500;
const SELECTION_TOO_FAR_OFF_SCREEN_PX = 50;

let textHighlightVisible: null | {
  id: UUID;
  highlightedTextConfig: HighlightedTextConfig;
  iframe: HTMLIFrameElement | null;
} = null;

type Rect = {
  top: number;
  left: number;
  right: number;
  bottom: number;
};

export const CORD_SELECTION_CLASSNAME = cordifyClassname('selection');

export function createSelectionStylesheet() {
  const selectionStylesheet = document.createElement('style');
  selectionStylesheet.appendChild(
    document.createTextNode(`
     :where(.${CORD_SELECTION_CLASSNAME}) *::selection {
        background-color: ${Colors.ACID_YELLOW};
        color: ${Colors.GREY_X_DARK};
      }
      :where(.${CORD_SELECTION_CLASSNAME}) *[${CORD_ANNOTATION_ALLOWED_DATA_ATTRIBUTE}="false"]::selection {
        background-color: highlight;
        color: inherit;
      }
      :where(.${CORD_SELECTION_CLASSNAME}) input:placeholder-shown::selection {
        color: ${Colors.GREY_DARK};
      }
      :where(.${CORD_SELECTION_CLASSNAME}) textarea:placeholder-shown::selection {
        color: ${Colors.GREY_DARK};
      }
      :where(.${CORD_SELECTION_CLASSNAME}) * {
        user-select: text;
      }
      :where(.${CORD_SELECTION_CLASSNAME}) *::before, :where(.${CORD_SELECTION_CLASSNAME}) *::after {
        pointer-events: none;
      }
    `),
  );
  return selectionStylesheet;
}

const selectionStylesheet = createSelectionStylesheet();
function turnOnTextHighlightStyles() {
  document.body.appendChild(selectionStylesheet);
  // Clients can target `.cord-selection *::selection` to set their own
  // selection style.
  document.body.classList.add(CORD_SELECTION_CLASSNAME);
}
function turnOffTextHighlightStyles() {
  selectionStylesheet.remove();
  document.body.classList.remove(CORD_SELECTION_CLASSNAME);
}

function getTextHighlightRange(config: HighlightedTextConfig) {
  const startElement = document.querySelector(config.startElementSelector);
  const endElement = document.querySelector(config.endElementSelector);

  if (!startElement || !endElement) {
    return;
  }
  const startNode = startElement.childNodes[config.startNodeIndex];
  const endNode = endElement.childNodes[config.endNodeIndex];
  if (!startNode || !endNode) {
    return;
  }
  const range = document.createRange();

  try {
    range.setStart(startNode, config.startNodeOffset);
    range.setEnd(endNode, config.endNodeOffset);
  } catch (error) {
    // setEnd throws if we pass an offset greater than the node length.
    // E.g. user selects 100 chars, text gets edited to only have 50 chars.
    // Instead of crashing the UI, we swallow this error. A tooltip is shown
    // to the user.
    return null;
  }

  return range;
}

export function showTextHighlight(
  annotationID: UUID,
  config: HighlightedTextConfig,
  iframeSelectors: string[],
) {
  const [selector, ...remainingSelectors] = iframeSelectors;
  if (selector) {
    const iframe = document.querySelector(selector);
    if (!iframe || !isIframe(iframe)) {
      return;
    }
    try {
      void sendEmbedXFrameMessage(
        iframe.contentWindow,
        'CORD_SHOW_TEXT_HIGHLIGHT',
        {
          annotationID,
          highlightedTextConfig: config,
          iframeSelectors: remainingSelectors,
        },
      );
      textHighlightVisible = {
        id: annotationID,
        iframe,
        highlightedTextConfig: config,
      };
    } catch {
      // Continue
    }
    return;
  }
  const selection = window.getSelection();
  if (!selection) {
    console.warn('No selection');
    return;
  }
  if (!isHighlightedTextPresent(config)) {
    console.warn('Highlighted text not found');
    return;
  }

  const startElement = document.querySelector(config.startElementSelector);
  if (startElement && isInputOrTextArea(startElement)) {
    try {
      const initialIsDisabled = startElement.disabled;
      if (initialIsDisabled) {
        startElement.disabled = false;
      }
      startElement.blur();
      startElement.focus();
      startElement.setSelectionRange(
        config.startNodeOffset,
        config.endNodeOffset,
      );
      startElement.disabled = initialIsDisabled;
    } catch (error) {
      if (error instanceof DOMException) {
        console.warn(error.message);
      }
    }
  } else {
    const range = getTextHighlightRange(config);
    if (!range) {
      console.warn('No range available');
      return;
    }
    selection.empty();

    // This fixes a Typeform edge case: blurring the active element
    // will prevent typeform text toolbar to appear.
    if (document?.activeElement) {
      (document.activeElement as HTMLElement)?.blur();
    }
    selection.addRange(range);
  }

  turnOnTextHighlightStyles();
  textHighlightVisible = {
    id: annotationID,
    iframe: null,
    highlightedTextConfig: config,
  };
}

function getNonHiddenTypeformTooltip(containingDocument: Document) {
  return containingDocument.querySelector(
    `.${TYPEFORM_TEXT_TOOLBAR_CLASS}:not(.ql-hidden)`,
  );
}

export function hideTypeformTooltip(containingDocument: Document) {
  const tooltip = getNonHiddenTypeformTooltip(containingDocument);

  if (tooltip) {
    // Adding `ql-hidden` hides the tooltip
    // https://github.com/quilljs/quill/blob/HEAD/ui/tooltip.js#L16
    tooltip.classList.add('ql-hidden');
  }
}

export function removeTextHighlight(annotationID: UUID) {
  if (!textHighlightVisible) {
    return;
  }
  if (annotationID !== textHighlightVisible.id) {
    console.warn('Attempting to remove a highlight that is not highlighted');
    return;
  }
  const { highlightedTextConfig, iframe } = textHighlightVisible;
  if (iframe) {
    void sendEmbedXFrameMessage(
      iframe.contentWindow,
      'CORD_HIDE_TEXT_HIGHLIGHT',
      {
        annotationID,
      },
    );
    textHighlightVisible = null;
    return;
  }
  const { startElementSelector } = highlightedTextConfig;
  const selection = window.getSelection();
  if (!selection?.isCollapsed) {
    selection?.empty();
  }
  const startElement = startElementSelector
    ? document.querySelector(startElementSelector)
    : null;

  // getSelection().empty() doesn't work if text was selected
  // inside inputs/textareas in Firefox
  if (startElement && isInputOrTextArea(startElement)) {
    startElement.setSelectionRange(0, 0);
    startElement.blur();
  }
  turnOffTextHighlightStyles();
  textHighlightVisible = null;
}

export function createHighlightedTextConfig({
  hashAnnotations,
  iframe,
  logger,
  selection,
  target,
}: {
  selection: Selection;
  target: Element;
  logger: BasicLogger;
  iframe: HTMLIFrameElement | null;
  hashAnnotations: boolean;
}): HighlightedTextConfig | null {
  if (!selection.rangeCount) {
    return null;
  }
  const selectedTextOutsideInputsOrTextAreas = !isInputOrTextArea(target);
  if (selectedTextOutsideInputsOrTextAreas) {
    const range = selection.getRangeAt(0);
    const textToDisplay = hashAnnotations
      ? 'Annotation' // Do not show hash, default to "Annotation"
      : rangeToTextToDisplay(range);
    const selectedText = hashAnnotations
      ? sha256HashAndSalt(range.toString())
      : range.toString();

    const { startContainer, endContainer, startOffset, endOffset } = range;
    const startElement = startContainer.parentElement;
    const endElement = endContainer.parentElement;
    if (!startElement || !endElement) {
      throw new Error('No start element and/or end element');
    }
    logger.logEvent('create-text-annotation', {
      targetNodeName: startElement.nodeName,
      insideIframe: Boolean(iframe),
      textLength: textToDisplay.length,
    });

    const startElementSelector = getSelector(
      startElement,
      iframe?.contentDocument ?? undefined,
    );
    const endElementSelector = getSelector(
      endElement,
      iframe?.contentDocument ?? undefined,
    );

    if (!startElementSelector || !endElementSelector) {
      return null;
    }

    return {
      startElementSelector,
      endElementSelector,
      startNodeIndex: [...startElement.childNodes].indexOf(
        startContainer as ChildNode,
      ),
      startNodeOffset: startOffset,
      endNodeIndex: [...endElement.childNodes].indexOf(
        endContainer as ChildNode,
      ),
      endNodeOffset: endOffset,
      selectedText,
      textToDisplay,
    };
  } else {
    const inputEl = target;
    const { selectionStart, selectionEnd } = inputEl;
    const startNodeOffset = selectionStart ?? 0;
    const endNodeOffset = selectionEnd ?? 0;

    const text = hashAnnotations
      ? sha256HashAndSalt(inputEl.value.slice(startNodeOffset, endNodeOffset))
      : inputEl.value.slice(startNodeOffset, endNodeOffset);

    logger.logEvent('create-text-annotation', {
      targetNodeName: inputEl.nodeName,
      insideIframe: Boolean(iframe),
      textLength: text.length,
    });

    const selector = getSelector(inputEl, iframe?.contentDocument ?? undefined);
    if (!selector) {
      return null;
    }

    return {
      startElementSelector: selector,
      endElementSelector: selector,
      startNodeIndex: 0,
      startNodeOffset,
      endNodeIndex: 0,
      endNodeOffset,
      selectedText: text,
      textToDisplay: text,
    };
  }
}

/** Similar to `element.getClientRects()`, but works on a Node */
function getClientRectsFromNode(
  node: Node,
  containingDocument: Document,
  options?: { startOffset?: number; endOffset?: number },
): Rect[] | null {
  const range = containingDocument.createRange();
  try {
    if (options) {
      range.setStart(node, options.startOffset ?? 0);
      range.setEnd(node, options.endOffset ?? node.textContent?.length ?? 0);
    } else {
      range.selectNodeContents(node);
    }

    return [...range.getClientRects()];
  } catch (error: any) {
    console.warn(`Couldn't get node rects. ${error?.message}`);
    return null;
  }
}

export function getRightmostHighlightedVisibleElement(
  selection: Selection,
  target: Element,
  inIframe: boolean,
) {
  if (isInputOrTextArea(target) || !selection.rangeCount) {
    return null; // Fallback to mouse position;
  }

  const range = selection.getRangeAt(0);
  const { startOffset, endOffset } = range;
  const rightLimit = inIframe ? window.innerWidth : getSidebarXPosition();

  const textNodes = getSelectionTextNodes(range);

  let rightmostVisibleRect: {
    top: number;
    right: number;
    bottom: number;
  } | null = null;
  for (const node of textNodes) {
    const isFirstNode = node === range.startContainer;
    const isLastNode = node === range.endContainer;
    const rects = getClientRectsFromNode(
      node,
      document,
      // Last node could be partially selected, so use the offset.
      {
        startOffset: isFirstNode ? startOffset : undefined,
        endOffset: isLastNode ? endOffset : undefined,
      },
    );

    if (!rects) {
      continue;
    }
    for (const rect of rects) {
      const rectNotVisible =
        rect.right > rightLimit ||
        rect.top < 0 ||
        rect.bottom >
          (window.innerHeight || document.documentElement.clientHeight);
      if (!rect || rectNotVisible) {
        continue;
      }

      if (rect.right > (rightmostVisibleRect?.right ?? 0)) {
        rightmostVisibleRect = rect;
      }
    }
  }

  // All the selection rects are covered by Cord sidebar.
  // Point to the middle of the topmost rectangle.
  if (!rightmostVisibleRect) {
    const topmostNode = textNodes[0];
    let topmostRect = getClientRectsFromNode(topmostNode, document, {
      startOffset,
      endOffset,
    })?.[0];

    if (!topmostRect) {
      topmostRect = selection.getRangeAt(0).getClientRects()[0];
      if (!topmostRect) {
        return null;
      }
    }

    const middleOfVisibleRect = (rightLimit - topmostRect.left) / 2;
    return { x: rightLimit - middleOfVisibleRect, y: topmostRect.top };
  }

  return {
    x: rightmostVisibleRect.right,
    y: (rightmostVisibleRect.top + rightmostVisibleRect.bottom) / 2,
  };
}

export function getSelectionTextNodes(range: Range) {
  return getNodesFromRange(
    range,
    (node): node is Text => {
      const nodeHasText = (node.textContent?.trim()?.length ?? 0) > 0;
      return isTextNode(node) && nodeHasText;
    },
    document,
  );
}

export function isHighlightedTextPresent(config: HighlightedTextConfig) {
  // const { containingDocument } = getContainingWindowAndDocument(config);
  const startElement = document.querySelector(config.startElementSelector);
  const endElement = document.querySelector(config.endElementSelector);

  if (!startElement || !endElement) {
    return false;
  }
  const offScreen =
    startElement.getClientRects().length === 0 ||
    endElement.getClientRects().length === 0;
  if (offScreen) {
    return false;
  }

  if (isInputOrTextArea(startElement)) {
    try {
      const textValue = startElement.value.slice(
        config.startNodeOffset,
        config.endNodeOffset,
      );

      return (
        config.selectedText === textValue ||
        matchesHash(textValue, config.selectedText)
      );
    } catch (error) {
      return false;
    }
  }

  const range = getTextHighlightRange(config);
  if (!range) {
    return false;
  }

  const selectedText = range.toString();
  return (
    config.selectedText === selectedText ||
    matchesHash(selectedText, config.selectedText)
  );
}

export function getTextHighlightDisplayText(
  config: HighlightedTextConfig | null | undefined,
) {
  if (!config) {
    return undefined;
  }
  return (config.textToDisplay ?? config.selectedText).replaceAll('\n', ' ');
}

function isVisible(elem: HTMLElement) {
  if (
    !(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length)
  ) {
    return false;
  }
  const style = getComputedStyle(elem);
  return style.opacity !== '0' && style.visibility === 'visible';
}

// selection.toString() seems to be buggy with our method of programatically
// selecting text, so we use our own function. Specifically,
// selection.toString() can return an empty string even when there is a
// selection on the page
function rangeToTextToDisplay(range: Range) {
  let textToDisplay = '';
  const nodes = getNodesFromRange(
    range,
    (node): node is Text => {
      if (isTextNode(node) && node.parentElement) {
        return isVisible(node.parentElement);
      } else {
        return false;
      }
    },
    document,
  );
  for (const [index, node] of nodes.entries()) {
    const shouldAddSpace = textToDisplay.trim().length > 0;

    const nodeIsEmpty = (node.textContent?.trim()?.length ?? 0) === 0;
    if (nodeIsEmpty) {
      if (shouldAddSpace) {
        textToDisplay += ' ';
      }
      continue;
    }

    const startOffset = index === 0 ? range.startOffset : 0;
    const endOffset = index === nodes.length - 1 ? range.endOffset : undefined;
    textToDisplay += node.textContent?.slice(startOffset, endOffset) ?? '';
    if (textToDisplay.length > MAX_TEXT_TO_DISPLAY_LENGTH) {
      textToDisplay = textToDisplay.slice(0, MAX_TEXT_TO_DISPLAY_LENGTH);
      break;
    }
    if (shouldAddSpace && !textToDisplay.endsWith(' ')) {
      textToDisplay += ' ';
    }
  }
  return textToDisplay;
}

/**
 * If the selection spans multiple lines, there will be many rects.
 * Rects are in content order (CCSOM spec), so the rect[0] will be
 * the first one we encounter on the page.
 */
function getSelectionRects() {
  const selection = window.getSelection();

  if (!selection || selection.isCollapsed || !selection.rangeCount) {
    return null;
  }

  return selection.getRangeAt(0).getClientRects();
}

export function isSelectionBackwards() {
  const selection = window.getSelection();
  const range = document.createRange();

  if (!selection?.anchorNode || !selection?.focusNode) {
    return;
  }

  range.setStart(selection.anchorNode, selection.anchorOffset);
  range.setEnd(selection.focusNode, selection.focusOffset);

  return !range.collapsed;
}

export function isSelectionTooFarOffScreen(args?: {
  additionalMargins?: number;
  range?: Range;
}): 'up' | 'down' | null {
  const bottommostSelectionRect = getBottommostSelectionRect(args?.range);

  if (!bottommostSelectionRect) {
    return null;
  }

  const tooFarDown = Boolean(
    bottommostSelectionRect.top +
      bottommostSelectionRect.height +
      (args?.additionalMargins ?? 0) -
      window.innerHeight >
      SELECTION_TOO_FAR_OFF_SCREEN_PX,
  );
  if (tooFarDown) {
    return 'down';
  }

  const tooFarUp =
    bottommostSelectionRect.y + (args?.additionalMargins ?? 0) <
    -SELECTION_TOO_FAR_OFF_SCREEN_PX;
  if (tooFarUp) {
    return 'up';
  }

  return null;
}

export function getTopmostSelectionRect(range?: Range) {
  return range ? range.getClientRects()[0] : getSelectionRects()?.[0];
}

export function getBottommostSelectionRect(range?: Range) {
  const rects = range ? range.getClientRects() : getSelectionRects();
  if (!rects || rects.length === 0) {
    return null;
  }

  return rects[rects.length - 1];
}

export function getRangeFromHighlightedTextConfig(
  highlightedTextConfig: HighlightedTextConfig,
) {
  try {
    const {
      startElementSelector,
      startNodeOffset,
      startNodeIndex,
      endElementSelector,
      endNodeOffset,
      endNodeIndex,
    } = highlightedTextConfig;

    const startNode =
      document.querySelector(startElementSelector)?.childNodes[startNodeIndex];
    const endNode =
      document.querySelector(endElementSelector)?.childNodes[endNodeIndex];

    if (!startNode || !endNode) {
      return null;
    }

    const range = document.createRange();
    range.setStart(startNode, startNodeOffset);
    range.setEnd(endNode, endNodeOffset);
    return range;
  } catch (e) {
    console.error(e);
    throw e;
  }
}
