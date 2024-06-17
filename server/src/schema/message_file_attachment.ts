import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const messageFileAttachmentResolver: Resolvers['MessageFileAttachment'] =
  {
    file: async (messageAttachment, _, context) => {
      if (!('fileID' in messageAttachment.data)) {
        return null;
      }
      const { fileID } = messageAttachment.data;
      try {
        return await context.loaders.fileLoader.loadFile(fileID);
      } catch (e) {
        return null;
      }
    },
  };
