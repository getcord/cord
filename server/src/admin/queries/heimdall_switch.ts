import type { Resolvers } from 'server/src/admin/resolverTypes.ts';

export const heimdallSwitchQueryResolver: Resolvers['Query']['heimdallSwitchAdmin'] =
  async (_, args, context) =>
    await context.loaders.heimdallLoader.load(args.key);
