import { assertViewerHasUser } from 'server/src/auth/index.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const orgMemberAddedResolver: Resolvers['OrgMemberAdded'] = {
  user: async ({ payload: { userID } }, _, context) => {
    assertViewerHasUser(context.session.viewer);

    const user = await context.loaders.userLoader.loadUser(userID);

    if (!user) {
      throw new Error(`User ${userID} not found`);
    }

    return user;
  },
};
