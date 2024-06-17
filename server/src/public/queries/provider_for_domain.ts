import { deprecatedFunction } from 'server/src/logging/deprecate.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const providerForDomainQueryResolver: Resolvers['Query']['providerForDomain'] =
  deprecatedFunction(() => {
    return null;
  }, 'graphql: providerForDomain');
