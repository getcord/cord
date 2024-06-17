const WOFF = 'application/font-woff';
const JPEG = 'image/jpeg';
const mimes: { [key: string]: string } = {
  woff: WOFF,
  woff2: WOFF,
  ttf: 'application/font-truetype',
  eot: 'application/vnd.ms-fontobject',
  png: 'image/png',
  jpg: JPEG,
  jpeg: JPEG,
  gif: 'image/gif',
  tiff: 'image/tiff',
  svg: 'image/svg+xml',
};

export const uuid = (function uuid() {
  // generate uuid for className of pseudo elements.
  // We should not use GUIDs, otherwise pseudo elements sometimes cannot be captured.
  let counter = 0;

  // ref: http://stackoverflow.com/a/6248722/2519373
  const random = () =>
    `0000${((Math.random() * 36 ** 4) << 0).toString(36)}`.slice(-4);

  return () => {
    counter += 1;
    return `u${random()}${counter}`;
  };
})();

function getExtension(url: string): string {
  const match = /\.([^./]*?)$/g.exec(url);
  return match ? match[1] : '';
}

export function getMimeType(url: string): string {
  const ext = getExtension(url).toLowerCase();
  return mimes[ext] || '';
}

export function isDataUrl(url: string) {
  return url.search(/^(data:)/) !== -1;
}

export function toDataURL(content: string, mimeType: string) {
  return `data:${mimeType};base64,${content}`;
}

export function getDataURLContent(dataURL: string) {
  const commaIndex = dataURL.indexOf(',');
  return dataURL.slice(commaIndex + 1);
}

/**
 * The clientWidth/clientHeight of a cloned node are 0, so
 * we need to calcualte those ourselves.
 */
export function getClonedNodeSize(clonedNode: HTMLElement) {
  const {
    boxSizing,

    width,
    paddingLeft,
    paddingRight,
    borderLeftWidth,
    borderRightWidth,

    height,
    paddingTop,
    paddingBottom,
    borderTopWidth,
    borderBottomWidth,
  } = clonedNode.style;

  if (boxSizing === 'border-box') {
    return { width: parseFloat(width), height: parseFloat(height) };
  }

  const actualWidth = [
    width,
    paddingLeft,
    paddingRight,
    borderLeftWidth,
    borderRightWidth,
  ].reduce((sum, x) => sum + parseFloat(x), 0);

  const actualHeight = [
    height,
    paddingTop,
    paddingBottom,
    borderTopWidth,
    borderBottomWidth,
  ].reduce((sum, x) => sum + parseFloat(x), 0);

  return { width: actualWidth, height: actualHeight };
}

function px(node: HTMLElement, styleProperty: string) {
  const val = window.getComputedStyle(node).getPropertyValue(styleProperty);
  return parseFloat(val.replace('px', ''));
}

export function getNodeWidth(node: HTMLElement) {
  const leftBorder = px(node, 'border-left-width');
  const rightBorder = px(node, 'border-right-width');
  return node.clientWidth + leftBorder + rightBorder;
}

export function getNodeHeight(node: HTMLElement) {
  const topBorder = px(node, 'border-top-width');
  const bottomBorder = px(node, 'border-bottom-width');
  return node.clientHeight + topBorder + bottomBorder;
}

export function getPixelRatio() {
  let ratio;

  let FINAL_PROCESS;
  try {
    FINAL_PROCESS = process;
  } catch (e) {
    // Do nothing
  }

  const val =
    FINAL_PROCESS && FINAL_PROCESS.env
      ? FINAL_PROCESS.env.devicePixelRatio
      : null;
  if (val) {
    ratio = parseInt(val, 10);
    if (isNaN(ratio)) {
      ratio = 1;
    }
  }
  return ratio || window.devicePixelRatio || 1;
}
