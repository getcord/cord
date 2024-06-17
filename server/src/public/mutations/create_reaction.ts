import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { getRelevantContext } from 'server/src/RequestContext.ts';
import { updateThreadMessage } from 'server/src/public/routes/platform/messages/UpdateThreadMessageHandler.ts';
import { assertViewerHasPlatformUser } from 'server/src/auth/index.ts';
import { sendErrors } from 'server/src/public/mutations/util/sendErrors.ts';

export const createMessageReactionResolver: Resolvers['Mutation']['createMessageReaction'] =
  sendErrors(async (_, args, context) => {
    const { messageID, unicodeReaction } = args;

    const message = await context.loaders.messageLoader.loadMessage(messageID);
    if (!message) {
      return {
        success: false,
        failureDetails: null,
      };
    }

    const thread = await context.loaders.threadLoader.loadThread(
      message.threadID,
    );

    if (!thread) {
      return {
        success: false,
        failureDetails: null,
      };
    }

    const { externalUserID } = assertViewerHasPlatformUser(
      context.session.viewer,
    );

    const relevantContext = await getRelevantContext(context, message.orgID);
    await updateThreadMessage({
      context: relevantContext,
      thread,
      message,
      addReactions: [
        {
          reaction: unicodeReaction,
          userID: externalUserID,
        },
      ],
    });

    return {
      success: true,
      failureDetails: null,
    };
  });
