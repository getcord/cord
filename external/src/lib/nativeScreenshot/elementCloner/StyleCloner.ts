import { getStylesToClone } from 'external/src/lib/nativeScreenshot/util/getStylesToClone.ts';
import { uuid } from 'external/src/lib/nativeScreenshot/util/index.ts';
import {
  isInput,
  isSvgElement,
  isTextArea,
} from 'external/src/lib/nativeScreenshot/util/nodeTypeCheckers.ts';

export class StyleCloner {
  nativeNode: HTMLElement | SVGElement;
  styles: CSSStyleDeclaration;
  rect: DOMRect;
  takesNoSpace: boolean;
  offScreen = false;
  containingWindow: Window;
  containingDocument: Document;

  constructor({
    nativeNode,
    containingWindow,
    containingDocument,
  }: {
    nativeNode: HTMLElement | SVGElement;
    containingWindow: Window;
    containingDocument: Document;
  }) {
    // Images wrapped in picture tags don't work - we unwrap them
    // Apply <picture> styles to <img> instead
    if (
      nativeNode.tagName === 'IMG' &&
      nativeNode.parentElement?.tagName === 'PICTURE'
    ) {
      nativeNode = nativeNode.parentElement!;
    }
    this.nativeNode = nativeNode;
    this.containingWindow = containingWindow;
    this.containingDocument = containingDocument;
    this.styles = containingWindow.getComputedStyle(nativeNode);
    this.rect = nativeNode.getBoundingClientRect();
    this.takesNoSpace =
      this.styles.overflow !== 'visible' &&
      (this.rect.width === 0 || this.rect.height === 0);
  }

  decorate(clonedNode: HTMLElement) {
    this.applyStylesToClone(clonedNode);
    this.cloneInputValue(clonedNode);
    this.clonePseudoElements(clonedNode);
  }

  applyStylesToClone(clonedNode: HTMLElement) {
    const clonedNodeStyle = clonedNode.style;
    if (!clonedNodeStyle) {
      return;
    }
    this.cloneStyles(this.nativeNode, clonedNodeStyle);
  }

  cloneInputValue(clonedNode: HTMLElement) {
    if (isTextArea(this.nativeNode)) {
      clonedNode.innerHTML = this.nativeNode.value;
    }

    if (isInput(this.nativeNode)) {
      clonedNode.setAttribute('value', this.nativeNode.value);
    }
  }

  clonePseudoElements(clonedNode: HTMLElement) {
    for (const pseudo of [':before', ':after'] as const) {
      const style = this.containingWindow.getComputedStyle(
        this.nativeNode,
        pseudo,
      );
      const content = style.getPropertyValue('content');
      if (content === '' || content === 'none') {
        return;
      }

      const className = uuid();
      // fix: Cannot assign to read only property 'className' of object '#<…
      try {
        clonedNode.className = `${clonedNode.className} ${className}`;
      } catch (err) {
        return;
      }

      const selector = `.${className}:${pseudo}`;
      let cssText = '';
      if (style.cssText) {
        cssText = `${style.cssText} content: ${style.getPropertyValue(
          'content',
        )};`;
      } else {
        cssText = [...style]
          .map((name) => {
            const value = style.getPropertyValue(name);
            const priority = style.getPropertyPriority(name);
            return `${name}: ${value}${priority ? ' !important' : ''};`;
          })
          .join(' ');
      }
      const styleElement = this.containingDocument.createElement('style');
      styleElement.appendChild(
        this.containingDocument.createTextNode(`${selector}{${cssText}}`),
      );
      clonedNode.appendChild(styleElement);
    }
  }

  private cloneStyles(
    nativeNode: HTMLElement | SVGElement,
    target: CSSStyleDeclaration,
  ) {
    const display = this.styles.getPropertyValue('display');
    const cloneType = this.takesNoSpace
      ? 'takesNoSpace'
      : display === 'grid' || display === 'inline-grid'
      ? 'grid'
      : display === 'flex' || display === 'inline-flex'
      ? 'flex'
      : isSvgElement(nativeNode, this.containingWindow)
      ? 'svg'
      : 'base';
    for (const style of getStylesToClone(cloneType)) {
      const value = this.styles.getPropertyValue(style);
      if (style === 'width') {
        // Width doesn't affect table cells when table layout is auto (default),
        // but minWidth does. Without this text can wrap when it shouldn't
        if (nativeNode.nodeName === 'TD' || nativeNode.nodeName === 'TH') {
          target.setProperty('min-width', value);
        }
      }
      target.setProperty(style, value, this.styles.getPropertyPriority(style));
    }
    target.flex = 'none';
  }
}
