import { getRelevantContext } from 'server/src/RequestContext.ts';
import { assertViewerHasPlatformUser } from 'server/src/auth/index.ts';
import { sendErrors } from 'server/src/public/mutations/util/sendErrors.ts';
import { updateThreadMessage } from 'server/src/public/routes/platform/messages/UpdateThreadMessageHandler.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const deleteMessageReactionMutationResolver: Resolvers['Mutation']['deleteMessageReaction'] =
  sendErrors(async (_, args, context) => {
    const { messageID, reactionID } = args;
    const [message, reaction] = await Promise.all([
      context.loaders.messageLoader.loadMessage(messageID),
      context.loaders.messageReactionLoader.loadReactionNoOrgCheck(reactionID),
    ]);

    if (!message || !reaction) {
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
      removeReactions: [
        {
          reaction: reaction.unicodeReaction,
          userID: externalUserID,
        },
      ],
    });

    return {
      success: true,
      failureDetails: null,
    };
  });
