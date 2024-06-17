import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const pageThreadDeletedResolver: Resolvers['PageThreadDeleted'] = {
  id: ({ payload: { threadID } }) => threadID,
};
