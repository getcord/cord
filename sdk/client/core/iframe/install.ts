import { throttle } from 'radash';
import { isIframeSameDomain } from 'external/src/delegate/util.ts';
import { APP_ORIGIN } from 'common/const/Urls.ts';
import {
  addEmbedXFrameMessageListener,
  sendEmbedXFrameMessage,
} from 'external/src/embed/embedXFrame/index.ts';
import { accessibleIframes } from 'sdk/client/core/iframe/accessibleIframes.ts';
import { CordIframeIDKey } from 'external/src/common/const.ts';

const SCRIPT_SRC = `${APP_ORIGIN}/sdk/v1/iframe.js`;
const MUTATION_OBSERVER_THROTTLE_MS = 1000;

const monitoredIFrames = new Set<HTMLIFrameElement>();
let isWatching = false;

function findAllIFrames() {
  // iframe.js is ~200kb, and there's one per iframe. Some pages don't need
  // this logic at all, so we add a way to opt-out of this altogether. See #6520
  if (document.head.querySelector("meta[name='cord:ignore-iframes']")) {
    return [];
  }

  return [...document.getElementsByTagName('iframe')].filter(
    // Let's ignore sandboxed iframes, otherwise injecting our script
    // will throw an error in the console.
    (iframe) => !iframe.getAttribute('sandbox'),
  );
}

export function watchAccessibleIFramesAndInjectCord() {
  if (isWatching) {
    return;
  }

  isWatching = true;
  // if a child frame tells us they're available, register that
  addEmbedXFrameMessageListener('CORD_REGISTER', async (e, source) => {
    const iframe = findAllIFrames().find(
      ({ contentWindow }) => contentWindow === source,
    );
    if (iframe && !accessibleIframes.has(iframe)) {
      accessibleIframes.add(iframe);
    }
  });

  findAllIFrames().forEach(injectCord);

  // On change to DOM tree, check again if any new frames are accessible
  const observer = new MutationObserver(
    throttle({ interval: MUTATION_OBSERVER_THROTTLE_MS }, () => {
      findAllIFrames().forEach(injectCord);

      for (const iframe of [...accessibleIframes]) {
        if (!iframe.isConnected) {
          accessibleIframes.delete(iframe);
        }
      }
    }),
  );

  // TODO: iframes could have their SRC changed

  const observeBodyElement = () => {
    observer.observe(document.body, {
      attributes: false,
      subtree: true,
      childList: true,
    });
  };

  if (document.body) {
    observeBodyElement();
  } else {
    document.addEventListener('load', observeBodyElement);
  }
}

function pingAndInstallIfPossible(iframe: HTMLIFrameElement) {
  sendEmbedXFrameMessage(iframe.contentWindow, 'CORD_PING').catch(() => {
    // something went wrong, ignore
  });

  if (
    isIframeSameDomain(iframe) &&
    iframe.contentDocument.documentElement &&
    !iframe.contentWindow.CORD_IFRAME_HELPER_INSTALLED
  ) {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    iframe.contentDocument.documentElement.append(script);
  }
}

function injectCord(iframe: HTMLIFrameElement) {
  if (!monitoredIFrames.has(iframe)) {
    // make sure each iframe has a unique cord_frame_id so we can target
    // iframes for mousemove events
    iframe.setAttribute(CordIframeIDKey, monitoredIFrames.size.toString());
    monitoredIFrames.add(iframe);

    pingAndInstallIfPossible(iframe);

    const timeout = setInterval(() => {
      if (accessibleIframes.has(iframe) || !iframe.isConnected) {
        clearTimeout(timeout);
        return;
      }

      pingAndInstallIfPossible(iframe);
    }, 1000);
  }
}
