import { FileMutator } from 'server/src/entity/file/FileMutator.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';
import { getRelevantContext } from 'server/src/RequestContext.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';
export const setFileUploadStatusMutationResolver: Resolvers['Mutation']['setFileUploadStatus'] =
  async (_, args, originalContext) => {
    const { id, status, threadOrgID } = args;

    const context = await getRelevantContext(originalContext, threadOrgID);

    const { viewer } = context.session;

    const fileMutator = new FileMutator(viewer, context.loaders);

    const file = await fileMutator.setFileUploadStatus(id, status);
    if (!file) {
      return { success: false, failureDetails: null };
    }

    const attachmentLoader = context.loaders.messageAttachmentLoader;
    const attachment = await attachmentLoader.getAttachmentFromFileID(id);

    if (attachment) {
      const messageLoader = context.loaders.messageLoader;
      const message = await messageLoader.loadMessage(attachment.messageID);
      if (message) {
        backgroundPromise(
          publishPubSubEvent(
            'thread-message-updated',
            { threadID: message.threadID },
            { messageID: message.id },
          ),
          context.logger,
        );
      }
    }

    return {
      success: true,
      failureDetails: null,
    };
  };
