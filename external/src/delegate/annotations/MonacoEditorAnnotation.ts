import type { DocumentLocation } from 'common/types/index.ts';
import { ElementIdentifierMatch, LocationMatch } from 'common/types/index.ts';
import { assert } from 'common/util/index.ts';
import type { MonacoEditorWrapper } from 'external/src/delegate/annotations/MonacoEditors.ts';
import type { BaseAnnotation } from 'external/src/delegate/annotations/types.ts';
import { calculateMonacoLineNumberFromStyle } from 'external/src/delegate/annotations/util.ts';
import { matchElementIdentity } from 'external/src/delegate/location/elementIdentifier/index.ts';
import { getWindowAndDocument } from 'external/src/delegate/location/getWindowAndDocument.ts';
import { isHighlightedTextPresent } from 'external/src/delegate/location/textHighlights.ts';
import { getMonacoLineSelectorWithSpaces } from 'external/src/lib/util.ts';

type AnnotationArgs = {
  location: DocumentLocation;
  monacoEditorWrapper: MonacoEditorWrapper | null;
};

export class MonacoEditorAnnotation implements BaseAnnotation {
  private location: DocumentLocation;
  private monacoEditorWrapper: MonacoEditorWrapper | null;
  private containingDocument: Document;

  constructor({ location, monacoEditorWrapper }: AnnotationArgs) {
    assert(
      Boolean(location.additionalTargetData?.monacoEditor),
      'No monaco editor in MonacoEditorAnnotation',
    );
    this.location = location;
    this.monacoEditorWrapper = monacoEditorWrapper;
    const { documentElement } = getWindowAndDocument(location);
    this.containingDocument = documentElement;
  }

  async getPosition() {
    const { selector } = this.location;
    let target = this.containingDocument.querySelector(selector);

    if (!target) {
      // When adding new lines, the inline style of each Monaco line changes.
      // Check for this edge case before assuming the line is not there.
      target = this.containingDocument.querySelector(
        getMonacoLineSelectorWithSpaces(selector),
      );
    }

    const targetRect = target?.getBoundingClientRect();

    if (!targetRect) {
      if (!this.monacoEditorWrapper) {
        return null;
      }

      const lineToScrollTo =
        this.location.additionalTargetData?.monacoEditor?.lineNumber ?? -1;
      if (lineToScrollTo < 0) {
        return null;
      }

      const lineCount = this.monacoEditorWrapper.getLineCount();
      const lineToScrollToExists = lineToScrollTo <= lineCount;
      if (!lineToScrollToExists) {
        return null;
      }

      const editorRect = this.monacoEditorWrapper
        .getEditorContainer()
        ?.getBoundingClientRect();
      const linesContainer = this.monacoEditorWrapper.getLinesContainer();
      if (!editorRect || !linesContainer) {
        return null;
      }

      // The first currently line rendered by the editor. Changes when scrolling.
      const topMostLineNumber = calculateMonacoLineNumberFromStyle(
        linesContainer.firstElementChild as HTMLDivElement,
      );
      const shouldArrowPointToTop = lineToScrollTo <= topMostLineNumber;

      return {
        xVsViewport: editorRect.left + editorRect.width / 2,
        yVsViewport: shouldArrowPointToTop ? editorRect.top : editorRect.bottom,
        visible: false,
        target,
      };
    }

    const xVsViewport = targetRect.x + this.location.x * targetRect.width;
    const yVsViewport = targetRect.y + this.location.y * targetRect.height;
    return {
      xVsViewport,
      yVsViewport,
      visible: true,
      target,
    };
  }

  async getMatchType() {
    const { selector } = this.location;
    if (!this.monacoEditorWrapper) {
      let target = this.containingDocument.querySelector(selector);

      if (!target) {
        // When adding new lines, the inline style of each Monaco line changes.
        // Check for this edge case before assuming the line is not there.
        target = this.containingDocument.querySelector(
          getMonacoLineSelectorWithSpaces(selector),
        );
      }

      if (!target) {
        return LocationMatch.OUTSIDE_INACCESSIBLE_VIRTUALISED_LIST;
      }
      const matchType = matchElementIdentity(
        target,
        this.location.elementIdentifier?.identifier,
        this.location.elementIdentifier?.version,
      );
      return matchType === ElementIdentifierMatch.EXACT
        ? LocationMatch.EXACT
        : LocationMatch.NONE;
    }

    const position = await this.getPosition();
    if (!position) {
      return LocationMatch.NONE;
    } else {
      if (!position.visible || !position.target) {
        return LocationMatch.OUTSIDE_ACCESSIBLE_VIRTUALISED_LIST;
      }
      if (this.location.highlightedTextConfig) {
        return isHighlightedTextPresent(this.location.highlightedTextConfig)
          ? LocationMatch.EXACT
          : LocationMatch.NONE;
      }
      const matchType = matchElementIdentity(
        position.target,
        this.location.elementIdentifier?.identifier,
        this.location.elementIdentifier?.version,
      );
      return matchType === ElementIdentifierMatch.EXACT
        ? LocationMatch.EXACT
        : LocationMatch.NONE;
    }
  }

  async isOutsideScroll() {
    const matchType = await this.getMatchType();
    return matchType === LocationMatch.OUTSIDE_ACCESSIBLE_VIRTUALISED_LIST;
  }

  async scrollTo() {
    if (!this.monacoEditorWrapper) {
      return;
    }
    await this.monacoEditorWrapper.scrollToLine(
      this.location.additionalTargetData?.monacoEditor?.lineNumber ?? Infinity,
    );
  }

  async getPositionForArrow() {
    // Would be good to decouple this from getPosition
    const position = await this.getPosition();
    if (!position) {
      return null;
    }
    return {
      xVsViewport: position.xVsViewport,
      yVsViewport: position.yVsViewport,
      withinScroll: position.visible,
    };
  }
}
