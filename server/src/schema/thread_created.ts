import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const threadCreatedResolver: Resolvers['ThreadCreated'] = {
  thread: async ({ payload: { threadID } }, _, context) => {
    const thread = await context.loaders.threadLoader.loadThread(threadID);
    if (!thread) {
      throw new Error('Thread does not exist');
    }
    return thread;
  },
};
