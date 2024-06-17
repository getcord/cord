import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

// all its fields are dynamically resolved
export const viewerIdentityQueryResolver: Resolvers['Query']['viewerIdentity'] =
  () => ({});
