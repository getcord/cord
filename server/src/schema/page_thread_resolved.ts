import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const pageThreadResolvedResolver: Resolvers['PageThreadResolved'] = {
  thread: async ({ payload: { threadID } }, _, context) => {
    const thread = await context.loaders.threadLoader.loadThread(threadID);

    if (thread === null) {
      throw new Error(`Failed to load thread ID: ${threadID}`);
    }

    return thread;
  },
};
