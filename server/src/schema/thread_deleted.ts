import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const threadDeletedResolver: Resolvers['ThreadDeleted'] = {
  id: ({ args: { threadID } }) => threadID,
};
