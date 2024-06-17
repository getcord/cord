import type { DocumentLocation } from 'common/types/index.ts';
import { isIframeSameDomain } from 'external/src/delegate/util.ts';

// Returns the correct window & document, depending on whether location is in an Iframe
export function getWindowAndDocument(location: DocumentLocation | null) {
  let documentElement = document;
  let windowElement: Window = window;
  if (location !== null) {
    const { iframeSelectors } = location;
    const [selector] = iframeSelectors;
    if (selector) {
      const iframe: HTMLIFrameElement | null = document.querySelector(selector);
      if (!iframe || !isIframeSameDomain(iframe)) {
        // log/handle
        return { documentElement, windowElement };
      }
      documentElement = iframe.contentDocument;
      windowElement = iframe.contentWindow;
    }
  }
  return { documentElement, windowElement };
}
