import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const threadShareToSlackResolver: Resolvers['ThreadShareToSlack'] = {
  id: ({ args: { threadID } }) => threadID,
  info: ({ payload: { info } }) => info,
};
