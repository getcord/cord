import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const messageReactionResolver: Resolvers['MessageReaction'] = {
  user: async (messageReaction, _, context) => {
    const user = await context.loaders.userLoader.loadUser(
      messageReaction.userID,
    );
    if (!user) {
      throw new Error(
        `Failed to load userID: ${messageReaction.userID} for messageID: ${messageReaction.messageID}`,
      );
    }

    return user;
  },
  unicodeReaction: (messageReaction, _, _context) =>
    messageReaction.unicodeReaction,
};
