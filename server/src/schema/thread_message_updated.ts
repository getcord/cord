import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const threadMessageUpdatedResolver: Resolvers['ThreadMessageUpdated'] = {
  message: async ({ payload: { messageID } }, _, context) => {
    const message = await context.loaders.messageLoader.loadMessage(messageID);
    if (!message) {
      throw new Error('message does not exist');
    }
    return message;
  },
};
