import type { MessageAnnotationAttachmentData } from 'server/src/entity/message_attachment/MessageAttachmentEntity.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const messageAnnotationAttachmentResolver: Resolvers['MessageAnnotationAttachment'] =
  {
    screenshot: async (messageAttachment, _, context) => {
      const { screenshotFileID } =
        messageAttachment.data as MessageAnnotationAttachmentData;

      if (!screenshotFileID) {
        return null;
      }

      try {
        return await context.loaders.fileLoader.loadFile(screenshotFileID);
      } catch (e) {
        return null;
      }
    },
    blurredScreenshot: async (messageAttachment, _, context) => {
      const { blurredScreenshotFileID: screenshotFileID } =
        messageAttachment.data as MessageAnnotationAttachmentData;

      if (!screenshotFileID) {
        return null;
      }

      try {
        return await context.loaders.fileLoader.loadFile(screenshotFileID);
      } catch (e) {
        return null;
      }
    },
    location: (messageAttachment) => {
      if (
        'location' in messageAttachment.data &&
        messageAttachment.data.location
      ) {
        return {
          ...messageAttachment.data.location,
          iframeSelectors:
            messageAttachment.data.location.iframeSelectors ?? [],
        };
      }
      return undefined;
    },
    customLocation: (messageAttachment) => {
      if ('customLocation' in messageAttachment.data) {
        return messageAttachment.data.customLocation;
      }
      return undefined;
    },
    customHighlightedTextConfig: (messageAttachment) => {
      if ('customHighlightedTextConfig' in messageAttachment.data) {
        return messageAttachment.data.customHighlightedTextConfig;
      }
      return undefined;
    },
    customLabel: (messageAttachment) => {
      if ('customLabel' in messageAttachment.data) {
        return messageAttachment.data.customLabel;
      }
      return undefined;
    },
    coordsRelativeToTarget: (messageAttachment) => {
      if ('coordsRelativeToTarget' in messageAttachment.data) {
        return messageAttachment.data.coordsRelativeToTarget;
      }
      return undefined;
    },
    message: async (messageAttachment, _, context) => {
      const message = await context.loaders.messageLoader.loadMessage(
        messageAttachment.messageID,
      );
      if (!message) {
        throw new Error('Attachment refers to non-existent message');
      }
      return message;
    },
  };
