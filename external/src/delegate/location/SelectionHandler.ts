import type { Point2D } from 'common/types/index.ts';
import {
  CORD_SELECTION_CLASSNAME,
  createHighlightedTextConfig,
  createSelectionStylesheet,
} from 'external/src/delegate/location/textHighlights.ts';
import {
  caretPositionFromPoint,
  getPositionRelativeToElement,
  isIframe,
  isInputOrTextArea,
} from 'external/src/delegate/location/util.ts';
import { sendEmbedXFrameMessage } from 'external/src/embed/embedXFrame/index.ts';
import type { BasicLogger } from 'external/src/delegate/BasicLogger.ts';
import { removeLinebreaks } from 'external/src/lib/util.ts';

type PositionAtPoint = ReturnType<typeof caretPositionFromPoint>;

export class SelectionHandler {
  iframeElement: HTMLIFrameElement | null = null;
  iframeNotReachable: boolean | null = null;
  selection: Selection;
  initialTarget: Element | null = null;
  selectedInputOrTextArea = false;

  private loggerRef: { current: BasicLogger };
  private overlayRef?: { current: HTMLElement | null };
  private selectionStylesheet: HTMLStyleElement;
  private prevPositionAtPoint: PositionAtPoint | null = null;

  constructor({
    loggerRef,
    overlayRef,
  }: {
    loggerRef: { current: BasicLogger };
    overlayRef?: { current: HTMLElement | null };
  }) {
    this.selectionStylesheet = createSelectionStylesheet();
    this.selection = window.getSelection()!;
    this.loggerRef = loggerRef;
    this.overlayRef = overlayRef;
    this.clearSelection();
    this.addSelectionStyles();
  }

  private addSelectionStyles() {
    document.body.appendChild(this.selectionStylesheet);
    // Clients can target `.cord-selection *::selection` to set their own
    // selection style.
    document.body.classList.add(CORD_SELECTION_CLASSNAME);
  }

  private removeSelectionStyles() {
    this.selectionStylesheet.remove();
    document.body.classList.remove(CORD_SELECTION_CLASSNAME);
  }

  private clearSelection() {
    this.selection.removeAllRanges();
  }

  cleanup() {
    this.removeSelectionStyles();
  }

  async setInitialSelection({ x, y, target }: Point2D & { target?: Element }) {
    const elementAtPoint = target ?? document.elementFromPoint(x, y);
    this.initialTarget = elementAtPoint;
    if (isInputOrTextArea(elementAtPoint)) {
      this.selectedInputOrTextArea = true;
      return;
    }
    if (elementAtPoint && isIframe(elementAtPoint)) {
      this.iframeElement = elementAtPoint;
      try {
        await sendEmbedXFrameMessage(
          elementAtPoint.contentWindow,
          'CORD_SET_INITIAL_SELECTION',
          {
            position: getPositionRelativeToElement(
              { x, y },
              this.iframeElement,
            ),
          },
        );
      } catch {
        // Script prob not in IFrame
        this.iframeElement = null;
        this.initialTarget = null;
      }
      return;
    }
    const positionAtPoint = this.getCaretPositionAtPoint(x, y);
    if (positionAtPoint) {
      const range = new Range();
      const { textNode, offset } = positionAtPoint;
      range.setStart(textNode, offset);
      range.setEnd(textNode, offset);
      this.selection.addRange(range);
    }
  }

  async extendSelection({ x, y }: Point2D) {
    if (this.selectedInputOrTextArea) {
      return { selectionChanged: false };
    }
    if (this.iframeElement) {
      try {
        return await sendEmbedXFrameMessage(
          this.iframeElement.contentWindow,
          'CORD_EXTEND_SELECTION',
          {
            position: getPositionRelativeToElement(
              { x, y },
              this.iframeElement,
            ),
          },
        );
      } catch {
        // Do nothing
        return { selectionChanged: false };
      }
    }
    const positionAtPoint = this.getCaretPositionAtPoint(x, y);
    if (
      this.selection?.rangeCount &&
      positionAtPoint &&
      positionAtPoint !== this.prevPositionAtPoint
    ) {
      this.prevPositionAtPoint = positionAtPoint;
      this.selection.extend(positionAtPoint.textNode, positionAtPoint.offset);
      return { selectionChanged: true };
    }
    return { selectionChanged: false };
  }

  async hasSelectedText() {
    if (this.iframeElement) {
      return await sendEmbedXFrameMessage(
        this.iframeElement.contentWindow,
        'CORD_IS_TEXT_SELECTED',
      );
    }
    const selection = this.selection;
    if (!selection || !selection.rangeCount) {
      return false;
    }
    const range = selection.getRangeAt(0);
    if (!range) {
      return false;
    }
    const selectedText = removeLinebreaks(range.toString() ?? '');
    if (selectedText) {
      return true;
    }

    // Known Mozilla bug: https://bugzilla.mozilla.org/show_bug.cgi?id=85686
    // selection.toString() returns an empty string if selected
    // text is inside inputs/textareas;
    if (!selectedText && isInputOrTextArea(this.initialTarget)) {
      const { selectionStart, selectionEnd } = this.initialTarget;
      const selectedTextInsideInputOrTextarea =
        this.initialTarget.value.substring(
          selectionStart ?? 0,
          selectionEnd ?? 0,
        );
      return selectedTextInsideInputOrTextarea.length >= 1;
    }

    return false;
  }

  getHighlightedTextConfig(hashAnnotations: boolean) {
    if (!this.initialTarget) {
      return null;
    }
    return createHighlightedTextConfig({
      selection: this.selection,
      target: this.initialTarget,
      logger: this.loggerRef.current,
      iframe: null,
      hashAnnotations,
    });
  }

  private getCaretPositionAtPoint(x: number, y: number) {
    const overlay = this.overlayRef?.current ?? null;
    const initialOverlayPointerEvents = overlay?.style.pointerEvents;
    if (overlay) {
      // Stop overlay blocking while getting caret position
      overlay.style.pointerEvents = 'none';
    }
    const position = caretPositionFromPoint(
      document,
      { x, y },
      this.loggerRef.current.logWarning,
    );
    if (overlay) {
      // Set overlay pointerEvents back to initial value
      overlay.style.pointerEvents = initialOverlayPointerEvents!;
    }
    return position;
  }
}
