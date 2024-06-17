import { setUserTyping } from 'server/src/presence/typing.ts';
import { assertViewerHasUser } from 'server/src/auth/index.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const setTypingMutationResolver: Resolvers['Mutation']['setTyping'] =
  async (_, args, context) => {
    const { viewer } = context.session;
    const userID = assertViewerHasUser(viewer);
    const { typing, threadID } = args;

    const thread = await context.loaders.threadLoader.loadThread(threadID);

    if (!thread) {
      return false;
    }

    await setUserTyping(context.logger, threadID, userID, typing);
    return true;
  };
