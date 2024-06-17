import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const threadSubscriberUpdatedResolver: Resolvers['ThreadSubscriberUpdated'] =
  {
    subscriber: async (
      { args: { threadID }, payload: { userID } },
      _,
      context,
    ) => {
      const participant =
        await context.loaders.threadParticipantLoader.loadForUserNoOrgCheck({
          threadID,
          userID,
        });

      if (!participant) {
        throw new Error('Unable to find requested thread participant');
      }

      return participant;
    },
  };
