import { assertViewerHasOrg } from 'server/src/auth/index.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const customerIssueChangeResolver: Resolvers['CustomerIssueChange'] = {
  user: async (change, _args, context) => {
    const orgID = assertViewerHasOrg(context.session.viewer);
    const user = await context.loaders.userLoader.loadUserInOrg(
      change.userID,
      orgID,
    );
    if (!user) {
      throw new Error('Change log associated with nonexistent user?');
    }
    return user;
  },
  created: (change) => {
    return Boolean(change.changeDetail.created);
  },
  updated: (change) => change.changeDetail.updated ?? [],
};
