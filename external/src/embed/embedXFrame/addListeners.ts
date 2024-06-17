import type { HighlightedTextConfig, JsonObject } from 'common/types/index.ts';
import { LocationMatch } from 'common/types/index.ts';
import { createAnnotationInstance } from 'external/src/delegate/annotations/index.ts';
import { MonacoEditors } from 'external/src/delegate/annotations/MonacoEditors.ts';
import { ReactTrees } from 'external/src/delegate/annotations/ReactTrees.ts';
import {
  getDocumentLocation,
  getSelector,
} from 'external/src/delegate/location/index.ts';
import { SelectionHandler } from 'external/src/delegate/location/SelectionHandler.ts';
import {
  getRightmostHighlightedVisibleElement,
  removeTextHighlight,
  showTextHighlight,
} from 'external/src/delegate/location/textHighlights.ts';
import type { EmbedXFrameMessage } from 'external/src/embed/embedXFrame/index.ts';
import {
  addEmbedXFrameMessageListener,
  sendEmbedXFrameMessage,
} from 'external/src/embed/embedXFrame/index.ts';
import { NativeScreenshotter } from 'external/src/lib/nativeScreenshot/index.ts';
import type { BasicLogger } from 'external/src/delegate/BasicLogger.ts';
import {
  getPositionRelativeToElement,
  isIframe,
} from 'external/src/delegate/location/util.ts';

const getAnnotationPosition = () => ({ match: LocationMatch.NONE });

export function addEmbedListeners() {
  let selectionHandler: SelectionHandler | null = null;
  let nativeScreenshotter: NativeScreenshotter | null = null;

  function createLogFn(logFn: keyof BasicLogger) {
    return async (...args: [string, JsonObject?]) => {
      await sendEmbedXFrameMessage(window.top, 'CORD_LOG', { logFn, args });
    };
  }

  const logger = {
    logEvent: createLogFn('logEvent'),
    logWarning: createLogFn('logWarning'),
    logError: createLogFn('logError'),
  };

  addEmbedXFrameMessageListener('CORD_PING', async () => {});

  addEmbedXFrameMessageListener(
    'CORD_SCREENSHOT',
    async ({
      data: { width, height },
    }: EmbedXFrameMessage<'CORD_SCREENSHOT'>) => {
      nativeScreenshotter = new NativeScreenshotter({
        sidebarVisible: false,
        logger,
        options: { width, height },
      });
      nativeScreenshotter.startScreenshot();
      const screenshots = await nativeScreenshotter.finishScreenshot({
        annotationInfo: null,
        includeBlurredVersion: false,
        screenshotTarget: null,
      });
      return { screenshotUrl: screenshots?.regular ?? null };
    },
  );

  addEmbedXFrameMessageListener(
    'CORD_HIGHLIGHT_TEXT_ON_SCREENSHOT',
    async ({
      data: { highlightedTextConfig },
    }: EmbedXFrameMessage<'CORD_HIGHLIGHT_TEXT_ON_SCREENSHOT'>) => {
      if (!nativeScreenshotter) {
        return { screenshotUrl: null };
      }
      const urls = await nativeScreenshotter.finishScreenshot({
        highlightedTextConfig,
        annotationInfo: null,
        includeBlurredVersion: false,
        screenshotTarget: null,
      });
      return { screenshotUrl: urls?.regular || null };
    },
  );

  addEmbedXFrameMessageListener(
    'CORD_SET_INITIAL_SELECTION',
    async ({ data: { position } }) => {
      selectionHandler = new SelectionHandler({
        loggerRef: { current: logger },
      });
      await selectionHandler.setInitialSelection(position);
    },
  );

  addEmbedXFrameMessageListener(
    'CORD_EXTEND_SELECTION',
    async ({ data: { position } }) => {
      if (selectionHandler) {
        return await selectionHandler.extendSelection(position);
      }
      return { selectionChanged: false };
    },
  );

  addEmbedXFrameMessageListener('CORD_IS_TEXT_SELECTED', async () => {
    return await (selectionHandler?.hasSelectedText() || false);
  });

  addEmbedXFrameMessageListener(
    'CORD_GET_DOCUMENT_LOCATION',
    async ({ data: { iframeSelectors, position, hashAnnotations } }) => {
      let xVsViewport = position.x;
      let yVsViewport = position.y;

      const element = document.elementFromPoint(xVsViewport, yVsViewport);
      if (element && isIframe(element)) {
        const iframeSelector = getSelector(element);
        if (!iframeSelector) {
          console.warn('could not get selector for iframe', element);
          return null;
        }
        const relativePosition = getPositionRelativeToElement(
          position,
          element,
        );
        return await sendEmbedXFrameMessage(
          element.contentWindow,
          'CORD_GET_DOCUMENT_LOCATION',
          {
            position: relativePosition,
            hashAnnotations,
            iframeSelectors: [...iframeSelectors, iframeSelector],
          },
        );
      }

      let highlightedTextConfig: HighlightedTextConfig | null = null;
      if (selectionHandler) {
        const hasSelectedText = await selectionHandler?.hasSelectedText();
        highlightedTextConfig = hasSelectedText
          ? selectionHandler.getHighlightedTextConfig(hashAnnotations)
          : null;
        if (highlightedTextConfig && selectionHandler.initialTarget) {
          // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
          const position = getRightmostHighlightedVisibleElement(
            selectionHandler.selection,
            selectionHandler.initialTarget,
            true,
          );
          if (position) {
            xVsViewport = position.x;
            yVsViewport = position.y;
          }
        }
        if (!highlightedTextConfig) {
          // Remove selection styles
          selectionHandler.cleanup();
        }
      }

      return getDocumentLocation({
        xVsViewport,
        yVsViewport,
        highlightedTextConfig,
        excludeElementRef: null,
        logWarning: (...args) => void logger.logWarning(...args),
        thirdPartyObjects: null,
        hashAnnotations: hashAnnotations,
        iframeSelectors,
      });
    },
  );

  addEmbedXFrameMessageListener(
    'CORD_GET_ANNOTATION_POSITION',
    async ({ data: { documentLocation } }) => {
      addScrollListener();
      const annotation = createAnnotationInstance({
        annotation: {
          id: '',
          sourceID: '',
          location: documentLocation,
          customLocation: null,
          customHighlightedTextConfig: null,
          customLabel: null,
          coordsRelativeToTarget: null,
        },
        thirdPartyObjects: {
          reactTrees: new ReactTrees(),
          monacoEditors: new MonacoEditors(),
        },
        getAnnotationPosition,
      });
      return await annotation.getPosition();
    },
  );

  addEmbedXFrameMessageListener(
    'CORD_GET_ANNOTATION_MATCH_TYPE',
    async ({ data: { documentLocation } }) => {
      const annotation = createAnnotationInstance({
        annotation: {
          id: '',
          sourceID: '',
          location: documentLocation,
          customLocation: null,
          customHighlightedTextConfig: null,
          customLabel: null,
          coordsRelativeToTarget: null,
        },
        thirdPartyObjects: {
          reactTrees: new ReactTrees(),
          monacoEditors: new MonacoEditors(),
        },
        getAnnotationPosition,
      });
      return await annotation.getMatchType();
    },
  );

  addEmbedXFrameMessageListener(
    'CORD_GET_ANNOTATION_ARROW_POSITION',
    async ({ data: { documentLocation } }) => {
      const annotation = createAnnotationInstance({
        annotation: {
          id: '',
          sourceID: '',
          location: documentLocation,
          customLocation: null,
          customHighlightedTextConfig: null,
          customLabel: null,
          coordsRelativeToTarget: null,
        },
        thirdPartyObjects: {
          reactTrees: new ReactTrees(),
          monacoEditors: new MonacoEditors(),
        },
        getAnnotationPosition,
      });
      return await annotation.getPositionForArrow();
    },
  );

  addEmbedXFrameMessageListener(
    'CORD_SHOW_TEXT_HIGHLIGHT',
    async ({
      data: { annotationID, highlightedTextConfig, iframeSelectors },
    }) => {
      showTextHighlight(annotationID, highlightedTextConfig, iframeSelectors);
    },
  );

  addEmbedXFrameMessageListener(
    'CORD_HIDE_TEXT_HIGHLIGHT',
    async ({ data: { annotationID } }) => {
      removeTextHighlight(annotationID);
      // If styles still around from annotation just created, remove
      selectionHandler?.cleanup();
    },
  );

  addEmbedXFrameMessageListener(
    'CORD_SCROLL_TO_ANNOTATION',
    async ({ data: { documentLocation } }) => {
      const annotation = createAnnotationInstance({
        annotation: {
          id: '',
          sourceID: '',
          location: documentLocation,
          customLocation: null,
          customHighlightedTextConfig: null,
          customLabel: null,
          coordsRelativeToTarget: null,
        },
        thirdPartyObjects: {
          reactTrees: new ReactTrees(),
          monacoEditors: new MonacoEditors(),
        },
        getAnnotationPosition,
      });
      await annotation.scrollTo();
    },
  );
}

let scrollListenerAdded = false;
function addScrollListener() {
  if (scrollListenerAdded) {
    return;
  }
  scrollListenerAdded = true;
  const onScroll = () => {
    void sendEmbedXFrameMessage(window.top, 'CORD_SCROLL');
  };
  window.addEventListener('scroll', onScroll, {
    capture: true,
  });
}
