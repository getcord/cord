import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { useCordTranslation } from '@cord-sdk/react';
import type { UUID, Screenshot } from 'common/types/index.ts';
import {
  LocationMatch,
  MessageAttachmentType,
  locationEqual,
} from 'common/types/index.ts';
import { EmbedContext } from 'external/src/context/embed/EmbedContext.ts';
import { ANNOTATION_LOCATION_MATCH_INTERVAL_MS } from 'common/const/Timing.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { useMessageAnnotationAndAttachment } from 'external/src/components/chat/annotations/useAnnotationAndAttachment.ts';
import { ScreenshotBox2 } from 'external/src/components/2/ScreenshotBox2.tsx';
import { useUpdatingRef } from 'external/src/effects/useUpdatingRef.ts';
import { useScrollToAndShowAnnotation } from 'external/src/effects/useScrollToAndShowAnnotation.ts';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import { useMediaModal } from 'external/src/effects/useImageModal.tsx';
import type {
  FileFragment,
  MessageFragment,
} from 'external/src/graphql/operations.ts';
import { isUserAuthorOfMessage } from 'external/src/lib/util.ts';
import { usePreference } from 'external/src/effects/usePreference.ts';
import { DISABLE_HOTSPOT_ANNOTATIONS } from 'common/const/UserPreferenceKeys.ts';
import { AnnotationsOnPageContext } from 'external/src/context/annotationsOnPage/AnnotationsOnPageContext.ts';
import { DeepLinkContext } from 'external/src/context/deepLink/DeepLinkContext.ts';
import { useDocumentVisibility } from 'external/src/effects/useDocumentVisibility.ts';
import { PageContext } from 'external/src/context/page/PageContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { Thread2Context } from 'external/src/context/thread2/Thread2Context.ts';
import { ScrollContainerContext } from 'external/src/context/scrollContainer/ScrollContainerContext.ts';
import { AnnotationPill2 } from 'external/src/components/ui2/AnnotationPill2.tsx';
import { getAnnotationTextToShow } from 'external/src/components/chat/composer/annotations/util.ts';
import { ComposerContext } from 'external/src/context/composer/ComposerContext.ts';
import { Button2 } from 'external/src/components/ui2/Button2.tsx';
import { WithTooltip2 } from 'external/src/components/ui2/WithTooltip2.tsx';
import { ButtonGroup2 } from 'external/src/components/ui2/ButtonGroup2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import { useThreadData } from 'external/src/components/2/hooks/useThreadData.ts';
import { ConfigurationContext } from 'external/src/context/config/ConfigurationContext.ts';
import { AnnotationSDKContext } from 'external/src/context/annotations/AnnotationSDKContext.ts';
import { ComponentContext } from 'external/src/context/component/ComponentContext.tsx';
import { PinnedAnnotationsContext } from 'external/src/context/annotations/PinnedAnnotationsContext.ts';
import { ThreadListContext } from 'sdk/client/core/react/ThreadList.tsx';
import type { BlurDisplayLocation } from '@cord-sdk/types';
import type { ThreadsLocation2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { ThreadsContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { AnnotationsConfigContext } from 'external/src/context/annotations/AnnotationConfigContext.tsx';
import { getThreadSummary } from 'common/util/convertToExternal/thread.ts';
import { externalizeID } from 'common/util/externalIDs.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { isDefined } from 'common/util/index.ts';
import { MediaModalContext } from 'external/src/context/mediaModal/MediaModalContext.tsx';

type Props = {
  annotationAttachmentID: UUID;
  message: MessageFragment;
};

const useStyles = createUseStyles({
  showAnnotationButton: {
    // this button uses the secondary hover style all the time to give the
    // sense that the hidden annotation pin mode is toggled on
    color: cssVar('color-content-emphasis'),
    backgroundColor: cssVar('color-base-x-strong'),
  },
  inactiveAnnotationPill: {
    cursor: 'inherit',
    '&:hover': {
      borderColor: cssVar('color-base-strong'),
    },
  },
});

export function MessageAnnotationElement2({
  annotationAttachmentID,
  message,
}: Props) {
  const { t } = useCordTranslation('annotation');
  const classes = useStyles();

  const [annotationMatchType, setAnnotationMatchType] = useState<LocationMatch>(
    LocationMatch.EXACT,
  );
  const [hoverOverAnnotationBox, setHoverOverAnnotationBox] = useState(false);

  const threadsContext = useContextThrowingIfNoProvider(ThreadsContext2);
  const { threadID } = useContextThrowingIfNoProvider(Thread2Context);
  const thread = useThreadData();
  const location = threadsContext.location;

  const {
    screenshotOptions: {
      showBlurred: blurScreenshotDisplayBehavior,
      showScreenshot,
    },
  } = useContextThrowingIfNoProvider(ConfigurationContext);
  const { showPinsOnPage } = useContextThrowingIfNoProvider(
    AnnotationsConfigContext,
  );

  const pageContext = useContextThrowingIfNoProvider(PageContext);

  const { shouldShowDeepLinkHighlight } =
    useContextThrowingIfNoProvider(DeepLinkContext);

  const showDeepLinkHighlight = shouldShowDeepLinkHighlight(threadID, message);

  const {
    state: { editingMessageID },
  } = useContextThrowingIfNoProvider(ComposerContext);

  // If annotation on different page, we default to showing the screenshot
  const annotationOnDifferentPage = useMemo(() => {
    // Check that the page context is the same - it can be different if viewer
    // is in inbox
    return (
      !pageContext || !locationEqual(thread?.location ?? null, pageContext.data)
    );
  }, [pageContext, thread?.location]);

  const containerRef = useRef<HTMLDivElement>(null);

  const { logEvent } = useLogger();

  const { user } = useContextThrowingIfNoProvider(IdentityContext);

  const isDocumentVisible = useDocumentVisibility();
  const isAuthorOfMessage = isUserAuthorOfMessage(message, user.externalID);

  // the attachment could be undefined if it was removed from the database for some reason,
  // such as copyright infringement or other types of content against the t&c
  const { attachment: _attachment, annotation } =
    useMessageAnnotationAndAttachment(
      message.attachments,
      annotationAttachmentID,
    );

  // Use blurred screenshot if necessary
  const [screenshot, screenshotIsBlurred] = useMemo(
    () =>
      screenshotToShow(
        _attachment,
        blurScreenshotDisplayBehavior,
        location,
        !!isAuthorOfMessage,
      ),
    [_attachment, isAuthorOfMessage, blurScreenshotDisplayBehavior, location],
  );

  const {
    showAnnotation,
    hideAnnotation,
    getAnnotationMatchType,
    drawArrowToAnnotation,
    removeAnnotationArrow,
    preloadImage,
    skipToAnnotatedTime,
  } = useContextThrowingIfNoProvider(EmbedContext);

  const { hideSmallMediaModal: hideSmallImageModal } =
    useContextThrowingIfNoProvider(MediaModalContext);

  // Check whether annotation is valid, i.e. whether it can be found in DOM
  useEffect(() => {
    if (!annotation) {
      setAnnotationMatchType(LocationMatch.NONE);
      return undefined;
    }
    if (!isDocumentVisible || annotationOnDifferentPage) {
      return undefined;
    }
    const updateAnnotationMatchType = async () => {
      const matchType = await getAnnotationMatchType(annotation);
      setAnnotationMatchType(matchType);
    };
    const interval = setInterval(
      // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      updateAnnotationMatchType,
      ANNOTATION_LOCATION_MATCH_INTERVAL_MS,
    );
    void updateAnnotationMatchType();
    return () => {
      clearInterval(interval);
    };
  }, [
    annotation,
    annotationOnDifferentPage,
    getAnnotationMatchType,
    isDocumentVisible,
  ]);

  const scrollContainerContext = useContextThrowingIfNoProvider(
    ScrollContainerContext,
  );

  const getStartPosition = useCallback(() => {
    const clientRect = containerRef.current!.getBoundingClientRect();
    return {
      x: clientRect.x,
      y: clientRect.y + clientRect.height / 2,
    };
  }, []);

  const onMouseLeaveAnnotation = useCallback(() => {
    if (annotation) {
      removeAnnotationArrow(annotation);
    }
  }, [annotation, removeAnnotationArrow]);

  // Correct for mouseLeave not being triggered when scrolling away from element
  const scrollListener = useCallback(
    () => onMouseLeaveAnnotation(),
    [onMouseLeaveAnnotation],
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      scrollContainerContext?.removeScrollListener(scrollListener);
      onMouseLeaveAnnotation();
    };
  }, [onMouseLeaveAnnotation, scrollContainerContext, scrollListener]);

  const annotationValid = useMemo(() => {
    const invalidLocations = [
      LocationMatch.NONE,
      LocationMatch.INCOMPATIBLE_IDENTIFIER_VERSION,
      LocationMatch.UNAVAILABLE,
      LocationMatch.INACCESSIBLE_CROSS_DOMAIN_IFRAME,
      LocationMatch.OUTSIDE_INACCESSIBLE_VIRTUALISED_LIST,
    ];
    const hasInvalidLocation = invalidLocations.includes(annotationMatchType);
    return !annotationOnDifferentPage && !hasInvalidLocation;
  }, [annotationMatchType, annotationOnDifferentPage]);

  const attachmentFragment: FileFragment | null = screenshot
    ? {
        ...screenshot,
        __typename: 'File',
      }
    : null;

  const uploadState = attachmentFragment?.uploadStatus;

  const _showMediaModal = useMediaModal(screenshot ? [screenshot] : []);
  const showMediaModal = useCallback(
    (size: 'small' | 'large') => {
      if (!screenshot) {
        return;
      }
      const small = size === 'small';
      _showMediaModal({
        mediaIndex: 0,
        small,
        blurred: screenshotIsBlurred,
        bannerConfig: small
          ? null
          : {
              timestamp: message.timestamp,
              source: message.source,
              attachmentType: MessageAttachmentType.ANNOTATION,
            },
      });
    },
    [_showMediaModal, screenshot, screenshotIsBlurred, message],
  );

  const hoverRef = useUpdatingRef(hoverOverAnnotationBox);

  const scrollToAndShowAnnotation = useScrollToAndShowAnnotation(
    annotation,
    getStartPosition,
    hoverRef,
  );

  const [disableHotspotAnnotations] = usePreference(
    DISABLE_HOTSPOT_ANNOTATIONS,
  );

  const { isAnnotationOnPage } = useContextThrowingIfNoProvider(
    PinnedAnnotationsContext,
  );

  const { annotationSetID, addAnnotationToPage, animateAnnotation } =
    useContextThrowingIfNoProvider(AnnotationsOnPageContext);

  const { onAnnotationClick } =
    useContextThrowingIfNoProvider(AnnotationSDKContext);

  const { onThreadClick } = useContextThrowingIfNoProvider(ThreadListContext);

  const onClickShowAnnotationOnPage = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      event.stopPropagation();
      if (!annotation) {
        return;
      }
      addAnnotationToPage({
        ...annotation,
        messageID: message.id,
        threadID,
      });
      animateAnnotation(annotation.id);
    },
    [addAnnotationToPage, animateAnnotation, annotation, message.id, threadID],
  );

  const {
    byInternalID: { userByID },
  } = useContextThrowingIfNoProvider(UsersContext);

  const onClickAnnotation = useCallback(() => {
    if (!annotation) {
      return;
    }

    if (thread) {
      onThreadClick?.(
        thread?.externalID ?? externalizeID(threadID),
        getThreadSummary(thread, userByID),
      );
    }

    if (annotation.customLocation) {
      onAnnotationClick({
        id: annotation.id,
        location: annotation.customLocation,
        threadID: thread?.externalID ?? externalizeID(threadID),
      });
      hideAnnotation(annotation);
      removeAnnotationArrow(annotation);
    }

    logEvent('click-annotation', {
      customAnnotation: Boolean(annotation.customLocation),
    });
    if (annotationValid) {
      void scrollToAndShowAnnotation();
      if (annotation.location?.multimediaConfig) {
        skipToAnnotatedTime(annotation);
      }
    } else {
      showMediaModal('large');
    }
  }, [
    thread,
    threadID,
    annotation,
    onThreadClick,
    logEvent,
    annotationValid,
    onAnnotationClick,
    hideAnnotation,
    removeAnnotationArrow,
    scrollToAndShowAnnotation,
    skipToAnnotatedTime,
    showMediaModal,
    userByID,
  ]);

  const imgPreloadedRef = useRef(false);

  const handleMouseOver = useCallback(() => {
    if (!imgPreloadedRef.current && screenshot) {
      preloadImage(screenshot.url);
      imgPreloadedRef.current = true;
    }
    const shouldDrawPointerAndArrow =
      !annotationOnDifferentPage && annotationValid;
    if (shouldDrawPointerAndArrow && annotation) {
      showAnnotation(annotation);
      drawArrowToAnnotation(annotation, getStartPosition());
      scrollContainerContext?.addScrollListener(scrollListener);
      if (!hoverOverAnnotationBox) {
        logEvent('show-annotation');
      }
    }
    setHoverOverAnnotationBox(true);
  }, [
    screenshot,
    annotationOnDifferentPage,
    annotationValid,
    annotation,
    preloadImage,
    showAnnotation,
    drawArrowToAnnotation,
    getStartPosition,
    scrollContainerContext,
    scrollListener,
    hoverOverAnnotationBox,
    logEvent,
  ]);

  const handleMouseLeave = useCallback(() => {
    setHoverOverAnnotationBox(false);
    const shouldRemovePointerAndArrow = !annotationOnDifferentPage;
    if (shouldRemovePointerAndArrow && annotation) {
      hideAnnotation(annotation);
      removeAnnotationArrow(annotation);
      logEvent('hide-annotation');
      scrollContainerContext?.removeScrollListener(scrollListener);
    }
  }, [
    annotation,
    annotationOnDifferentPage,
    scrollContainerContext,
    hideAnnotation,
    logEvent,
    removeAnnotationArrow,
    scrollListener,
  ]);

  const showShowOnPageButton = !!(
    !disableHotspotAnnotations &&
    annotation &&
    !annotationOnDifferentPage &&
    showPinsOnPage &&
    !isAnnotationOnPage(annotationSetID, annotation.id)
  );

  // When true, we show the screenshot when hovering on the annotation,
  // instead of showing pointer and arrow.
  const name = useContextThrowingIfNoProvider(ComponentContext)?.name;

  const shouldToggleScreenshotOnHover =
    screenshot && !annotationValid && (!name || name === 'cord-sidebar');

  const annotationText = getAnnotationTextToShow(annotation);

  const isSidebar = useMemo(() => {
    // extension..?
    if (!name) {
      return true;
    }
    return name === 'cord-sidebar' || name === 'cord-sidebar-launcher';
  }, [name]);
  return (
    <AnnotationPill2
      className={cx({
        [classes.inactiveAnnotationPill]: !showScreenshot && !isSidebar,
      })}
      icon={'AnnotationPin'}
      text={annotationText ?? t('annotation')}
      tooltipLabel={annotationText}
      deepLinked={showDeepLinkHighlight}
      rightComponent={
        <ButtonGroup2>
          {/* if uploadState === null, then no screenshot was attached to the annotation */}
          {showScreenshot && isDefined(uploadState) && (
            <ScreenshotBox2
              uploadState={uploadState}
              showImageModalOnHover={
                annotationValid &&
                uploadState === 'uploaded' &&
                (!name || name === 'cord-sidebar')
              }
              showImageModal={showMediaModal}
              hideSmallImageModal={hideSmallImageModal}
              hoverOverAnnotationBox={hoverOverAnnotationBox}
            />
          )}
          {showShowOnPageButton && (
            <WithTooltip2 label={t('keep_pin_on_page_action')}>
              <Button2
                icon="EyeSlash"
                buttonType="secondary"
                size="small"
                onClick={onClickShowAnnotationOnPage}
                additionalClassName={classes.showAnnotationButton}
              ></Button2>
            </WithTooltip2>
          )}
        </ButtonGroup2>
      }
      locationMatch={annotationMatchType}
      onMouseOver={handleMouseOver}
      onMouseLeave={handleMouseLeave}
      {...(shouldToggleScreenshotOnHover && {
        // eslint-disable-next-line i18next/no-literal-string
        onMouseOver: () => showMediaModal('small'),
        onMouseLeave: hideSmallImageModal,
      })}
      forwardRef={containerRef}
      onClick={onClickAnnotation}
      backgroundColor={
        editingMessageID === message.id ? 'base-x-strong' : undefined
      }
      marginTop="2xs"
    />
  );
}

function screenshotToShow(
  attachment:
    | {
        screenshot: Screenshot;
        blurredScreenshot: Screenshot;
      }
    | null
    | undefined,
  blurBehavior: BlurDisplayLocation,
  location: ThreadsLocation2,
  viewerIsAuthor: boolean,
): [Screenshot, boolean] {
  if (!attachment) {
    return [null, false];
  }
  const { screenshot, blurredScreenshot } = attachment;
  if (viewerIsAuthor) {
    return [screenshot, false];
  }
  if (blurBehavior === 'everywhere' || location !== 'chat') {
    if (blurredScreenshot) {
      return [blurredScreenshot, true];
    }
  }
  return [screenshot, false];
}
