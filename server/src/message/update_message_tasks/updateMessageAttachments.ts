import type { RequestContext } from 'server/src/RequestContext.ts';
import { MessageAttachmentType } from 'common/types/index.ts';
import type { FileAttachmentInput } from 'common/types/index.ts';
import type { AnnotationAttachmentInput } from 'server/src/admin/resolverTypes.ts';
import { MessageAttachmentMutator } from 'server/src/entity/message_attachment/MessageAttachmentMutator.ts';
import { getMessageAnnotationAttachmentsFromInput } from 'server/src/schema/common.ts';
import type { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';

export async function updateMessageAttachments(
  context: RequestContext,
  message: MessageEntity,
  fileAttachments: FileAttachmentInput[],
  annotationAttachments: AnnotationAttachmentInput[],
) {
  const viewer = context.session.viewer;
  const messageAttachmentMutator = new MessageAttachmentMutator(
    viewer,
    context.loaders,
  );

  const [deletedCount, created] =
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
    ]);

  return deletedCount || created.length;
}
