import type { Resolvers } from 'server/src/admin/resolverTypes.ts';

export const providersQueryResolver: Resolvers['Query']['providers'] = (
  _,
  _args,
  context,
) => context.loaders.providerLoader.loadAll();
