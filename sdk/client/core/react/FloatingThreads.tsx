import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FloatingThreadsReactComponentProps } from '@cord-sdk/react';
import { withGroupIDCheck } from '@cord-sdk/react/common/hoc/withGroupIDCheck.tsx';

import { PinnedAnnotationPointers } from 'external/src/delegate/components/AnnotationPointers.tsx';
import { AnnotationsOnPageProvider } from 'external/src/context/annotationsOnPage/AnnotationsOnPageProvider.tsx';
import { AnnotatingConfigContext } from 'external/src/context/annotationConfig/AnnotatingConfigContext.ts';
import { AnnotationCreator } from 'external/src/delegate/components/AnnotationCreator.tsx';
import type { Button2CSSVariablesOverride } from 'external/src/components/ui2/Button2.tsx';
import { Button2 } from 'external/src/components/ui2/Button2.tsx';
import type { DocumentAnnotationResult } from 'common/types/index.ts';
import { AnnotationPointer } from 'external/src/delegate/components/AnnotationPointer.tsx';
import { AnnotationSDKContext } from 'external/src/context/annotations/AnnotationSDKContext.ts';
import { createAnnotationInstance } from 'external/src/delegate/annotations/index.ts';
import type { AnnotationPosition } from 'external/src/delegate/annotations/types.ts';
import { useEscapeListener } from 'external/src/effects/useEscapeListener.ts';
import { DelegateContext } from 'external/src/context/delegate/DelegateContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import type { ComposerAttachment } from 'external/src/context/composer/ComposerState.ts';
import { ComponentPageContextProvider } from 'sdk/client/core/react/ComponentPageContextProvider.tsx';
import { ThreadsContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { FloatingComposer } from 'sdk/client/core/react/FloatingComposer.tsx';
import { useAnnotationPositionUpdater } from 'external/src/delegate/hooks/useAnnotationPositionUpdater.ts';
import { REDRAW_ANNOTATIONS_CUSTOM_EVENT_NAME } from 'common/const/Strings.ts';
import { useClickOutside } from 'external/src/effects/useClickOutside.ts';
import { WithNotificationMessage2 } from 'external/src/components/2/WithNotificationMessage2.tsx';
import { MaybeThreadNameContext } from 'external/src/context/page/ThreadNameContext.tsx';
import { AnnotatingConfigProvider } from 'external/src/context/annotationConfig/AnnotatingConfigProvider.tsx';
import { FloatingThreadsContext } from 'external/src/context/floatingThreads/FloatingThreadsContext.ts';
import { getHighlightedTextConfigFromAnnotation } from 'external/src/lib/util.ts';
import { useCloseThreadWithWarning } from 'sdk/client/core/react/useCloseThreadWithWarning.ts';
import type { AnnotationPillDisplayContextProps } from 'external/src/context/annotations/AnnotationPillDisplayContext.tsx';
import { AnnotationPillDisplayContext } from 'external/src/context/annotations/AnnotationPillDisplayContext.tsx';
import { getFloatingElementCoords } from 'external/src/delegate/annotations/util.ts';
import { useHeightTracker } from 'external/src/effects/useDimensionTracker.ts';
import { DisabledCSSVariableOverrideContextProvider } from 'external/src/context/cssVariableOverride/CSSVariableOverrideContext.tsx';
import { DisabledThreadListContext } from 'sdk/client/core/react/ThreadList.tsx';
import { AnnotationsConfigProvider } from 'external/src/context/annotations/AnnotationConfigContext.tsx';
import type { FloatingThreadsWebComponent } from 'sdk/client/core/components/cord-floating-threads.tsx';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { ScreenshotConfigProvider } from 'external/src/context/screenshotConfig/ScreenshotConfigContext.tsx';
import type { WebComponentProps } from 'sdk/client/core/react/types.ts';
import { PinnedAnnotationsContext } from 'external/src/context/annotations/PinnedAnnotationsContext.ts';
import { OrgOverrideProvider } from 'external/src/context/organization/OrganizationContext.tsx';

type DraftAnnotation = {
  documentAnnotationResult: DocumentAnnotationResult;
  annotationInstance: ReturnType<typeof createAnnotationInstance>;
  position: AnnotationPosition | null;
  clear: () => void;
};

const CSS_VARIABLES: Button2CSSVariablesOverride = {
  fontSize: 'floating-threads-font-size',
  lineHeight: 'floating-threads-line-height',
  letterSpacing: 'floating-threads-letter-spacing',
  color: 'floating-threads-text-color',
  colorHover: 'floating-threads-text-color--hover',
  colorActive: 'floating-threads-text-color--active',
  colorDisabled: 'floating-threads-text-color--disabled',
  backgroundColor: 'floating-threads-background-color',
  backgroundColorHover: 'floating-threads-background-color--hover',
  backgroundColorActive: 'floating-threads-background-color--active',
  backgroundColorDisabled: 'floating-threads-background-color--disabled',
  padding: 'floating-threads-padding',
  gap: 'floating-threads-gap',
  iconSize: 'floating-threads-icon-size',
  height: 'floating-threads-height',
  border: 'floating-threads-border',
};

let shouldLogLoadingTime = false;
try {
  shouldLogLoadingTime = !!localStorage.getItem('__cord_log_loading_times__');
} catch {
  // localStorage for some reason not available
}

const FloatingThreads = withGroupIDCheck<
  FloatingThreadsReactComponentProps &
    WebComponentProps<FloatingThreadsWebComponent>
>(FloatingThreadsWrapper, 'FloatingThreads');

function FloatingThreadsWrapper({
  location,
  showButton = true,
  buttonLabel = 'Add comment',
  iconUrl,
  threadName,
  disabled,
  screenshotConfig,
  showScreenshotPreview = false,
  groupId,
  onStart,
  onFinish,
  onCancel,
  thisElement,
}: FloatingThreadsReactComponentProps &
  WebComponentProps<FloatingThreadsWebComponent>) {
  return (
    <OrgOverrideProvider externalOrgID={groupId}>
      <ScreenshotConfigProvider screenshotConfig={screenshotConfig}>
        <AnnotationsConfigProvider showPinsOnPage={true}>
          <DisabledThreadListContext>
            <ComponentPageContextProvider location={location}>
              <AnnotatingConfigProvider>
                <AnnotationsOnPageProvider
                  location={location}
                  includeDeleted={true}
                >
                  <MaybeThreadNameContext threadName={threadName}>
                    <DisabledCSSVariableOverrideContextProvider>
                      <FloatingThreadsImpl
                        showButton={showButton}
                        buttonLabel={buttonLabel}
                        iconUrl={iconUrl}
                        disabled={disabled}
                        showScreenshotPreview={showScreenshotPreview}
                        onStart={onStart}
                        onFinish={onFinish}
                        onCancel={onCancel}
                        thisElement={thisElement}
                      />
                    </DisabledCSSVariableOverrideContextProvider>
                  </MaybeThreadNameContext>
                </AnnotationsOnPageProvider>
              </AnnotatingConfigProvider>
            </ComponentPageContextProvider>
          </DisabledThreadListContext>
        </AnnotationsConfigProvider>
      </ScreenshotConfigProvider>
    </OrgOverrideProvider>
  );
}

function FloatingThreadsImpl({
  showButton,
  buttonLabel,
  iconUrl,
  disabled,
  showScreenshotPreview,
  onStart,
  onFinish,
  onCancel,
  thisElement,
}: {
  showButton: boolean;
  buttonLabel: string;
  iconUrl: string | undefined;
  disabled: boolean | undefined;
  showScreenshotPreview: boolean;
  onStart: (() => unknown) | undefined;
  onFinish: ((threadID: string) => unknown) | undefined;
  onCancel: (() => unknown) | undefined;
  thisElement: FloatingThreadsWebComponent;
}) {
  const {
    annotatingConfig,
    startAnnotating,
    cancelAnnotating,
    completeAnnotating,
  } = useContextThrowingIfNoProvider(AnnotatingConfigContext);
  const { getAnnotationPosition } =
    useContextThrowingIfNoProvider(AnnotationSDKContext);
  const {
    state: { thirdPartyObjects },
  } = useContextThrowingIfNoProvider(DelegateContext);

  const { logError } = useLogger();

  const { getThreadByExternalID } =
    useContextThrowingIfNoProvider(ThreadsContext2);
  const floatingThreadsCtx = useContextThrowingIfNoProvider(
    FloatingThreadsContext,
  );
  const setOpenThreadID = floatingThreadsCtx?.setOpenThreadID;
  const openThreadID = floatingThreadsCtx?.openThreadID;

  const composerRef = useRef<HTMLDivElement | null>(null);

  const [composerContainerRef] = useHeightTracker<HTMLDivElement>();

  // In-memory annotation, before a message is sent.
  const [draftAnnotation, setDraftAnnotation] =
    useState<DraftAnnotation | null>(null);
  const clearDraftAnnotation = useCallback(() => {
    setDraftAnnotation(null);
  }, []);

  // We want event callbacks to fire after the react render loop has fully run
  // To do that we explicitly trigger a state change and then useEffect to listen
  // for the value change.  This helps us in cases where someone may call back into
  // the FloatingThread in an event handler
  const [event, setEvent] = useState<'start' | 'finish' | 'cancel' | null>(
    null,
  );

  useEffect(() => {
    // This callback needs to be the last thing run so we explicitly put it one
    // tick behind the last render
    window.requestAnimationFrame(() => {
      if (event === 'start') {
        // Only send start events if openThreadID is null
        if (!openThreadID) {
          onStart?.();
        }
      } else if (event === 'finish') {
        // Only send finish events if openThreadID is set
        if (openThreadID) {
          onFinish?.(openThreadID);
        }
      } else if (event === 'cancel') {
        // Only send cancel events if openThreadID is null
        if (!openThreadID) {
          onCancel?.();
        }
      }
    });
  }, [event, onStart, onFinish, onCancel, openThreadID]);

  const updateAnnotationPositions = useCallback(async () => {
    if (!draftAnnotation) {
      return;
    }

    const position = await draftAnnotation.annotationInstance.getPosition();
    setDraftAnnotation((prev) => {
      if (!prev) {
        return null;
      }

      return { ...prev, position };
    });
  }, [draftAnnotation]);
  useAnnotationPositionUpdater(updateAnnotationPositions, null);
  useEffect(() => {
    window.addEventListener(
      REDRAW_ANNOTATIONS_CUSTOM_EVENT_NAME,
      // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      updateAnnotationPositions,
    );

    return () =>
      window.removeEventListener(
        REDRAW_ANNOTATIONS_CUSTOM_EVENT_NAME,
        // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
        updateAnnotationPositions,
      );
  }, [updateAnnotationPositions]);

  const handleCreateThreadClick = useCallback(() => {
    setOpenThreadID?.(null);

    startAnnotating({
      blurScreenshots: false,
      // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      onSuccess: async ({ annotation, screenshot, blurredScreenshot }) => {
        const annotationInstance = createAnnotationInstance({
          annotation,
          thirdPartyObjects,
          getAnnotationPosition,
        });
        try {
          const position = await annotationInstance.getPosition();
          setDraftAnnotation({
            documentAnnotationResult: {
              annotation,
              screenshot,
              blurredScreenshot,
            },
            position,
            clear: clearDraftAnnotation,
            annotationInstance,
          });
        } catch (error) {
          logError('floating-threads-get-position-failed', {
            message:
              'Known issue. Checking to see how often this happens in prod',
            error: JSON.stringify(error),
          });
        } finally {
          completeAnnotating();
        }
      },
      onCancel: () => {
        cancelAnnotating();
        setEvent('cancel');
      },
    });
    setEvent('start');
  }, [
    cancelAnnotating,
    clearDraftAnnotation,
    completeAnnotating,
    getAnnotationPosition,
    setOpenThreadID,
    startAnnotating,
    thirdPartyObjects,
    setEvent,
    logError,
  ]);

  const setOpenThreadIDAndClearDraftAnnotation = useCallback(
    (threadID: string | null) => {
      setOpenThreadID?.(threadID);
      draftAnnotation?.clear();
    },
    [draftAnnotation, setOpenThreadID],
  );

  const closeComposerAndClearDraftAnnotation = useCallback(() => {
    setOpenThreadIDAndClearDraftAnnotation(null);
    setEvent('cancel');
  }, [setOpenThreadIDAndClearDraftAnnotation, setEvent]);

  const closeComposerWithWarning = useCloseThreadWithWarning(
    closeComposerAndClearDraftAnnotation,
  );
  useClickOutside({
    onMouseDown: closeComposerWithWarning,
    elementRef: composerRef,
    disabled: !draftAnnotation,
    capture: true,
  });
  useEscapeListener(closeComposerWithWarning, !draftAnnotation);

  const handleCancel = useCallback(() => {
    if (draftAnnotation?.position) {
      closeComposerWithWarning();
    } else {
      cancelAnnotating();
    }
    setEvent('cancel');
  }, [cancelAnnotating, closeComposerWithWarning, draftAnnotation, setEvent]);

  useEffect(() => {
    thisElement._setExternalFunction('openThread', (threadId: string) => {
      setOpenThreadID?.(getThreadByExternalID(threadId)?.id ?? threadId);
    });
    thisElement._setExternalFunction('createThread', handleCreateThreadClick);
    thisElement._setExternalFunction('cancelThread', handleCancel);

    return () => {
      thisElement._setExternalFunction('openThread', () => {});
      thisElement._setExternalFunction('createThread', () => {});
      thisElement._setExternalFunction('cancelThread', () => {});
    };
  }, [
    thisElement,
    getThreadByExternalID,
    handleCreateThreadClick,
    setOpenThreadID,
    handleCancel,
  ]);

  const { annotationPinSize } = useContextThrowingIfNoProvider(
    PinnedAnnotationsContext,
  );

  const ctx: AnnotationPillDisplayContextProps = useMemo(
    () => ({ hidden: !showScreenshotPreview }),
    [showScreenshotPreview],
  );

  const icon = useMemo(() => {
    if (iconUrl === null || iconUrl === undefined) {
      return 'ChatAdd' as const;
    }

    if (iconUrl === '') {
      return undefined;
    }

    try {
      return new URL(iconUrl);
    } catch {
      console.error(`FloatingThreads: Invalid URL: ${iconUrl}`);
      return undefined;
    }
  }, [iconUrl]);

  useEffect(() => {
    if (shouldLogLoadingTime) {
      // eslint-disable-next-line no-console
      console.log(
        `<FloatingThreads> first render: ${new Date().toISOString()}`,
      );
    }
  }, []);

  return (
    <AnnotationPillDisplayContext.Provider value={ctx}>
      <PinnedAnnotationPointers
        allowHidingAnnotations={false}
        hideStaleAnnotations={false}
        showFloatingThreads={true}
      />

      {showButton && (
        <WithNotificationMessage2 notificationType="floatingThreads">
          <Button2
            disabled={disabled}
            buttonType="secondary"
            size="medium"
            onClick={handleCreateThreadClick}
            icon={icon}
            cssVariablesOverride={CSS_VARIABLES}
          >
            {buttonLabel}
          </Button2>
        </WithNotificationMessage2>
      )}

      {draftAnnotation?.position && (
        <AnnotationPointer
          annotation={draftAnnotation.documentAnnotationResult.annotation}
          highlightedTextConfig={getHighlightedTextConfigFromAnnotation(
            draftAnnotation.documentAnnotationResult.annotation,
          )}
          positionVsViewport={{
            x: draftAnnotation.position.xVsViewport,
            y: draftAnnotation.position.yVsViewport,
          }}
          isHotspotAnnotation
          hasOpenThread
          setHiddenAnnotation={closeComposerAndClearDraftAnnotation}
          hidden={!draftAnnotation.position.visible}
        >
          <div
            style={{
              position: 'absolute',
              ...getFloatingElementCoords(
                draftAnnotation.position,
                composerContainerRef.current?.getBoundingClientRect(),
                annotationPinSize,
              ),
            }}
            ref={composerContainerRef}
          >
            <FloatingComposer
              forwardRef={composerRef}
              draftAnnotation={convertDraftAnnotationToAttachment(
                draftAnnotation,
              )}
              onComplete={(threadID) => {
                setOpenThreadIDAndClearDraftAnnotation(threadID);
                setEvent('finish');
              }}
            />
          </div>
        </AnnotationPointer>
      )}
      {annotatingConfig && (
        <AnnotationCreator {...annotatingConfig} withoutSidebar fullWidth />
      )}
    </AnnotationPillDisplayContext.Provider>
  );
}

// TODO: make this automatic
export default memo(FloatingThreads);

function convertDraftAnnotationToAttachment(
  draftAnnotation: DraftAnnotation,
): ComposerAttachment {
  return {
    id: draftAnnotation.documentAnnotationResult.annotation.id,
    type: 'annotation',
    location: draftAnnotation.documentAnnotationResult.annotation.location,
    customLocation:
      draftAnnotation.documentAnnotationResult.annotation.customLocation,
    customHighlightedTextConfig:
      draftAnnotation.documentAnnotationResult.annotation
        .customHighlightedTextConfig,
    customLabel:
      draftAnnotation.documentAnnotationResult.annotation.customLabel,
    coordsRelativeToTarget:
      draftAnnotation.documentAnnotationResult.annotation
        .coordsRelativeToTarget,
    screenshot: draftAnnotation.documentAnnotationResult.screenshot,
    blurredScreenshot:
      draftAnnotation.documentAnnotationResult.blurredScreenshot,
    size: draftAnnotation.documentAnnotationResult.screenshot?.size ?? 0,
    message: {
      source: {
        id: draftAnnotation.documentAnnotationResult.annotation.sourceID,
      },
    },
  };
}
