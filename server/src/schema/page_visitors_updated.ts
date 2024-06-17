import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const pageVisitorUpdatedResolver: Resolvers['PageVisitorsUpdated'] = {
  visitors: () => [],
};
