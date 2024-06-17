import { watchAccessibleIFramesAndInjectCord } from 'sdk/client/core/iframe/install.ts';
import {
  sendEmbedXFrameMessage,
  addEmbedXFrameMessageListener,
} from 'external/src/embed/embedXFrame/index.ts';
import { addEmbedListeners } from 'external/src/embed/embedXFrame/addListeners.ts';
import { CordIframeIDKey } from 'external/src/common/const.ts';
declare global {
  interface Window {
    CORD_IFRAME_HELPER_INSTALLED?: boolean;
  }
}

if (!window.CORD_IFRAME_HELPER_INSTALLED && window !== window.parent) {
  window.CORD_IFRAME_HELPER_INSTALLED = true;

  addEmbedListeners();

  watchAccessibleIFramesAndInjectCord();

  // notify the parent window every time scroll happens within this iframe
  window.addEventListener(
    'scroll',
    () => void sendEmbedXFrameMessage(window.parent, 'CORD_SCROLL'),
    { capture: true },
  );

  // forward CORD_SCROLL events received from child iframes to parent window
  addEmbedXFrameMessageListener('CORD_SCROLL', () => {
    // TODO: throttle?
    return sendEmbedXFrameMessage(window.parent, 'CORD_SCROLL');
  });

  // notify the parent window every time mousedown happens within this iframe
  window.addEventListener(
    'mousedown',
    () => void sendEmbedXFrameMessage(window.parent, 'CORD_MOUSEDOWN'),
    { capture: true },
  );

  // forward CORD_MOUSEDOWN events received from child iframes to parent window
  addEmbedXFrameMessageListener('CORD_MOUSEDOWN', () => {
    return sendEmbedXFrameMessage(window.parent, 'CORD_MOUSEDOWN');
  });
  // notify the parent window every time mouseover happens within this iframe
  // TODO nested iframes
  window.addEventListener(
    'mousemove',
    (event) => {
      const iframe = window.frameElement;
      if (!iframe) {
        return;
      }
      void sendEmbedXFrameMessage(window.parent, 'CORD_MOUSEMOVE', {
        x: event.clientX,
        y: event.clientY,
        // Sending the iframe_id so at the top level window we can target
        // the right iframe and make adjustments to the x and y coordinates
        // for mousemove events in iframes
        frame_id: iframe.getAttribute(CordIframeIDKey) ?? 'unknown',
      });
    },
    { capture: true },
  );

  // forward CORD_MOUSEMOVE events received from child iframes to parent window
  addEmbedXFrameMessageListener('CORD_MOUSEMOVE', ({ data }) => {
    return sendEmbedXFrameMessage(
      window.parent,
      'CORD_MOUSEMOVE',
      data ?? null,
    );
  });

  // notify the parent frame that this frame is available
  void sendEmbedXFrameMessage(window.parent, 'CORD_REGISTER');

  // in case the parent frame isn't listening for CORD_REGISTER yet, they
  // might ping us later; listen for that and register when received
  addEmbedXFrameMessageListener('CORD_PING', (e, source) => {
    return sendEmbedXFrameMessage(source as Window, 'CORD_REGISTER');
  });
}
