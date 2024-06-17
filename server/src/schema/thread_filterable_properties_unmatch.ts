import { deprecatedFunction } from 'server/src/logging/deprecate.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const threadFilterablePropertiesUnmatchResolver: Resolvers['ThreadFilterablePropertiesUnmatch'] =
  {
    id: ({ payload: { threadID } }) => threadID,
    thread: deprecatedFunction(
      async ({ payload: { threadID } }, _, context) => {
        const thread = await context.loaders.threadLoader.loadThread(threadID);

        if (thread === null) {
          throw new Error(`Failed to load thread ID: ${threadID}`);
        }

        return thread;
      },
      'graphql: ThreadFilterablePropertiesUnmatch.thread',
    ),
  };
