import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const adminChatUserResolver: Resolvers['AdminChatUser'] = {
  user: (user) => user,
};
