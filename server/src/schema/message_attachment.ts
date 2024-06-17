import { MessageAttachmentType } from 'common/types/index.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const messageAttachmentTypeResolver: Resolvers['MessageAttachment'] = {
  __resolveType(attachment) {
    if ('type' in attachment) {
      switch (attachment.type) {
        case MessageAttachmentType.FILE:
          return 'MessageFileAttachment';
        case MessageAttachmentType.ANNOTATION:
          return 'MessageAnnotationAttachment';
        case MessageAttachmentType.SCREENSHOT:
          return 'MessageScreenshotAttachment';
      }
    }

    if ('url' in attachment) {
      return 'MessageLinkPreview';
    }

    throw new Error('Unexpected attachment type');
  },
};
