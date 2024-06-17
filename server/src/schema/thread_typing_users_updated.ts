import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const threadTypingUsersUpdatedResolver: Resolvers['ThreadTypingUsersUpdated'] =
  {
    users: async ({ payload: { users }, args }, _, context) => {
      // We check to make sure the user has access to this thread
      const thread = await context.loaders.threadLoader.loadThread(
        args.threadID,
      );

      if (!thread) {
        return [];
      }

      return await context.loaders.userLoader.loadUsersNoOrgCheck(users);
    },
  };
