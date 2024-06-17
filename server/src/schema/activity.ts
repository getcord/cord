import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const activityResolver: Resolvers['Activity'] = {
  threadSummary: (root, _args, context) =>
    context.loaders.threadLoader.loadThreadActivitySummary(root),
};
