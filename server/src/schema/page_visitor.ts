import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const pageVisitorResolver: Resolvers['PageVisitor'] = {
  user: (pageVisitor, _, context) =>
    context.loaders.userLoader.loadUserInAnyViewerOrg(pageVisitor.userID),
};
