import { Colors } from 'common/const/Colors.ts';
import type { HighlightedTextConfig } from 'common/types/index.ts';
import { getSelectionTextNodes } from 'external/src/delegate/location/textHighlights.ts';
import type { InputOrTextArea } from 'external/src/delegate/location/util.ts';
import {
  getNodesFromRange,
  isInputOrTextArea,
} from 'external/src/delegate/location/util.ts';
import { ALL_STYLES } from 'external/src/lib/nativeScreenshot/util/getStylesToClone.ts';
import { StyleCloner } from 'external/src/lib/nativeScreenshot/elementCloner/StyleCloner.ts';
import { getSelector } from 'external/src/lib/getSelector/index.ts';
import type { BasicLogger } from 'external/src/delegate/BasicLogger.ts';

let emptyInputTextNodes = new WeakSet();

const INPUT_TYPES_TO_CONVERT = [
  'email',
  'password',
  'search',
  'tel',
  'text',
  'textarea',
  'url',
];
function isValidInputOrTextArea(node: Node): node is InputOrTextArea {
  return isInputOrTextArea(node) && INPUT_TYPES_TO_CONVERT.includes(node.type);
}

// We convert inputs and text areas to divs so that we can wrap <mark /> tags
// around the selected text
function convertInputOrTextAreaToDiv(
  inputOrTextArea: InputOrTextArea,
): ChildNode {
  const div = document.createElement('div');
  const inputValue = inputOrTextArea.value;
  const empty = !inputValue;
  div.innerHTML = empty ? inputOrTextArea.placeholder : inputOrTextArea.value;
  for (const style of ALL_STYLES) {
    div.style[style as any] = inputOrTextArea.style[style as any];
  }
  const styleCloner = new StyleCloner({
    nativeNode: inputOrTextArea,
    containingWindow: window,
    containingDocument: document,
  });
  styleCloner.clonePseudoElements(div);
  inputOrTextArea.replaceWith(div);
  const textNode = div.childNodes[0];
  if (empty) {
    emptyInputTextNodes.add(textNode);
  }
  return textNode;
}

function getSelectorForNativeScreenshot(
  selector: string,
  containingDocument: Document,
  nativeRoot: HTMLElement,
) {
  // HTML & Body not present in clone
  // Pictures are removed / replaced with their child image
  const replaceBodyHTMLTag = /(^| +)body >/; // Doesn't remove e.g. `.body`, or `#body`
  const replaceHtmlHTMLTag = /(^| +)html >/;
  const clonedElement = nativeRoot.querySelector(
    selector
      .replace(replaceHtmlHTMLTag, '')
      .replace(replaceBodyHTMLTag, '')
      .replaceAll('picture', 'img'),
  );

  if (clonedElement) {
    return clonedElement;
  }

  // We couldn't find the clonedElement. This might be because
  // the original selector had `[style=]` in it, and this doesn't
  // work for native screenshots as the inline style changes.
  // The fallback logic is to re-compute a selector which doesn't
  // have `[style=]` in it.
  const originalElement = containingDocument.querySelector(selector);
  if (!originalElement) {
    return null;
  }

  const clonedElementSelector = getSelector(originalElement, nativeRoot, {
    selectorForNativeScreenshot: true,
  })
    ?.replace(replaceHtmlHTMLTag, '')
    .replace(replaceBodyHTMLTag, '')
    .replaceAll('picture', 'img');

  return clonedElementSelector
    ? nativeRoot.querySelector(clonedElementSelector)
    : null;
}

export function highlightTextForNativeScreenshot(
  config: HighlightedTextConfig,
  nativeRoot: HTMLElement,
  containingDocument: Document,
  logger: BasicLogger,
) {
  const { startElementSelector, endElementSelector } = config;
  emptyInputTextNodes = new WeakSet();

  const startElement = getSelectorForNativeScreenshot(
    startElementSelector,
    containingDocument,
    nativeRoot,
  );
  const endElement = getSelectorForNativeScreenshot(
    endElementSelector,
    containingDocument,
    nativeRoot,
  );

  if (!startElement || !endElement) {
    return false;
  }

  let startNode = startElement.childNodes[config.startNodeIndex];
  let endNode = endElement.childNodes[config.endNodeIndex];

  if (isValidInputOrTextArea(startElement)) {
    startNode = convertInputOrTextAreaToDiv(startElement);
  }
  if (isValidInputOrTextArea(endElement)) {
    if (startElement === endElement) {
      endNode = startNode;
    } else {
      endNode = convertInputOrTextAreaToDiv(endElement);
    }
  }

  // For native screenshots, we unwrap images from pictures. The startNodeOffset
  // will be wrong in this case. The following logic simply sets the offsets to
  // zero if either node is an image. The offset being wrong doesn't matter
  // because we can't highlight the screenshot anyway
  const startNodeOffset =
    startNode.nodeName === 'IMG' ? 0 : config.startNodeOffset;
  const endNodeOffset = endNode.nodeName === 'IMG' ? 0 : config.endNodeOffset;

  const range = containingDocument.createRange();
  range.setStart(startNode, startNodeOffset);
  range.setEnd(endNode, endNodeOffset);

  const textAreasAndInputs = getNodesFromRange(
    range,
    isValidInputOrTextArea,
    containingDocument,
  );
  for (const element of textAreasAndInputs) {
    convertInputOrTextAreaToDiv(element);
  }

  const nodes = getSelectionTextNodes(range);
  for (const node of nodes) {
    const isFirstNode = node === startNode;
    const isLastNode = node === endNode;
    highlightTextNode(
      node,
      logger,
      isFirstNode ? range.startOffset : 0,
      isLastNode ? range.endOffset : undefined,
    );
  }

  return true;
}

function highlightTextNode(
  node: Node,
  logger: BasicLogger,
  startOffset = 0,
  endOffset = node.textContent?.length ?? 0,
) {
  const mark = document.createElement('mark');
  mark.style.backgroundColor = Colors.ACID_YELLOW;
  // Empty inputs show their placeholder, which should be lighter
  mark.style.color = emptyInputTextNodes.has(node)
    ? Colors.GREY_DARK
    : Colors.GREY_X_DARK;
  // When rendered in svg <foreignObject/>s, mark tags seem to add around 0.1px
  // to width. This can cause the text to overflow to a second line, making the
  // screenshot look wrong. An example is shown here:
  // https://codesandbox.io/s/boring-driscoll-rzx0x?file=/index.html. To get
  // around this, we remove 0.2px of width via negative margin left/right.
  mark.style.marginLeft = '-0.1px';
  mark.style.marginRight = '-0.1px';
  try {
    const newRange = new Range();
    newRange.setStart(node, startOffset);
    newRange.setEnd(node, endOffset);
    newRange.surroundContents(mark);
  } catch (error: any) {
    logger.logWarning('failed-to-highlight-text-node-native-screenshot', {
      targetNodeName: node.nodeName,
    });
    console.warn('Failed to highlight text node: ', error.message);
  }
}
