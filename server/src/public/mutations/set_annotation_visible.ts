import {
  assertViewerHasSingleOrgForWrite,
  assertViewerHasUser,
} from 'server/src/auth/index.ts';
import { UserHiddenAnnotationsEntity } from 'server/src/entity/user_hidden_annotations/UserHiddenAnnotationsEntity.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const setAnnotationVisibleMutationResolver: Resolvers['Mutation']['setAnnotationVisible'] =
  async (_, { annotationID, visible }, context) => {
    const orgID = assertViewerHasSingleOrgForWrite(
      context.session.viewer,
      'Must specify a group ID for threads to be created',
    );
    const userID = assertViewerHasUser(context.session.viewer);

    try {
      const attachment =
        await context.loaders.messageAttachmentLoader.loadAttachment(
          annotationID,
        );
      if (!attachment) {
        throw new Error('Cannot find attachment.');
      }

      const message = await context.loaders.messageLoader.loadMessage(
        attachment.messageID,
      );
      if (!message) {
        throw new Error('Cannot find message.');
      }

      const thread = await context.loaders.threadLoader.loadThread(
        message.threadID,
      );
      if (!thread) {
        throw new Error('Cannot find thread.');
      }

      const page =
        await context.loaders.pageLoader.loadPrimaryPageForThreadNoOrgCheck(
          thread.id,
        );
      if (!page) {
        throw new Error('Cannot find page.');
      }

      const pageContextHash = page.contextHash;

      if (visible) {
        await UserHiddenAnnotationsEntity.destroy({
          where: { annotationID },
        });
      } else {
        await UserHiddenAnnotationsEntity.create({
          userID,
          orgID,
          annotationID,
          pageContextHash,
        });
      }
      return { success: true, failureDetails: null };
    } catch {
      return { success: false, failureDetails: null };
    }
  };
