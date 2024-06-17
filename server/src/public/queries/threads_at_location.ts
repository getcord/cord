import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const threadsAtLocationQueryResolver: Resolvers['Query']['threadsAtLocation'] =
  async (
    _,
    { location, filter, resolved, partialMatch, sort, limit, after },
    context,
  ) =>
    await context.loaders.threadLoader.loadThreadsForPage({
      filter: {
        location: location ?? undefined,
        partialMatch: partialMatch ?? undefined,
        resolved: resolved ?? undefined,
        metadata: filter?.metadata ?? undefined,
        viewer: filter?.viewer ?? undefined,
      },
      sort,
      limit,
      after,
    });
