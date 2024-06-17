import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const pageThreadAddedResolver: Resolvers['PageThreadAdded'] = {
  thread: async ({ payload: { threadID } }, _, context) => {
    const thread = await context.loaders.threadLoader.loadThread(threadID);

    if (!thread) {
      throw new Error('Thread does not exist.');
    }

    return thread;
  },
};
