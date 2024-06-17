import type { Resolvers } from 'server/src/admin/resolverTypes.ts';

export const providerQueryResolver: Resolvers['Query']['provider'] = (
  _,
  args,
  context,
) => context.loaders.providerLoader.load(args.id);
