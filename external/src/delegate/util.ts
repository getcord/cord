import { Keys } from '@cord-sdk/react/common/const/Keys.ts';
import { APP_ORIGIN } from 'common/const/Urls.ts';
import { SIDEBAR_CONTAINER_ID } from 'common/const/ElementIDs.ts';
import { getNodeWidth } from 'external/src/lib/nativeScreenshot/util/index.ts';

// clientWidth = viewport width minus scrollBar
// https://www.w3.org/TR/cssom-view/#dom-element-clientwidth
export function getScrollBarWidth() {
  return window.innerWidth - document.documentElement.clientWidth;
}

/**
 * @example
 * -------------> XPos
 * |Host website  | Cord   |
 * |              |        |
 * |              |        |
 * |______________|________|
 */
export function getSidebarXPosition() {
  return window.innerWidth - getCurrentSidebarWidth() - getScrollBarWidth();
}

function getCordSidebarContainer(): HTMLElement | null {
  return (
    document
      .querySelector('cord-sidebar')
      ?.shadowRoot?.getElementById(SIDEBAR_CONTAINER_ID) ??
    document.getElementById(SIDEBAR_CONTAINER_ID) ??
    null
  );
}

export function getCurrentSidebarWidth() {
  if (window.top !== window && window.location.origin === APP_ORIGIN) {
    // bit of a gnarly way to check if this is called from within the sidebar iframe
    // in which case this would be its own width
    return window.innerWidth;
  }

  const sidebarContainer = getCordSidebarContainer();
  if (sidebarContainer) {
    return getNodeWidth(sidebarContainer);
  }

  return 0; // Sidebar is not on the page
}

export function getTransformValues(computedStyles: CSSStyleDeclaration) {
  const transform = computedStyles.transform;
  // 2d transform: 'matrix(scaleX, skewY, skewX, scaleY, translateX, translateY)'
  if (transform.includes('matrix(')) {
    try {
      const values = transform.split('matrix(')[1].split(')')[0].split(',');
      return {
        scaleX: parseFloat(values[0]),
        scaleY: parseFloat(values[3]),
        translateX: parseFloat(values[4]),
        translateY: parseFloat(values[5]),
      };
    } catch (e) {
      console.warn('Error getting transform values', e);
    }
  }
  return {
    scaleX: 1,
    scaleY: 1,
    translateX: 0,
    translateY: 0,
  };
}

export type SameDomainIframe = HTMLIFrameElement & {
  contentWindow: Window;
  contentDocument: Document;
};

export function isIframeSameDomain(
  iframe: HTMLIFrameElement,
): iframe is SameDomainIframe {
  return Boolean(iframe.contentWindow && iframe.contentDocument);
}

function preventDefault(e: Event) {
  e.preventDefault();
}

/**
 * Hijacks keyboard events and blocks them. Note that if users focused
 * our composer, we want some keyboard events that can cause scroll to
 * go through. E.g. pressing SPACEBAR when focused on our composer should
 * not be blocked.
 */
function preventScrollingWithKeyboard(e: KeyboardEvent) {
  // These are valid keys if you're focused on a composer.
  const keysThatCauseScroll = [
    Keys.ARROW_DOWN,
    Keys.ARROW_UP,
    Keys.ARROW_LEFT,
    Keys.ARROW_RIGHT,
    Keys.SPACEBAR,
    Keys.HOME,
    Keys.END,
  ];
  // Our composer doesn't support TAB. Pressing TAB will focus the next
  // tabbable element; focusing another element can scroll the page, which we never want.
  const isPressingTab = e.key === Keys.TAB;

  const { target } = e;
  const isTypeableElement =
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.contentEditable);
  if (
    isPressingTab ||
    (keysThatCauseScroll.includes(e.key) && !isTypeableElement)
  ) {
    e.preventDefault();
  }
}

/** Hijack mouse/keyboard events to prevent users from scrolling */
export function blockScroll(containingWindow: Window) {
  containingWindow.addEventListener('wheel', preventDefault, {
    capture: true,
    passive: false,
  });
  containingWindow.addEventListener('keydown', preventScrollingWithKeyboard, {
    capture: true,
  });
}

/** Cleanup after `blockScroll`  */
export function enableScroll(containingWindow: Window) {
  containingWindow.removeEventListener('wheel', preventDefault, true);
  containingWindow.removeEventListener(
    'keydown',
    preventScrollingWithKeyboard,
    true,
  );
}
