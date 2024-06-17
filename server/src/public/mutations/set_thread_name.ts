import { ThreadMutator } from 'server/src/entity/thread/ThreadMutator.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const setThreadNameResolver: Resolvers['Mutation']['setThreadName'] =
  async (_, { threadID, name }, context) => {
    try {
      const thread = await context.loaders.threadLoader.loadThread(threadID);

      if (!thread) {
        return { success: false, failureDetails: null };
      }

      if (thread.name === name) {
        return { success: true, failureDetails: null };
      }

      const threadMutator = new ThreadMutator(
        context.session.viewer,
        context.loaders,
      );
      const success = await threadMutator.setThreadName(threadID, name);

      if (success) {
        await publishPubSubEvent('thread-properties-updated', { threadID });
      }

      return { success, failureDetails: null };
    } catch {
      return { success: false, failureDetails: null };
    }
  };
