import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { assertViewerHasUser } from 'server/src/auth/index.ts';
import { clearDeepLinkThreadMessageID } from 'server/src/deep_link_threads/index.ts';

export const clearDeepLinkThreadIDMutationResolver: Resolvers['Mutation']['clearDeepLinkThreadID'] =
  async (_, __, context) => {
    const userID = assertViewerHasUser(context.session.viewer);

    await clearDeepLinkThreadMessageID(userID);

    return {
      success: true,
      failureDetails: null,
    };
  };
