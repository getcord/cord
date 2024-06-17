import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const threadPropertiesUpdatedResolver: Resolvers['ThreadPropertiesUpdated'] =
  {
    thread: async ({ args: { threadID } }, _, context) => {
      const thread = await context.loaders.threadLoader.loadThread(threadID);
      if (!thread) {
        throw new Error('Thread does not exist');
      }
      return thread;
    },
  };
