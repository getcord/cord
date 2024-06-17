import { MessageAttachmentType } from 'common/types/index.ts';
import type { FileAttachmentInput } from 'common/types/index.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import type { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { MessageAttachmentMutator } from 'server/src/entity/message_attachment/MessageAttachmentMutator.ts';
import { getMessageAnnotationAttachmentsFromInput } from 'server/src/schema/common.ts';
import type {
  AnnotationAttachmentInput,
  ScreenshotAttachmentInput,
} from 'server/src/schema/resolverTypes.ts';

export async function addNewMessageAttachments(
  context: RequestContext,
  message: MessageEntity,
  fileAttachments: FileAttachmentInput[],
  annotationAttachments: AnnotationAttachmentInput[],
  screenshotAttachment: ScreenshotAttachmentInput | null | undefined,
) {
  const messageAttachmentMutator = new MessageAttachmentMutator(
    context.session.viewer,
    context.loaders,
  );

  await messageAttachmentMutator.setMessageAttachments(message, [
    ...fileAttachments.map(({ id, fileID }) => ({
      id,
      type: MessageAttachmentType.FILE,
      data: { fileID },
    })),
    ...getMessageAnnotationAttachmentsFromInput(
      context.session.viewer,
      annotationAttachments,
    ),
    ...(screenshotAttachment
      ? [
          {
            id: screenshotAttachment.id,
            type: MessageAttachmentType.SCREENSHOT,
            data: {
              screenshotFileID: screenshotAttachment.screenshotFileID,
              blurredScreenshotFileID:
                screenshotAttachment.blurredScreenshotFileID,
            },
          },
        ]
      : []),
  ]);
}
