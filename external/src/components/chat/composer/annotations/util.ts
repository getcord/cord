import type { MessageAnnotation } from 'common/types/index.ts';
import { secondsToFormattedTimestamp } from 'common/util/secondsToFormattedTimestamp.ts';
import { getTextHighlightDisplayText } from 'external/src/delegate/location/textHighlights.ts';
import {
  attachmentToAnnotation,
  isAnnotationComposerAttachment,
} from 'external/src/lib/util.ts';
import type {
  ComposerAnnotationAttachmentType,
  ComposerAttachment,
} from 'external/src/context/composer/ComposerState.ts';
import type {
  MessageAnnotationAttachmentFragment,
  MessageFileAttachmentFragment,
  MessageLinkPreviewFragment,
  MessageScreenshotAttachmentFragment,
} from 'external/src/graphql/operations.ts';

export const getAnnotationTextToShow = (
  annotation: MessageAnnotation | undefined | null,
) => {
  if (!annotation) {
    return null;
  }

  const { location: annotationLocation, customLabel } = annotation;
  if (customLabel) {
    return customLabel;
  }

  const selectedText = getTextHighlightDisplayText(
    annotationLocation?.highlightedTextConfig,
  );
  if (selectedText) {
    return `"${selectedText}"`;
  }

  const currentTime = annotationLocation?.multimediaConfig?.currentTime ?? -1;
  if (currentTime >= 0) {
    return `Time: ${secondsToFormattedTimestamp(currentTime)}`;
  }

  const monacoEditorLineNumber =
    annotationLocation?.additionalTargetData?.monacoEditor?.lineNumber;
  if (Number.isInteger(monacoEditorLineNumber) && monacoEditorLineNumber! > 0) {
    return `Line ${monacoEditorLineNumber}`;
  }

  return null;
};

export function getSingleComposerAnnotation(
  attachments: ComposerAttachment[],
): MessageAnnotation | null {
  const annotationAttachment = attachments.find(
    (attachment): attachment is ComposerAnnotationAttachmentType =>
      isAnnotationComposerAttachment(attachment),
  );
  if (annotationAttachment) {
    return attachmentToAnnotation(annotationAttachment);
  }
  return null;
}

export function getSingleMessageAnnotation(
  attachments: Array<
    | MessageFileAttachmentFragment
    | MessageAnnotationAttachmentFragment
    | MessageScreenshotAttachmentFragment
    | MessageLinkPreviewFragment
  >,
) {
  const annotationAttachment = attachments.find(
    (attachment): attachment is MessageAnnotationAttachmentFragment =>
      attachment.__typename === 'MessageAnnotationAttachment',
  );
  if (annotationAttachment) {
    return attachmentToAnnotation(annotationAttachment);
  }
  return null;
}
