import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const pageThreadReplyAddedResolver: Resolvers['PageThreadReplyAdded'] = {
  thread: async ({ payload: { threadID } }, _, context) => {
    const thread = await context.loaders.threadLoader.loadThread(threadID);

    if (!thread) {
      throw new Error('Thread does not exist.');
    }

    return thread;
  },

  message: async ({ payload: { messageID } }, _, context) => {
    const message = await context.loaders.messageLoader.loadMessage(messageID);

    if (!message) {
      throw new Error('Message does not exist.');
    }

    return message;
  },
};
