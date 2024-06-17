import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const orgMemberRemovedResolver: Resolvers['OrgMemberRemoved'] = {
  externalUserID: async ({ payload: { userID } }, _, context) => {
    const user = await context.loaders.userLoader.loadUser(userID);

    if (!user) {
      throw new Error('User not found');
    }

    return user.externalID;
  },
};
