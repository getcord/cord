import { MessageMutator } from 'server/src/entity/message/MessageMutator.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { getRelevantContext } from 'server/src/RequestContext.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { ApiCallerError } from 'server/src/public/routes/platform/util.ts';
import { executeUpdateMessageTasks } from 'server/src/message/executeMessageTasks.ts';

export const updateMessageResolver: Resolvers['Mutation']['updateMessage'] =
  async (_, args, originalContext) => {
    const {
      id,
      content,
      fileAttachments,
      annotationAttachments,
      deleted,
      task,
    } = args;

    // NB loadMessage only allows a user to load messages from an org they are a
    // member of, or from an org their current viewer org is Slack-linked to, so
    // no need to assertViewerHasThread here
    const message = await originalContext.loaders.messageLoader.loadMessage(id);
    if (message === null) {
      return {
        success: false,
        failureDetails: null,
      };
    }

    // Make sure that if a message is not a user message, it cannot be updated
    if (message.type !== 'user_message') {
      originalContext.logger.warn('Message cannot be updated', {
        messageID: message.id,
        messageType: message.type,
      });
      return {
        success: false,
        failureDetails: null,
      };
    }

    // Now that we've loaded the message, create a context that is suitable for
    // editing it, which may be for a different org if we're editing this from
    // the unified inbox
    const context = await getRelevantContext(originalContext, message.orgID);
    const viewer = context.session.viewer;

    const thread = await ThreadEntity.findOne({
      where: {
        id: message.threadID,
        platformApplicationID: viewer.platformApplicationID,
      },
    });

    if (!thread) {
      throw new ApiCallerError('thread_not_found', {
        message: `Could not find thread for message ${id}`,
      });
    }

    const originalSubscribers = new Set(
      await context.loaders.threadParticipantLoader.loadSubscriberIDsForThreadNoOrgCheck(
        thread.id,
      ),
    );

    const messageMutator = new MessageMutator(viewer, context.loaders);
    const wasDeletedOrUndeleted = deleted !== undefined && deleted !== null;

    if (wasDeletedOrUndeleted) {
      await messageMutator.setDeleted(message, deleted);
    } else if (content !== undefined && content !== null) {
      await messageMutator.updateContent(context.logger, message, content);
    }

    // need to make sure we pass the updated content
    let newContentMessage = message;
    if (content !== undefined && content !== null) {
      const updatedMessage =
        await context.loaders.messageLoader.loadMessage(id);
      if (updatedMessage === null) {
        // this should never happen
        context.logger.error(
          'Failed to re-load message after updating content',
          {
            messageID: id,
            userID: viewer.userID,
            orgID: viewer.orgID,
          },
        );
        return {
          success: false,
          failureDetails: null,
        };
      }

      newContentMessage = updatedMessage;
    }

    await executeUpdateMessageTasks({
      context,
      message: newContentMessage,
      thread,
      task,
      fileAttachments,
      annotationAttachments,
      wasDeletedOrUndeleted,
      content,
      originalSubscribers,
    });

    return {
      success: true,
      failureDetails: null,
    };
  };
