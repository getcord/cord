import { assertViewerHasPlatformApplicationID } from 'server/src/auth/index.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const messageByExternalIDQueryResolver: Resolvers['Query']['messageByExternalID'] =
  async (_, args, context) => {
    const platformApplicationID = assertViewerHasPlatformApplicationID(
      context.session.viewer,
    );
    const { id } = args;

    const message = await context.loaders.messageLoader.loadMessageByExternalID(
      id,
      platformApplicationID,
    );

    if (message) {
      await context.loaders.threadLoader.assertViewerHasThread(
        message.threadID,
      );
    }

    return message;
  };
