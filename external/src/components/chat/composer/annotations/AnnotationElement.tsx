import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocused, useSelected } from 'slate-react';
import { useCordTranslation } from '@cord-sdk/react';
import type { UUID } from 'common/types/index.ts';
import { LocationMatch } from 'common/types/index.ts';
import { EmbedContext } from 'external/src/context/embed/EmbedContext.ts';
import { RemoveAttachmentAction } from 'external/src/context/composer/actions/RemoveAttachment.ts';
import { ComposerContext } from 'external/src/context/composer/ComposerContext.ts';
import { getAnnotationArrowStartPosition } from 'external/src/components/chat/composer/util.ts';
import { useAnnotationArrow } from 'external/src/components/chat/composer/annotations/useAnnotationArrow.ts';
import { useComposerAnnotationAndAttachment } from 'external/src/components/chat/annotations/useAnnotationAndAttachment.ts';
import { useScrollToAndShowAnnotation } from 'external/src/effects/useScrollToAndShowAnnotation.ts';
import { useMediaModal } from 'external/src/effects/useImageModal.tsx';
import {
  ANNOTATION_ARROW_ON_ADD_MS,
  FAST_ANNOTATION_LOCATION_MATCH_INTERVAL_MS,
} from 'common/const/Timing.ts';
import { useUpdatingRef } from 'external/src/effects/useUpdatingRef.ts';
import { AnnotationsOnPageContext } from 'external/src/context/annotationsOnPage/AnnotationsOnPageContext.ts';
import { AnnotationPill2 } from 'external/src/components/ui2/AnnotationPill2.tsx';
import { getAnnotationTextToShow } from 'external/src/components/chat/composer/annotations/util.ts';
import { WithTooltip2 } from 'external/src/components/ui2/WithTooltip2.tsx';
import { Button2 } from 'external/src/components/ui2/Button2.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { MediaModalContext } from 'external/src/context/mediaModal/MediaModalContext.tsx';

type Props = {
  annotationAttachmentID: UUID;
  keepAnnotationInState?: boolean;
  attributes?: any;
};

export function AnnotationElement({
  annotationAttachmentID,
  keepAnnotationInState = false,
  attributes,
  children,
}: React.PropsWithChildren<Props>) {
  const { t } = useCordTranslation('composer');
  const selected = useSelected();
  const focused = useFocused();
  const highlighted = selected && focused;

  const { showAnnotation, hideAnnotation, getAnnotationMatchType } =
    useContextThrowingIfNoProvider(EmbedContext);

  const { hideSmallMediaModal: hideSmallImageModal } =
    useContextThrowingIfNoProvider(MediaModalContext);

  const {
    dispatch: dispatchComposer,
    state: { attachments, editingMessageID },
  } = useContextThrowingIfNoProvider(ComposerContext);

  const { attachment, annotation } = useComposerAnnotationAndAttachment(
    attachments,
    annotationAttachmentID,
  );
  const removeAnnotationFromPage = useContextThrowingIfNoProvider(
    AnnotationsOnPageContext,
  )?.removeAnnotationFromPage;

  const getStartPosition = useCallback(
    () => getAnnotationArrowStartPosition(containerRef.current!),
    [],
  );

  // Show arrow for 2 seconds when added, and on hover
  const { showArrow, hideArrow } = useAnnotationArrow({
    editorFocused: focused,
    annotation,
    getStartPosition,
  });

  useEffect(() => {
    if (
      !annotation?.location?.highlightedTextConfig &&
      !annotation?.customHighlightedTextConfig
    ) {
      return;
    }
    // Remove text highlight at same time as initial arrow
    setTimeout(() => {
      hideAnnotation(annotation);
    }, ANNOTATION_ARROW_ON_ADD_MS);
  }, [annotation, hideAnnotation]);

  useEffect(() => {
    if (editingMessageID && annotation) {
      showAnnotation(annotation);
    }
  }, [annotation, editingMessageID, showAnnotation]);

  const removeElement = useCallback(() => {
    dispatchComposer(RemoveAttachmentAction(annotationAttachmentID));
  }, [dispatchComposer, annotationAttachmentID]);

  const showMediaModal = useMediaModal(
    attachment?.screenshot ? [attachment.screenshot] : [],
  );

  // Cleanup on unmount
  const cleanup = useUpdatingRef(() => {
    if (annotation) {
      hideAnnotation(annotation);
    }
    hideSmallImageModal();
    if (!keepAnnotationInState) {
      dispatchComposer(RemoveAttachmentAction(annotationAttachmentID));
    }
  });
  useEffect(() => {
    return cleanup.current;
  }, [cleanup]);

  const containerRef = useRef<HTMLDivElement>(null);

  const [annotationMatchType, setAnnotationMatchType] = useState(
    LocationMatch.EXACT,
  );
  useEffect(() => {
    if (!annotation) {
      setAnnotationMatchType(LocationMatch.NONE);
      return undefined;
    }
    const updateAnnotationMatchType = async () => {
      const matchType = await getAnnotationMatchType(annotation);
      setAnnotationMatchType(matchType);
    };
    const interval = setInterval(
      // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      updateAnnotationMatchType,
      FAST_ANNOTATION_LOCATION_MATCH_INTERVAL_MS,
    );
    void updateAnnotationMatchType();
    return () => {
      clearInterval(interval);
    };
  }, [annotation, getAnnotationMatchType]);

  const hoverRef = useRef(false);

  const scrollToAndShowAnnotation = useScrollToAndShowAnnotation(
    annotation,
    getStartPosition,
    hoverRef,
  );

  const handleDeleteAnnotation = useCallback(
    (event: React.MouseEvent) => {
      removeElement();
      // Slate throws a selection error without us stopping propagation
      // This is because the click tries to select the element just removed
      event.stopPropagation();
      removeAnnotationFromPage?.(annotationAttachmentID);
    },
    [annotationAttachmentID, removeAnnotationFromPage, removeElement],
  );

  const onLeaveAnnotation = useCallback(() => {
    if (attachment?.location === null && attachment?.customLocation === null) {
      hideSmallImageModal();
    } else {
      if (
        annotation?.location?.highlightedTextConfig ||
        annotation?.customHighlightedTextConfig
      ) {
        hideAnnotation(annotation);
      }
      hideArrow();
    }
    hoverRef.current = false;
  }, [
    annotation,
    attachment?.location,
    hideAnnotation,
    hideSmallImageModal,
    hideArrow,
    attachment?.customLocation,
  ]);

  const onEnterAnnotation = useCallback(() => {
    if (
      attachment?.location === null &&
      attachment?.customLocation === null &&
      attachment.screenshot
    ) {
      showMediaModal({
        mediaIndex: 0,
        small: true,
      });
    } else if (annotation) {
      showAnnotation(annotation);
      showArrow();
    }
    hoverRef.current = true;
  }, [
    attachment?.location,
    showMediaModal,
    showAnnotation,
    showArrow,
    annotation,
    attachment?.screenshot,
    attachment?.customLocation,
  ]);

  const annotationText = getAnnotationTextToShow(annotation);

  return (
    <div {...attributes}>
      <AnnotationPill2
        marginLeft={'2xs'}
        marginRight={'2xs'}
        icon={'AnnotationPin'}
        text={annotationText ?? t('annotation')}
        tooltipLabel={annotationText}
        locationMatch={annotationMatchType}
        onMouseLeave={onLeaveAnnotation}
        onMouseOver={onEnterAnnotation}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
        onClick={scrollToAndShowAnnotation}
        forwardRef={containerRef}
        showActiveState={hoverRef.current || highlighted}
        rightComponent={
          <WithTooltip2 label={t('remove_annotation_action')}>
            <Button2
              icon="X"
              size="small"
              buttonType="secondary"
              onClick={handleDeleteAnnotation}
            />
          </WithTooltip2>
        }
      />

      {children}
    </div>
  );
}
