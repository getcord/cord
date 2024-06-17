import type { MonacoEditorInstance } from 'external/src/delegate/annotations/types.ts';
import {
  containerSelector,
  CORD_INSTANCE_ID_ATTRIBUTE_NAME,
} from 'external/src/delegate/annotations/types.ts';
import { getSelector } from 'external/src/lib/getSelector/index.ts';
import { hasProperty } from 'external/src/lib/cssSelectors.ts';
import {
  calculateMonacoLineNumberFromStyle,
  findClosestMonacoLine,
  getMonacoLineSelector,
  MONACO_SELECTORS,
} from 'external/src/delegate/annotations/util.ts';

export class MonacoEditors {
  monacoInstances = new Map<string, MonacoEditorInstance>();

  addMonacoInstance(id: string, monacoInstance: MonacoEditorInstance) {
    this.monacoInstances.set(id, monacoInstance);
  }

  removeMonacoInstance(id: string) {
    this.monacoInstances.delete(id);
  }

  getMonacoEditorWrapper(monacoID: string | null) {
    if (!monacoID) {
      return null;
    }
    const instance = this.monacoInstances.get(monacoID);
    return instance ? createMonacoEditorWrapper(monacoID, instance) : null;
  }

  getMonacoEditorElement(element: Element) {
    return element.closest(MONACO_SELECTORS.editorContainer);
  }

  isElementInMonacoEditor(element: Element) {
    return Boolean(this.getMonacoEditorElement(element));
  }

  getTargetData({
    target,
    xVsViewport,
    yVsViewport,
  }: {
    target: Element;
    xVsViewport: number;
    yVsViewport: number;
  }) {
    const monacoEditorElement = this.getMonacoEditorElement(target);
    const monacoID =
      monacoEditorElement
        ?.closest(hasProperty(CORD_INSTANCE_ID_ATTRIBUTE_NAME))
        ?.getAttribute(CORD_INSTANCE_ID_ATTRIBUTE_NAME) ?? null;
    const monacoEditorWrapper = this.getMonacoEditorWrapper(monacoID);

    let monacoEditorLine = target.closest(MONACO_SELECTORS.singleLine);
    if (!monacoEditorLine) {
      monacoEditorLine = findClosestMonacoLine(
        {
          x: xVsViewport,
          y: yVsViewport,
        },
        monacoEditorElement?.querySelector(MONACO_SELECTORS.linesContainer) ??
          null,
      );
    }

    const additionalTargetData = {
      targetType: 'monacoEditor' as const,
      monacoEditor: {
        monacoID,
        lineNumber: monacoEditorWrapper
          ? monacoEditorWrapper.getLineNumber(xVsViewport, yVsViewport)
          : calculateMonacoLineNumberFromStyle(monacoEditorLine),
      },
      reactTree: null,
      konvaCanvas: null,
    };
    let targetSelector: string | null = null;
    if (monacoEditorLine) {
      // Each line of monaco editor has unique a fixed inline style, which looks like
      // `top:0px;height:18px;`. We rely on this to target the exact line.
      if (monacoEditorElement) {
        const editorSelector = getSelector(monacoEditorElement, document);
        targetSelector = `${editorSelector} ${getMonacoLineSelector(
          monacoEditorLine,
        )}`;
      }
    }
    return {
      additionalTargetData,
      target: monacoEditorLine,
      targetSelector,
    };
  }
}

function createMonacoEditorWrapper(
  monacoID: string,
  monacoInstance: MonacoEditorInstance,
) {
  const monacoEditorElement = document
    .querySelector(containerSelector(monacoID))
    ?.querySelector(MONACO_SELECTORS.editorContainer);
  if (!monacoEditorElement) {
    return null;
  }

  return new MonacoEditorWrapper(monacoInstance, monacoEditorElement);
}

export class MonacoEditorWrapper {
  private monacoEditor;
  private monacoEditorElement;

  constructor(
    monacoEditor: MonacoEditorInstance,
    monacoEditorElement: Element,
  ) {
    this.monacoEditor = monacoEditor;
    this.monacoEditorElement = monacoEditorElement;
  }

  getLineNumber(x: number, y: number): number {
    return (
      this.monacoEditor.getTargetAtClientPoint(x, y)?.position?.lineNumber ?? -1
    );
  }

  getEditorContainer() {
    return this.monacoEditorElement;
  }

  getLinesContainer() {
    return this.monacoEditorElement.querySelector(
      MONACO_SELECTORS.linesContainer,
    );
  }

  async scrollToLine(lineNumber: number): Promise<void> {
    return await new Promise((resolve) => {
      const validLine = lineNumber >= 0 || lineNumber <= this.getLineCount();
      if (!validLine) {
        resolve();
      }

      this.monacoEditor.revealLineInCenter(lineNumber);
      setTimeout(() => {
        resolve();
      }, 150);
    });
  }

  getLineCount(): number {
    return this.monacoEditor.getModel()?.getLineCount() ?? -Infinity;
  }
}
