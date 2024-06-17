import { useMemo } from 'react';
import { MessageAnnotationAttachmentTypeName } from 'common/types/index.ts';
import type {
  ComposerAnnotationAttachmentType,
  ComposerAttachment,
} from 'external/src/context/composer/ComposerState.ts';
import { attachmentToAnnotation } from 'external/src/lib/util.ts';
import type {
  MessageAnnotationAttachmentFragment,
  MessageFragment,
} from 'external/src/graphql/operations.ts';

export function useComposerAnnotationAndAttachment(
  attachments: ComposerAttachment[],
  annotationAttachmentId: string,
) {
  const attachment = useMemo(
    () =>
      attachments.find(
        (att): att is ComposerAnnotationAttachmentType =>
          att.id === annotationAttachmentId && att.type === 'annotation',
      ),
    [annotationAttachmentId, attachments],
  );

  return useAttachmentToAnnotation(attachment);
}

export function useMessageAnnotationAndAttachment(
  attachments: MessageFragment['attachments'],
  annotationAttachmentId: string,
) {
  const attachment = useMemo(
    () =>
      attachments.find(
        (att): att is MessageAnnotationAttachmentFragment =>
          att.id === annotationAttachmentId &&
          att.__typename === MessageAnnotationAttachmentTypeName,
      ),
    [annotationAttachmentId, attachments],
  );

  return useAttachmentToAnnotation(attachment);
}

function useAttachmentToAnnotation(
  attachment:
    | ComposerAnnotationAttachmentType
    | MessageAnnotationAttachmentFragment
    | undefined,
) {
  const annotation = useMemo(
    () => (attachment ? attachmentToAnnotation(attachment) : undefined),
    [attachment],
  );

  return useMemo(() => ({ attachment, annotation }), [annotation, attachment]);
}
