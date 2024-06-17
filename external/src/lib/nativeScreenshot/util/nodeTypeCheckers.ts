export function isHTMLElement(
  node: Node,
  containingWindow: Window,
): node is HTMLElement {
  return node instanceof (containingWindow as any).HTMLElement;
}

export function isSvgElement(
  node: Node,
  containingWindow: Window,
): node is SVGElement {
  return node instanceof (containingWindow as any).SVGElement;
}

export function isImage(node: Node): node is HTMLImageElement {
  return node.nodeName === 'IMG';
}

export function isCanvas(node: Node): node is HTMLCanvasElement {
  return node.nodeName === 'CANVAS';
}

export function isTextArea(node: Node): node is HTMLTextAreaElement {
  return node.nodeName === 'TEXTAREA';
}

export function isInput(node: Node): node is HTMLInputElement {
  return node.nodeName === 'INPUT';
}

export function isDiv(node: Node): node is HTMLDivElement {
  return node.nodeName === 'DIV';
}
