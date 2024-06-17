import { useMemo, useState, useCallback, useEffect } from 'react';
import type { EmbedContextProps } from 'external/src/context/embed/EmbedContext.ts';
import { EmbedContext } from 'external/src/context/embed/EmbedContext.ts';
import type { GlobalEvent } from 'external/src/context/globalEvents/GlobalEventsContext.tsx';
import { GlobalEventsContext } from 'external/src/context/globalEvents/GlobalEventsContext.tsx';
import type {
  Location,
  MessageAnnotation,
  PageContext as PageContextType,
  Point2D,
} from 'common/types/index.ts';
import type { InitialIFrameState } from 'external/src/common/iframe.ts';
import { PageContext } from 'external/src/context/page/PageContext.ts';
import { ThreadNameContext } from 'external/src/context/page/ThreadNameContext.tsx';
import { SidebarConfigProvider } from 'external/src/context/sidebarConfig/SidebarConfigProvider.tsx';
import { ConfigurationContext } from 'external/src/context/config/ConfigurationContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { AnnotationsConfigProvider } from 'external/src/context/annotations/AnnotationConfigContext.tsx';

type Props = {
  initialState: InitialIFrameState;
};

// TODO: THIS IS ONLY APPLIED TO THE SIDEBAR COMPONENT! SEE COMMENT IN
// EMBEDCONTEXT.TS

export function EmbedProvider(props: React.PropsWithChildren<Props>) {
  const [pageContext, setPageContext] = useState<PageContextType | null>(null);
  const [threadName, setThreadName] = useState<string | null>(null);

  const [visible, setVisible] = useState(props.initialState.visible);
  const [sidebarConfig, setSidebarConfig] = useState<
    InitialIFrameState['sidebarConfig']
  >(props.initialState.sidebarConfig);

  const {
    screenshotOptions: { blur: blurScreenshotsOnCapture },
  } = useContextThrowingIfNoProvider(ConfigurationContext);

  const {
    addGlobalEventListener,
    removeGlobalEventListener,
    triggerGlobalEvent,
  } = useContextThrowingIfNoProvider(GlobalEventsContext);

  useEffect(() => {
    const onPageContextUpdated = (message: GlobalEvent<'PAGE_CONTEXT'>) => {
      const newPageContext = message.data.context;
      setPageContext(newPageContext);
    };

    const onThreadNameContextUpdated = (
      message: GlobalEvent<'THREAD_NAME'>,
    ) => {
      const newName = message.data.name;
      setThreadName(newName);
    };

    const onSetVisible = (message: GlobalEvent<'SET_VISIBLE'>) => {
      setVisible(message.data);
    };

    const onSidebarConfigUpdated = (
      message: GlobalEvent<'SET_SIDEBAR_CONFIG'>,
    ) => {
      // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      const sidebarConfig = message.data;
      const isSidebarConfigValid = Object.values(sidebarConfig).some(
        (value) => value !== undefined,
      );
      if (isSidebarConfigValid) {
        setSidebarConfig(sidebarConfig);
      }
    };

    addGlobalEventListener('PAGE_CONTEXT', onPageContextUpdated);
    addGlobalEventListener('THREAD_NAME', onThreadNameContextUpdated);
    addGlobalEventListener('SET_VISIBLE', onSetVisible);
    addGlobalEventListener('SET_SIDEBAR_CONFIG', onSidebarConfigUpdated);

    triggerGlobalEvent(window.top, 'READY');

    return () => {
      removeGlobalEventListener('PAGE_CONTEXT', onPageContextUpdated);
      removeGlobalEventListener('THREAD_NAME', onThreadNameContextUpdated);
      removeGlobalEventListener('SET_VISIBLE', onSetVisible);
      removeGlobalEventListener('SET_SIDEBAR_CONFIG', onSidebarConfigUpdated);
    };
  }, [addGlobalEventListener, removeGlobalEventListener, triggerGlobalEvent]);

  const navigate = useCallback(
    (url: string) => {
      return triggerGlobalEvent(window.top, 'NAVIGATE', { url });
    },
    [triggerGlobalEvent],
  );

  const createAnnotation = useCallback(() => {
    return triggerGlobalEvent(window.top, 'CREATE_ANNOTATION', {
      blurScreenshots: blurScreenshotsOnCapture,
    });
  }, [blurScreenshotsOnCapture, triggerGlobalEvent]);

  const cancelAnnotation = useCallback(() => {
    return triggerGlobalEvent(window.top, 'CANCEL_ANNOTATION');
  }, [triggerGlobalEvent]);

  const showAnnotation = useCallback(
    (annotation: MessageAnnotation) => {
      return triggerGlobalEvent(window.top, 'SHOW_ANNOTATION', {
        annotation,
      });
    },
    [triggerGlobalEvent],
  );

  const hideAnnotation = useCallback(
    (annotation: MessageAnnotation) => {
      return triggerGlobalEvent(window.top, 'HIDE_ANNOTATION', {
        annotation,
      });
    },
    [triggerGlobalEvent],
  );

  const getAnnotationMatchType = useCallback(
    (annotation: MessageAnnotation) => {
      return triggerGlobalEvent(window.top, 'GET_ANNOTATION_MATCH_TYPE', {
        annotation,
      });
    },
    [triggerGlobalEvent],
  );

  const drawArrowToAnnotation = useCallback(
    (annotation: MessageAnnotation, fromPosition: Point2D) => {
      return triggerGlobalEvent(window.top, 'DRAW_ARROW_TO_ANNOTATION', {
        annotation,
        fromPosition,
      });
    },
    [triggerGlobalEvent],
  );

  const scrollToAnnotation = useCallback(
    async (annotation: MessageAnnotation) => {
      await triggerGlobalEvent(window.top, 'SCROLL_TO_ANNOTATION', {
        annotation,
      });
    },
    [triggerGlobalEvent],
  );

  const skipToAnnotatedTime = useCallback(
    async (annotation: MessageAnnotation) => {
      await triggerGlobalEvent(window.top, 'SKIP_MEDIA_TO_ANNOTATED_TIME', {
        annotation,
      });
    },
    [triggerGlobalEvent],
  );

  const removeAnnotationArrow = useCallback(
    (annotation: MessageAnnotation, animate = false) => {
      return triggerGlobalEvent(window.top, 'REMOVE_ANNOTATION_ARROW', {
        annotation,
        animate,
      });
    },
    [triggerGlobalEvent],
  );

  const preloadImage = useCallback(
    (imageUrl: string) => {
      return triggerGlobalEvent(window.top, 'PRELOAD_IMAGE', { imageUrl });
    },
    [triggerGlobalEvent],
  );

  const showThirdPartyAuthDataModal = useCallback(
    (data?: { teamName?: string; title?: string; body?: string }) => {
      return triggerGlobalEvent(window.top, 'SHOW_THIRD_PARTY_AUTH_MODAL', {
        data,
      });
    },
    [triggerGlobalEvent],
  );

  const hideThirdPartyAuthDataModal = useCallback(() => {
    return triggerGlobalEvent(window.top, 'HIDE_THIRD_PARTY_AUTH_MODAL');
  }, [triggerGlobalEvent]);

  const proxyNavigateOverride = useCallback(
    async (
      url: string,
      location: Location | null,
      info: { orgID: string; threadID: string; groupID: string },
    ) => {
      const { navigated } = await triggerGlobalEvent(
        window.top,
        'CALL_NAVIGATE_OVERRIDE',
        {
          url,
          location,
          info,
        },
      );
      return navigated;
    },
    [triggerGlobalEvent],
  );

  const showConfirmModal = useCallback(
    async ({
      title,
      paragraphs,
      onConfirm,
      onCancel,
      confirmButtonText,
      cancelButtonText,
    }: {
      title: string;
      paragraphs: string[];
      onConfirm: () => void;
      onCancel: () => void;
      confirmButtonText: string;
      cancelButtonText: string;
    }) => {
      const confirmed = await triggerGlobalEvent(
        window.top,
        'SHOW_CONFIRM_MODAL',
        {
          title,
          paragraphs,
          confirmButtonText,
          cancelButtonText,
        },
      );
      if (confirmed) {
        onConfirm();
      } else {
        onCancel();
      }
    },
    [triggerGlobalEvent],
  );

  const contextValue = useMemo(
    () => ({
      supportsAnnotations: true,
      visible,
      navigate,
      createAnnotation,
      cancelAnnotation,
      showAnnotation,
      hideAnnotation,
      drawArrowToAnnotation,
      removeAnnotationArrow,
      skipToAnnotatedTime,
      getAnnotationMatchType,
      scrollToAnnotation,
      showConfirmModal,
      preloadImage,
      showThirdPartyAuthDataModal,
      hideThirdPartyAuthDataModal,
      proxyNavigateOverride,
    }),
    [
      visible,
      navigate,
      createAnnotation,
      cancelAnnotation,
      showAnnotation,
      hideAnnotation,
      drawArrowToAnnotation,
      removeAnnotationArrow,
      skipToAnnotatedTime,
      getAnnotationMatchType,
      scrollToAnnotation,
      showConfirmModal,
      preloadImage,
      showThirdPartyAuthDataModal,
      hideThirdPartyAuthDataModal,
      proxyNavigateOverride,
    ],
  );

  return (
    <SidebarConfigProvider
      showLauncher={sidebarConfig.showLauncher}
      showCloseButton={sidebarConfig.showCloseButton}
      showPresence={sidebarConfig.showPresence}
      showInbox={sidebarConfig.showInbox}
      excludeViewerFromPresence={sidebarConfig.excludeViewerFromPresence}
    >
      <AnnotationsConfigProvider showPinsOnPage={sidebarConfig.showPinsOnPage}>
        <EmbedContext.Provider value={contextValue}>
          <PageContext.Provider value={pageContext}>
            <ThreadNameContext.Provider value={{ threadName, default: false }}>
              {props.children}
            </ThreadNameContext.Provider>
          </PageContext.Provider>
        </EmbedContext.Provider>
      </AnnotationsConfigProvider>
    </SidebarConfigProvider>
  );
}

const DO_NOT_EXPORT_defaultEmbedContextValue: EmbedContextProps = {
  supportsAnnotations: false,
  visible: false,
  // these function never actually get used but are necessary for initialization
  navigate: (_: string) => {},
  createAnnotation: async () => '' as any,
  cancelAnnotation: () => {},
  showAnnotation: () => {},
  hideAnnotation: () => {},
  skipToAnnotatedTime: () => {},
  getAnnotationMatchType: async () => '' as any,
  drawArrowToAnnotation: () => '' as any,
  scrollToAnnotation: async () => {},
  removeAnnotationArrow: () => {},
  showConfirmModal: () => {},
  preloadImage: () => {},
  showThirdPartyAuthDataModal: () => null,
  hideThirdPartyAuthDataModal: () => {},
  proxyNavigateOverride: null,
};

export function DisabledEmbedProvider({
  children,
}: React.PropsWithChildren<unknown>) {
  return (
    <EmbedContext.Provider value={DO_NOT_EXPORT_defaultEmbedContextValue}>
      {children}
    </EmbedContext.Provider>
  );
}
