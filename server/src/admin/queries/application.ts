import type { Resolvers } from 'server/src/admin/resolverTypes.ts';

export const applicationQueryResolver: Resolvers['Query']['application'] = (
  _,
  args,
  context,
) => context.loaders.applicationLoader.load(args.id);
