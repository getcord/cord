import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const threadQueryResolver: Resolvers['Query']['thread'] = async (
  _,
  args,
  context,
) => {
  const { threadID } = args;

  const thread = await context.loaders.threadLoader.loadThread(threadID);
  if (!thread) {
    throw new Error('threadID does not exist');
  }

  return thread;
};
