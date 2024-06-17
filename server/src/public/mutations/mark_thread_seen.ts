import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { ThreadParticipantMutator } from 'server/src/entity/thread_participant/ThreadParticipantMutator.ts';

export const markThreadSeenMutation: Resolvers['Mutation']['markThreadSeen'] =
  async (_, args, context) => {
    const { threadID } = args;
    const thread = await context.loaders.threadLoader.loadThread(threadID);

    if (!thread) {
      return {
        success: false,
        failureDetails: null,
      };
    }

    const { viewer } = context.session;

    await new ThreadParticipantMutator(viewer, context.loaders).markThreadSeen({
      threadID,
    });

    return {
      success: true,
      failureDetails: null,
    };
  };
