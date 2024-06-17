import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const threadMessageRemovedResolver: Resolvers['ThreadMessageRemoved'] = {
  id: ({ payload: { messageID } }) => messageID,
};
