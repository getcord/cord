import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const pingQueryResolver: Resolvers['Query']['ping'] = () => 'pong';
