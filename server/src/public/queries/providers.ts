import { deprecatedFunction } from 'server/src/logging/deprecate.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const providersQueryResolver: Resolvers['Query']['providers'] =
  deprecatedFunction(() => null, 'graphql: providers query');
