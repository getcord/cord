import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const threadParticipantResolver: Resolvers['ThreadParticipant'] = {
  user: (threadParticipant, _, context) =>
    context.loaders.userLoader.loadUser(threadParticipant.userID),
};
