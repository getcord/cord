import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { ThreadParticipantMutator } from 'server/src/entity/thread_participant/ThreadParticipantMutator.ts';
import { getRelevantContext } from 'server/src/RequestContext.ts';
import { assertViewerHasPlatformIdentity } from 'server/src/auth/index.ts';

export const markThreadUnseenFromExternalMessageIDResolver: Resolvers['Mutation']['markThreadUnseenFromExternalMessageID'] =
  async (_, args, originalContext) => {
    // Mark as unseen from AND INCLUDING the specified message ID
    // or mark the whole thread as seen if externalMessageID is undefined
    const { externalThreadID, externalMessageID } = args;

    const thread =
      await originalContext.loaders.threadLoader.loadByExternalIDStrictOrgCheck(
        externalThreadID,
      );

    if (!thread) {
      return {
        success: false,
        failureDetails: { code: '404', message: 'Thread not found' },
      };
    }

    const context = await getRelevantContext(originalContext, thread.orgID);
    const { platformApplicationID } = assertViewerHasPlatformIdentity(
      context.session.viewer,
    );

    const threadParticipantMutator = new ThreadParticipantMutator(
      context.session.viewer,
      context.loaders,
    );

    if (!externalMessageID) {
      // Mark the whole thread as seen
      await threadParticipantMutator.markThreadSeen({
        threadID: thread.id,
      });
    } else {
      // Mark as unseen from the specified message onwards
      const message =
        await context.loaders.messageLoader.loadMessageByExternalID(
          externalMessageID,
          platformApplicationID,
        );

      if (!message) {
        return {
          success: false,
          failureDetails: { code: '400', message: 'Message not found' },
        };
      }

      await threadParticipantMutator.markThreadUnseenFromMessage({
        threadID: thread.id,
        messageID: message.id,
      });
    }

    return {
      success: true,
      failureDetails: null,
    };
  };
