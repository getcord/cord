import { useCallback, useMemo, useState } from 'react';
import { ReactEditor } from 'slate-react';

import { AddAttachment } from 'external/src/context/composer/actions/AddAttachment.ts';
import { ComposerContext } from 'external/src/context/composer/ComposerContext.ts';
import { EmbedContext } from 'external/src/context/embed/EmbedContext.ts';
import { useNudgeState } from 'external/src/effects/useNudgeState.ts';
import { NudgeType } from 'external/src/lib/nudge.ts';
import { useEscapeListener } from 'external/src/effects/useEscapeListener.ts';
import { RemoveAttachmentAction } from 'external/src/context/composer/actions/RemoveAttachment.ts';
import { getSingleComposerAnnotation } from 'external/src/components/chat/composer/annotations/util.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

export function useAnnotationCreator() {
  const {
    dispatch: dispatchComposer,
    editor,
    state: { attachments, editingMessageID },
  } = useContextThrowingIfNoProvider(ComposerContext);

  const { createAnnotation, cancelAnnotation, hideAnnotation, showAnnotation } =
    useContextThrowingIfNoProvider(EmbedContext);

  const existingAnnotation = useMemo(
    () => getSingleComposerAnnotation(attachments),
    [attachments],
  );

  const { dismissNudge } = useNudgeState();

  const [isAnnotating, setIsAnnotating] = useState(false);

  useEscapeListener(() => {
    cancelAnnotation();
  }, !isAnnotating);

  const addAnnotation = useCallback(async () => {
    setIsAnnotating(true);
    try {
      if (existingAnnotation) {
        hideAnnotation(existingAnnotation);
      }
      const result = await createAnnotation();
      setIsAnnotating(false);
      ReactEditor.focus(editor);
      dismissNudge(NudgeType.ANNOTATE);
      if (result === null) {
        if (existingAnnotation) {
          showAnnotation(existingAnnotation);
        }
        return;
      }
      const { annotation, screenshot, blurredScreenshot } = result;
      if (existingAnnotation) {
        // For when users edit a message with single annotation mode
        if (editingMessageID) {
          hideAnnotation(existingAnnotation);
        }
        dispatchComposer(RemoveAttachmentAction(existingAnnotation.id));
      }
      dispatchComposer(
        AddAttachment({
          id: annotation.id,
          type: 'annotation',
          location: annotation.location,
          customLocation: annotation.customLocation,
          customHighlightedTextConfig: annotation.customHighlightedTextConfig,
          customLabel: annotation.customLabel,
          coordsRelativeToTarget: annotation.coordsRelativeToTarget,
          screenshot,
          blurredScreenshot,
          size: screenshot?.size ?? 0,
          message: {
            source: {
              id: annotation.sourceID,
            },
          },
        }),
      );
    } catch {
      setIsAnnotating(false);
      if (existingAnnotation) {
        showAnnotation(existingAnnotation);
      }
    }
  }, [
    createAnnotation,
    dismissNudge,
    dispatchComposer,
    editor,
    existingAnnotation,
    hideAnnotation,
    showAnnotation,
    editingMessageID,
  ]);

  return addAnnotation;
}
