import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { createUseStyles } from 'react-jss';

import { useCordTranslation } from '@cord-sdk/react';
import type {
  DocumentAnnotationResult,
  DocumentLocation,
  Location,
  MessageAnnotation,
  Point2D,
  HighlightedTextConfig,
} from 'common/types/index.ts';
import {
  assertValid,
  bufferFromDataURL,
  validateFileForUpload,
} from 'common/uploads/index.ts';
import { MouseAnnotationPointer } from 'external/src/delegate/components/AnnotationPointer.tsx';
import { ActionBox } from 'external/src/delegate/components/ActionBox.tsx';
import { useEscapeListener } from 'external/src/effects/useEscapeListener.ts';
import { Overlay } from 'external/src/delegate/components/Overlay.tsx';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { useFeatureFlag } from 'external/src/effects/useFeatureFlag.ts';
import { DelegateContext } from 'external/src/context/delegate/DelegateContext.ts';
import type { FileForUpload } from 'external/src/effects/useFileUploader.ts';
import { useFileUploader } from 'external/src/effects/useFileUploader.ts';
import { NativeScreenshotter } from 'external/src/lib/nativeScreenshot/index.ts';
import { ApplicationContext } from 'external/src/context/embed/ApplicationContext.tsx';
import { useUpdatingRef } from 'external/src/effects/useUpdatingRef.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import {
  getCurrentSidebarWidth,
  getScrollBarWidth,
  getSidebarXPosition,
} from 'external/src/delegate/util.ts';
import type { DocumentLocationArgs } from 'external/src/delegate/location/AnnotationListener.ts';
import { AnnotationListener } from 'external/src/delegate/location/AnnotationListener.ts';
import { PageContext } from 'external/src/context/page/PageContext.ts';
import { useSidebarVisible } from 'external/src/delegate/hooks/useSidebarVisiblePreference.ts';
import type { ScreenshotUrls } from 'external/src/lib/nativeScreenshot/types.ts';
import { FeatureFlags } from 'common/const/FeatureFlags.ts';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import { AnnotationSDKContext } from 'external/src/context/annotations/AnnotationSDKContext.ts';
import { ComponentContext } from 'external/src/context/component/ComponentContext.tsx';
import { getCordCSSVariableDefaultValue } from 'common/ui/cssVariables.ts';
import { createAnnotationInstance } from 'external/src/delegate/annotations/index.ts';
import { ConfigurationContext } from 'external/src/context/config/ConfigurationContext.ts';
import { getHighlightedTextConfigFromAnnotation } from 'external/src/lib/util.ts';
import { ScreenshotConfigContext } from 'external/src/context/screenshotConfig/ScreenshotConfigContext.tsx';
import { PinnedAnnotationsContext } from 'external/src/context/annotations/PinnedAnnotationsContext.ts';
import { urlToScreenshotDataUrl } from 'external/src/lib/nativeScreenshot/util/urlToScreenshotDataUrl.ts';

const useStyles = createUseStyles({
  overlay: {
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
  },
});

type Props = {
  onSuccess: (result: DocumentAnnotationResult) => void;
  onCancel: () => void;
  blurScreenshots: boolean;
  withoutSidebar?: boolean;
  fullWidth?: boolean;
};

export function AnnotationCreator({
  onSuccess,
  onCancel: _onCancel,
  blurScreenshots,
  withoutSidebar,
  fullWidth,
}: Props) {
  const { t } = useCordTranslation('annotation');
  const classes = useStyles();
  const { user } = useContextThrowingIfNoProvider(IdentityContext);
  const annotationIDRef = useRef(uuid());
  const logger = useLogger();
  const {
    state: { thirdPartyObjects },
  } = useContextThrowingIfNoProvider(DelegateContext);

  const { onAnnotationCapture, getAnnotationPosition } =
    useContextThrowingIfNoProvider(AnnotationSDKContext);

  const {
    enableAnnotations,
    screenshotOptions: { captureWhen },
  } = useContextThrowingIfNoProvider(ConfigurationContext);
  const pageContext = useContextThrowingIfNoProvider(PageContext);
  const applicationID =
    useContextThrowingIfNoProvider(ApplicationContext)?.applicationID;
  const hashAnnotations = !useFeatureFlag(
    FeatureFlags.ENABLE_PLAINTEXT_ANNOTATIONS,
  );
  const enableTextAnnotations = useFeatureFlag(
    FeatureFlags.ENABLE_TEXT_ANNOTATIONS,
  );
  const enableOverlay = useFeatureFlag(FeatureFlags.ENABLE_ANNOTATIONS_OVERLAY);

  const screenshotConfig = useContextThrowingIfNoProvider(
    ScreenshotConfigContext,
  );

  const { annotationPinSize } = useContextThrowingIfNoProvider(
    PinnedAnnotationsContext,
  );

  const element = useContextThrowingIfNoProvider(ComponentContext)?.element;

  const [annotationPinColor, annotationPinOutlineColor] = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    const annotationPinColor = element
      ? getComputedStyle(element).getPropertyValue(
          `--cord-annotation-pin-unplaced-color`,
        )
      : getCordCSSVariableDefaultValue('annotation-pin-unplaced-color');

    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    const annotationPinOutlineColor = element
      ? getComputedStyle(element).getPropertyValue(
          `--cord-annotation-pin-unplaced-outline-color`,
        )
      : getCordCSSVariableDefaultValue('annotation-pin-unplaced-outline-color');

    return [annotationPinColor, annotationPinOutlineColor];
  }, [element]);

  const [hoveringOverSidebarOrActionBox, setHoveringOverSidebarOrActionBox] =
    useState(true);

  const [
    annotationAllowedOverHoveringElement,
    setAnnotationAllowedOverHoveringElement,
  ] = useState<boolean | undefined>(undefined);

  const [mousePositionVsViewport, setMousePositionVsViewport] = useState({
    x: 0,
    y: 0,
  });
  const mousePositionVsViewportRef = useUpdatingRef(mousePositionVsViewport);

  const [annotationPlaced, setAnnotationPlaced] = useState(false);

  const actionBoxRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);

  const [sidebarVisible] = useSidebarVisible();

  const [nativeScreenshotter] = useState(() => {
    if (!captureWhen.includes('new-annotation')) {
      return null;
    }
    return new NativeScreenshotter({
      sidebarVisible: sidebarVisible ?? false,
      logger,
      options: {
        annotationPinSize,
        annotationPinColor,
        annotationPinOutlineColor,
        screenshotConfig,
      },
    });
  });

  const onCancel = useCallback(() => {
    nativeScreenshotter?.cancel();
    _onCancel();
  }, [_onCancel, nativeScreenshotter]);

  useEscapeListener(onCancel);

  const { createFileForUpload, uploadFile } = useFileUploader();

  const createScreenshotFile = useCallback(() => {
    const mimeType = 'image/png';
    return {
      id: uuid(),
      mimeType,
      name: `annotation.${mimeType.split('/').pop()}`,
      uploadStatus: 'uploading' as const,
      url: '',
      provider: pageContext?.providerID ?? undefined,
      application: applicationID,
      size: 0,
    };
  }, [applicationID, pageContext?.providerID]);

  const uploadScreenshots = useCallback(
    (
      file: FileForUpload | null,
      screenshotFileInfo: {
        id: string;
        mimeType: string;
        name: string;
        uploadStatus: 'uploading';
        url: string;
      },
      blurredScreenshotFileInfo: null | {
        id: string;
        mimeType: string;
        name: string;
        uploadStatus: 'uploading';
        url: string;
      },
      screenshotUrls: ScreenshotUrls,
    ) => {
      if (!file) {
        return;
      }
      if (screenshotUrls.regular) {
        const buffer = bufferFromDataURL(screenshotUrls.regular);
        assertValid(
          validateFileForUpload('attachment', {
            name: screenshotFileInfo.name,
            mimeType: screenshotFileInfo.mimeType,
            size: buffer.length,
          }),
        );
        void uploadFile({ ...file, buffer });
      }
      if (screenshotUrls.blurred && screenshotUrls.regular) {
        void createFileForUpload(blurredScreenshotFileInfo!).then(
          (blurredFile) => {
            if (blurredFile) {
              const buffer = bufferFromDataURL(screenshotUrls.blurred!);
              void uploadFile({ ...blurredFile, buffer });
            }
          },
        );
      }
    },
    [createFileForUpload, uploadFile],
  );

  const createAnnotationObj = useCallback(
    async (documentLocationPromise: Promise<DocumentLocationArgs>) => {
      let location: DocumentLocation | null = null;
      let customLocation: Location | null = null;
      let customHighlightedTextConfig: HighlightedTextConfig | null = null;
      let customLabel: string | null = null;
      let coordsRelativeToTarget: Point2D | null = null;

      try {
        const result = await documentLocationPromise;
        location = result.location;
        customLocation = result.customLocation;
        customHighlightedTextConfig = result.customHighlightedTextConfig;
        customLabel = result.customLabel;
        coordsRelativeToTarget = result.coordsRelativeToTarget;
      } catch {
        location = null;
        customLocation = null;
        customLabel = null;
        customHighlightedTextConfig = null;
        coordsRelativeToTarget = null;
      }

      const annotation: MessageAnnotation = {
        id: annotationIDRef.current,
        location,
        customLocation,
        customHighlightedTextConfig,
        customLabel,
        coordsRelativeToTarget,
        sourceID: user?.id || '',
        draft: true,
      };
      return annotation;
    },
    [user?.id],
  );

  // This takes a function returning a promise, so that we can decide when to
  // call it. In the extension, it's important that we take the screenshot
  // first, as otherwise we risk screenshotting the wrong thing if the user
  // changes tab quickly
  const onAnnotate = useCallback(
    async (
      getDocumentLocation: () => Promise<DocumentLocationArgs>,
      /** @deprecated */
      screenshotTarget: Element | null,
    ) => {
      setAnnotationPlaced(true);
      // Some clients do NOT want screenshots for privacy reasons.
      if (!captureWhen.includes('new-annotation') || !nativeScreenshotter) {
        const annotation = await createAnnotationObj(getDocumentLocation());
        onSuccess({
          annotation,
          screenshot: null,
          blurredScreenshot: null,
        });
        return;
      }

      const screenshotFileInfo = createScreenshotFile();
      const blurredScreenshotFileInfo = blurScreenshots
        ? createScreenshotFile()
        : null;
      // Native screenshot happens after the annotation is placed because it is
      // slow - we don't want to block the UI
      const annotation = await createAnnotationObj(getDocumentLocation());
      let pinPosition = mousePositionVsViewportRef.current;
      if (annotation.customLocation) {
        const annotationInstance = createAnnotationInstance({
          annotation,
          thirdPartyObjects,
          getAnnotationPosition,
        });
        const annotationInstancePosition =
          await annotationInstance.getPosition();
        if (annotationInstancePosition) {
          pinPosition = {
            x: annotationInstancePosition.xVsViewport,
            y: annotationInstancePosition.yVsViewport,
          };
        }
      }

      const file = await createFileForUpload(screenshotFileInfo);

      onSuccess({
        annotation,
        screenshot: screenshotFileInfo,
        blurredScreenshot: blurredScreenshotFileInfo,
      });

      if (screenshotConfig?.screenshotUrlOverride) {
        urlToScreenshotDataUrl({
          url: screenshotConfig.screenshotUrlOverride,
          blurScreenshots,
          annotationPin: {
            position: pinPosition,
            size: annotationPinSize,
            color: annotationPinColor,
            outlineColor: annotationPinOutlineColor,
          },
          onDataUrlsReady: (dataUrls) => {
            uploadScreenshots(
              file,
              screenshotFileInfo,
              blurredScreenshotFileInfo,
              dataUrls,
            );
          },
        });
      } else {
        const dataURIs = await nativeScreenshotter.finishScreenshot({
          annotationInfo: {
            location: annotation.location,
            position: pinPosition,
          },
          includeBlurredVersion: blurScreenshots,
          highlightedTextConfig:
            getHighlightedTextConfigFromAnnotation(annotation),
          screenshotTarget,
        });
        if (dataURIs) {
          uploadScreenshots(
            file,
            screenshotFileInfo,
            blurredScreenshotFileInfo,
            dataURIs,
          );
        }
      }
    },
    [
      captureWhen,
      createScreenshotFile,
      blurScreenshots,
      nativeScreenshotter,
      createAnnotationObj,
      onSuccess,
      createFileForUpload,
      uploadScreenshots,
      mousePositionVsViewportRef,
      thirdPartyObjects,
      getAnnotationPosition,
      screenshotConfig?.screenshotUrlOverride,
      annotationPinColor,
      annotationPinOutlineColor,
      annotationPinSize,
    ],
  );

  useEffect(() => {
    if (screenshotConfig?.screenshotUrlOverride) {
      return;
    }

    // Kick off screenshot process
    nativeScreenshotter?.startScreenshot();
  }, [
    captureWhen,
    nativeScreenshotter,
    screenshotConfig?.screenshotUrlOverride,
  ]);

  const [highlightingText, setHighlightingText] = useState(false);

  const [hoveringOverCrossDomainIframe, setHoveringOverCrossDomainIframe] =
    useState(false);

  const [
    hoveringOverCustomAnnotationTarget,
    setHoveringOverCustomAnnotationTarget,
  ] = useState(false);

  const initialSidebarDimensions = useMemo(
    () => ({
      sidebarWidth: getCurrentSidebarWidth(),
      scrollBarWidth: getScrollBarWidth(),
      sidebarXPosition: getSidebarXPosition(),
    }),
    [],
  );
  const sidebarDimensionsRef = useRef(initialSidebarDimensions);

  useEffect(() => {
    const onResize = () =>
      (sidebarDimensionsRef.current = {
        sidebarWidth: getCurrentSidebarWidth(),
        scrollBarWidth: getScrollBarWidth(),
        sidebarXPosition: getSidebarXPosition(),
      });
    window.addEventListener('resize', onResize, true);
    return () => window.removeEventListener('resize', onResize, true);
  }, []);

  const pointerHidden =
    hoveringOverSidebarOrActionBox ||
    highlightingText ||
    annotationAllowedOverHoveringElement === false ||
    !enableAnnotations;

  const overlayRef = useRef<HTMLDivElement>(null);

  const listenerRefs = useUpdatingRef({
    onAnnotate,
    setHoveringOverCrossDomainIframe,
    setHoveringOverSidebarOrActionBox,
    setAnnotationAllowedOverHoveringElement,
    setHoveringOverCustomAnnotationTarget,
    setMousePositionVsViewport,
    setHighlightingText,
    sidebarDimensions: sidebarDimensionsRef.current,
    hashAnnotations,
    thirdPartyObjects,
    onAnnotationCapture,
  });
  const loggerRef = useUpdatingRef(logger);

  const componentElementRef = useUpdatingRef(element);

  useEffect(() => {
    const annotationListener = new AnnotationListener({
      refs: listenerRefs,
      overlayRef,
      pointerRef,
      loggerRef,
      componentElementRef,
      enableAnnotations,
      enableTextAnnotations,
    });
    return () => annotationListener.cleanup('unmount');
  }, [
    listenerRefs,
    loggerRef,
    componentElementRef,
    enableAnnotations,
    enableTextAnnotations,
  ]);

  return (
    <Overlay
      // Allowing pointer events means the overlay blocks. This is just the
      // initial value. We change the inline style in AnnotationListener and
      // before getDocLocation
      allowPointerEvents={enableOverlay}
      backgroundColor="transparent"
      className={classes.overlay}
      sidebarBackgroundColor="dark"
      includeOnClickOnSidebar={false}
      forwardRef={enableOverlay ? overlayRef : undefined}
      withoutSidebar={withoutSidebar ?? !sidebarVisible}
      zIndexLayer="annotation"
      fullWidth={fullWidth}
    >
      <MouseAnnotationPointer
        positionVsViewport={mousePositionVsViewport}
        hidden={pointerHidden}
        forwardRef={pointerRef}
        annotationPlaced={annotationPlaced}
        tooltipLabel={t(
          hoveringOverCrossDomainIframe || hoveringOverCustomAnnotationTarget
            ? 'click_tooltip'
            : 'click_or_select_tooltip',
        )}
      />
      {!annotationPlaced && (
        <ActionBox
          forwardRef={actionBoxRef}
          text={t('click_prompt')}
          actionText={t('cancel_annotating')}
          actionCallback={onCancel}
        />
      )}
    </Overlay>
  );
}
