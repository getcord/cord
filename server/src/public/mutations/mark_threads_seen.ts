import { ThreadParticipantMutator } from 'server/src/entity/thread_participant/ThreadParticipantMutator.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const markThreadsSeenResolver: Resolvers['Mutation']['markThreadsSeen'] =
  async (_, args, context) => {
    await new ThreadParticipantMutator(
      context.session.viewer,
      context.loaders,
    ).markAllThreadsSeen(args.input);

    return {
      success: true,
      failureDetails: null,
    };
  };
