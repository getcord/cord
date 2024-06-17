import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { assertViewerHasUser } from 'server/src/auth/index.ts';
import { setDeepLinkThreadMessageID } from 'server/src/deep_link_threads/index.ts';

export const setDeepLinkThreadIDMutationResolver: Resolvers['Mutation']['setDeepLinkThreadID'] =
  async (_, args, context) => {
    const { threadID } = args;
    const userID = assertViewerHasUser(context.session.viewer);

    await setDeepLinkThreadMessageID({ userID, threadID });

    return {
      success: true,
      failureDetails: null,
    };
  };
