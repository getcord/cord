import { useCallback, useEffect, useRef } from 'react';
import type { InitialIFrameState } from 'external/src/common/iframe.ts';
import { DelegateContext } from 'external/src/context/delegate/DelegateContext.ts';
import { ANNOTATION_POINTER_TRANSITION_OUT_MS } from 'common/const/Timing.ts';
import { GlobalEventsContext } from 'external/src/context/globalEvents/GlobalEventsContext.tsx';
import { LocationMatch } from 'common/types/index.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { useSidebarVisible } from 'external/src/delegate/hooks/useSidebarVisiblePreference.ts';
import { createAnnotationInstance } from 'external/src/delegate/annotations/index.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { extractDeepLinkQueryParams } from 'common/util/index.ts';
import { Annotation } from 'external/src/delegate/annotations/Annotation.ts';
import { PageContext } from 'external/src/context/page/PageContext.ts';
import { useCaptureScreenshot } from 'external/src/effects/useCaptureScreenshot.ts';
import { ThreadNameContext } from 'external/src/context/page/ThreadNameContext.tsx';
import { SidebarConfigContext } from 'external/src/context/sidebarConfig/SidebarConfigContext.ts';
import { AnnotationSDKContext } from 'external/src/context/annotations/AnnotationSDKContext.ts';
import { ThirdPartyAuthDataModalContext } from 'external/src/context/thirdPartyAuthDataModal/ThirdPartyAuthModalContextProvider.tsx';
import { AnnotatingConfigContext } from 'external/src/context/annotationConfig/AnnotatingConfigContext.ts';
import { ConfigurationContext } from 'external/src/context/config/ConfigurationContext.ts';
import { SidebarWidthContext } from 'external/src/context/sidebarWidth/SidebarWidthContext.ts';
import { AnnotationsConfigContext } from 'external/src/context/annotations/AnnotationConfigContext.tsx';
import { ScreenshotConfigContext } from 'external/src/context/screenshotConfig/ScreenshotConfigContext.tsx';

const preloadedImages = new Set<string>();

export function useSidebarController(
  sidebarVisible: boolean,
  iframeElement: HTMLIFrameElement | null,
): {
  initialState: InitialIFrameState | null;
} {
  const {
    dispatch,
    state: { ready, thirdPartyObjects, navigate, deepLinkInfo },
  } = useContextThrowingIfNoProvider(DelegateContext);

  const { showThirdPartyAuthDataModal, hideThirdPartyAuthDataModal } =
    useContextThrowingIfNoProvider(ThirdPartyAuthDataModalContext);

  const {
    annotatingConfig,
    startAnnotating,
    completeAnnotating,
    cancelAnnotating,
  } = useContextThrowingIfNoProvider(AnnotatingConfigContext);

  const sidebarConfigCtx = useContextThrowingIfNoProvider(SidebarConfigContext);
  const { showPinsOnPage } = useContextThrowingIfNoProvider(
    AnnotationsConfigContext,
  );

  const { logWarning, logEvent } = useLogger();

  const [_, setSidebarVisible] = useSidebarVisible();

  const pageContext = useContextThrowingIfNoProvider(PageContext);
  const { threadName } = useContextThrowingIfNoProvider(ThreadNameContext);

  const {
    screenshotOptions: { blur: blurScreenshotsOnCapture },
  } = useContextThrowingIfNoProvider(ConfigurationContext);

  const screenshotConfig = useContextThrowingIfNoProvider(
    ScreenshotConfigContext,
  );

  const captureScreenshot = useCaptureScreenshot({
    sidebarVisible,
    blurScreenshotsOnCapture,
    screenshotConfig,
  });

  const {
    addGlobalEventListener,
    removeGlobalEventListener,
    triggerGlobalEvent,
  } = useContextThrowingIfNoProvider(GlobalEventsContext);

  const sidebarWidth = useContextThrowingIfNoProvider(SidebarWidthContext);
  useEffect(() => {
    if (ready) {
      triggerGlobalEvent(
        iframeElement?.contentWindow ?? window.top,
        'SET_SIDEBAR_WIDTH',
        sidebarWidth,
      );
    }
  }, [iframeElement?.contentWindow, sidebarWidth, ready, triggerGlobalEvent]);

  const initialIframeStateRef = useRef<InitialIFrameState>({
    visible: sidebarVisible,
    sidebarConfig: { ...sidebarConfigCtx, showPinsOnPage },
  });

  // Reset state on umount
  useEffect(() => {
    return () => dispatch({ type: 'RESET' });
  }, [dispatch]);

  useEffect(() => {
    if (ready) {
      triggerGlobalEvent(
        iframeElement?.contentWindow ?? window.top,
        'PAGE_CONTEXT',
        { context: pageContext ?? null },
      );
    }
  }, [pageContext, iframeElement, ready, triggerGlobalEvent]);

  useEffect(() => {
    if (ready && threadName) {
      triggerGlobalEvent(
        iframeElement?.contentWindow ?? window.top,
        'THREAD_NAME',
        { name: threadName },
      );
    }
  }, [threadName, iframeElement, ready, triggerGlobalEvent]);

  const initialSidebarConfig = useRef(sidebarConfigCtx).current;

  useEffect(() => {
    if (
      sidebarConfigCtx &&
      sidebarConfigCtx !== initialSidebarConfig &&
      ready
    ) {
      triggerGlobalEvent(
        iframeElement?.contentWindow ?? window.top,
        'SET_SIDEBAR_CONFIG',
        { ...sidebarConfigCtx, showPinsOnPage },
      );
    }
  }, [
    iframeElement,
    ready,
    sidebarConfigCtx,
    showPinsOnPage,
    initialSidebarConfig,
    triggerGlobalEvent,
  ]);

  useEffect(() => {
    if (ready) {
      triggerGlobalEvent(
        iframeElement?.contentWindow ?? window.top,
        'SET_VISIBLE',
        sidebarVisible,
      );
    }
  }, [sidebarVisible, iframeElement, ready, triggerGlobalEvent]);

  const preloadImage = useCallback((imageUrl: string) => {
    if (preloadedImages.has(imageUrl)) {
      return;
    }
    const preloadLink = document.createElement('link');
    preloadLink.href = imageUrl;
    preloadLink.rel = 'preload';
    preloadLink.as = 'image';
    document.head.appendChild(preloadLink);
    preloadedImages.add(imageUrl);
  }, []);

  const queryDeepLinkUsed = useRef<boolean>(false);
  useEffect(() => {
    // on load of the page, check if the url contains deeplinking query params
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    const deepLinkInfo = extractDeepLinkQueryParams(window.location.href);
    if (deepLinkInfo && ready && !queryDeepLinkUsed.current) {
      dispatch({ type: 'SET_DEEPLINK_INFO', deepLinkInfo });
      // TODO(jozef): How do we associate this event with the act that someone
      // either shared the deeplinked message to Slack or mentioned this user
      // in this message?
      logEvent('deeplink-visit', {
        ...deepLinkInfo,
        deeplinkType: 'query-params',
      });

      queryDeepLinkUsed.current = true;
    }
  }, [dispatch, ready, logEvent]);

  const prevDeepLinkInfoRef = useRef(deepLinkInfo);
  useEffect(() => {
    if (deepLinkInfo !== prevDeepLinkInfoRef.current) {
      if (deepLinkInfo) {
        setSidebarVisible(true);
        triggerGlobalEvent(
          iframeElement?.contentWindow ?? window.top,
          'GO_TO_MESSAGE',
          deepLinkInfo,
        );
        dispatch({ type: 'SET_DEEPLINK_INFO', deepLinkInfo: null });
      }
      prevDeepLinkInfoRef.current = deepLinkInfo;
    }
  }, [
    deepLinkInfo,
    dispatch,
    iframeElement?.contentWindow,
    setSidebarVisible,
    triggerGlobalEvent,
  ]);

  useEffect(() => {
    if (!annotatingConfig) {
      return;
    }

    addGlobalEventListener('CANCEL_ANNOTATION', annotatingConfig.onCancel);

    return () => {
      removeGlobalEventListener('CANCEL_ANNOTATION', annotatingConfig.onCancel);
    };
  }, [annotatingConfig, addGlobalEventListener, removeGlobalEventListener]);

  const { getAnnotationPosition } =
    useContextThrowingIfNoProvider(AnnotationSDKContext);

  useEffect(() => {
    const cleanupFunctions: Array<() => void> = [];

    const addListener: typeof addGlobalEventListener = (...args) => {
      cleanupFunctions.push(addGlobalEventListener(...args));
      return null as any;
    };
    addListener('READY', () => dispatch({ type: 'READY' }));
    addListener('PRELOAD_IMAGE', ({ data: { imageUrl } }) => {
      preloadImage(imageUrl);
    });
    addListener(
      'GET_ANNOTATION_MATCH_TYPE',
      ({ data }) =>
        new Promise((resolve) => {
          resolve(
            createAnnotationInstance({
              annotation: data.annotation,
              thirdPartyObjects,
              getAnnotationPosition,
            }).getMatchType(),
          );
        }),
    );
    addListener(
      'NAVIGATE',
      ({ data: { url } }) => (window.location.href = url),
    );
    addListener('CREATE_ANNOTATION', ({ data: { blurScreenshots } }) => {
      return new Promise((resolve) => {
        startAnnotating({
          onSuccess: (result) => {
            dispatch({
              type: 'SHOW_ANNOTATION',
              annotation: result.annotation,
            });
            completeAnnotating();
            resolve(result);
          },
          onCancel: () => {
            cancelAnnotating();
            resolve(null);
          },
          blurScreenshots: !!blurScreenshots,
        });
      });
    });
    addListener('SHOW_ANNOTATION', async ({ data }) => {
      const annotation = createAnnotationInstance({
        annotation: data.annotation,
        thirdPartyObjects,
        getAnnotationPosition,
      });

      // Don't show annotation if not visible. Showing a text highlight in an
      // input causes immediate scroll to the input (because it calls input.focus)
      const matchType = await annotation.getMatchType();
      if (matchType === LocationMatch.NONE) {
        return;
      }

      const outsideScroll = await annotation.isOutsideScroll();
      if (!outsideScroll) {
        dispatch({
          type: 'SHOW_ANNOTATION',
          annotation: data.annotation,
        });
      }
    });
    addListener('HIDE_ANNOTATION', ({ data: { annotation } }) => {
      dispatch({
        type: 'HIDE_ANNOTATION',
        annotation,
      });
    });
    addListener('SCROLL_TO_ANNOTATION', async ({ data }) => {
      const annotation = createAnnotationInstance({
        annotation: data.annotation,
        thirdPartyObjects,
        getAnnotationPosition,
      });
      const matchType = await annotation.getMatchType();
      if (matchType === LocationMatch.NONE) {
        return;
      }
      const outsideScroll = await annotation.isOutsideScroll();
      if (!outsideScroll) {
        return;
      }
      dispatch({ type: 'SET_SCROLLING_TO_ANNOTATION', scrolling: true });
      await annotation.scrollTo();
      dispatch({
        type: 'SET_SCROLLING_TO_ANNOTATION',
        scrolling: false,
      });
      return;
    });
    addListener('SKIP_MEDIA_TO_ANNOTATED_TIME', async ({ data }) => {
      const annotation = createAnnotationInstance({
        annotation: data.annotation,
        thirdPartyObjects,
        getAnnotationPosition,
      });
      const matchType = await annotation.getMatchType();
      if (matchType === LocationMatch.NONE) {
        return;
      }
      const outsideScroll = await annotation.isOutsideScroll();
      if (outsideScroll || !(annotation instanceof Annotation)) {
        return;
      }
      await annotation.skipMediaToAnnotatedTime();
    });
    addListener('DRAW_ARROW_TO_ANNOTATION', ({ data }) => {
      dispatch({ type: 'SHOW_ANNOTATION_ARROW', arrow: data });
    });
    addListener(
      'REMOVE_ANNOTATION_ARROW',
      ({ data: { annotation, animate } }) => {
        if (!animate) {
          dispatch({ type: 'HIDE_ANNOTATION_ARROW', arrow: { annotation } });
        } else {
          dispatch({
            type: 'ANIMATE_OUT_ANNOTATION_ARROW',
            arrow: { annotation },
          });
          setTimeout(() => {
            dispatch({ type: 'HIDE_ANNOTATION_ARROW', arrow: { annotation } });
          }, ANNOTATION_POINTER_TRANSITION_OUT_MS);
        }
      },
    );
    addListener(
      'SHOW_CONFIRM_MODAL',
      ({
        data: { title, paragraphs, confirmButtonText, cancelButtonText },
      }) => {
        return new Promise((resolve) => {
          dispatch({
            type: 'SHOW_CONFIRM_MODAL',
            confirmModal: {
              title,
              paragraphs,
              confirmButtonText,
              cancelButtonText,
              onConfirm: () => {
                dispatch({ type: 'HIDE_CONFIRM_MODAL' });
                resolve(true);
              },
              onReject: () => {
                dispatch({ type: 'HIDE_CONFIRM_MODAL' });
                resolve(false);
              },
            },
          });
        });
      },
    );

    addListener('SHOW_THIRD_PARTY_AUTH_MODAL', ({ data: { data } }) => {
      showThirdPartyAuthDataModal(data);
    });
    addListener('HIDE_THIRD_PARTY_AUTH_MODAL', () => {
      hideThirdPartyAuthDataModal();
    });
    addListener('CLOSE_SIDEBAR', () => {
      setSidebarVisible(false);
    });
    addListener(
      'CALL_NAVIGATE_OVERRIDE',
      async ({ data: { url, location, info } }) => {
        if (!navigate) {
          return { navigated: false };
        }
        try {
          const navigated = await navigate(url, location, info);
          return { navigated };
        } catch (error: any) {
          logWarning('navigate-callback-failed', { message: error?.message });
          return { navigated: false };
        }
      },
    );
    addListener('GET_WINDOW_INNER_WIDTH', async () => {
      return window.innerWidth;
    });
    addListener('ANIMATE_ANNOTATION', async ({ data: { annotationID } }) => {
      dispatch({ type: 'ANIMATE_ANNOTATION', annotationID });
    });

    return () => {
      for (const cleanupFunction of cleanupFunctions) {
        cleanupFunction();
      }
    };
  }, [
    captureScreenshot,
    dispatch,
    logWarning,
    navigate,
    preloadImage,
    setSidebarVisible,
    thirdPartyObjects,
    getAnnotationPosition,
    showThirdPartyAuthDataModal,
    hideThirdPartyAuthDataModal,
    startAnnotating,
    completeAnnotating,
    cancelAnnotating,
    addGlobalEventListener,
  ]);

  return {
    initialState: initialIframeStateRef.current,
  };
}
