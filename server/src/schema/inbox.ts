import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const inboxResolver: Resolvers['Inbox'] = {
  count: async (_, _args, context) =>
    await context.loaders.threadParticipantLoader.loadInboxCount(),
  threads: async (_, _args, context) => {
    const threadIDs =
      await context.loaders.threadParticipantLoader.loadNewlyActiveThreads();

    return await context.loaders.threadLoader.loadThreads(threadIDs);
  },
  threadsArchive: async (_, _args, context) => {
    const threadIDs =
      await context.loaders.threadParticipantLoader.loadThreadsInArchive();
    return await context.loaders.threadLoader.loadThreads(threadIDs);
  },
};
