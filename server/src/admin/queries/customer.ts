import type { Resolvers } from 'server/src/admin/resolverTypes.ts';

export const customerQueryResolver: Resolvers['Query']['customer'] = (
  _,
  args,
  context,
) => context.loaders.customerLoader.load(args.id);
