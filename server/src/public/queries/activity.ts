import { toPageContext } from 'common/types/index.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const activityQueryResolver: Resolvers['Query']['activity'] = async (
  _,
  args,
  _context,
) => {
  const pageContext = toPageContext(args.pageContext);

  return {
    location: pageContext?.data,
    partialMatch: !!args.partialMatch,
    metadata: args.metadata ?? undefined,
    viewer: args.viewer ?? undefined,
    resolved: args.resolved ?? undefined,
  };
};
