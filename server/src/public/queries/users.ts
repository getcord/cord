import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const usersQueryResolver: Resolvers['Query']['users'] = async (
  _,
  args,
  context,
) => {
  return await context.loaders.userLoader.loadUsersInViewerOrgs(args.ids);
};
