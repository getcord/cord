import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const organizationQueryResolver: Resolvers['Query']['organization'] =
  async (_, args, context) => {
    if (!(await context.loaders.orgMembersLoader.viewerCanAccessOrg(args.id))) {
      throw new Error(`Viewer cannot access org ${args.id}`);
    }
    return await context.loaders.orgLoader.loadOrg(args.id);
  };
