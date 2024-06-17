import type { Resolvers } from 'server/src/admin/resolverTypes.ts';

export const heimdallSwitchesQueryResolver: Resolvers['Query']['heimdallSwitches'] =
  (_, _args, context) => context.loaders.heimdallLoader.loadAll();
