import type {
  Resolvers,
  UpdateMessageByExternalIDInput,
} from 'server/src/schema/resolverTypes.ts';
import { assertViewerHasPlatformUser } from 'server/src/auth/index.ts';
import { updateThreadMessage } from 'server/src/public/routes/platform/messages/UpdateThreadMessageHandler.ts';
import { sendErrors } from 'server/src/public/mutations/util/sendErrors.ts';
import { ApiCallerError } from 'server/src/public/routes/platform/util.ts';
import type { RemoveAttachment } from '@cord-sdk/types';
import { deprecated } from 'server/src/logging/deprecate.ts';

export const updateMessageByExternalIDResolver: Resolvers['Mutation']['updateMessageByExternalID'] =
  sendErrors(async (_, args, context) => {
    const { platformApplicationID, userID, externalUserID } =
      assertViewerHasPlatformUser(context.session.viewer);

    const message = await context.loaders.messageLoader.loadMessageByExternalID(
      args.input.externalMessageID,
      platformApplicationID,
    );

    if (!message) {
      throw new ApiCallerError('message_not_found');
    }

    const thread = args.input.externalThreadID
      ? await context.loaders.threadLoader.loadByExternalIDStrictOrgCheck(
          args.input.externalThreadID,
        )
      : await context.loaders.threadLoader.loadThread(message.threadID);

    if (!thread) {
      throw new ApiCallerError('thread_not_found');
    }

    if (thread.id !== message.threadID) {
      throw new ApiCallerError('message_not_found');
    }

    // Only the author of a message should be able to update their message from the
    // client side - UNLESS the update is only to add/remove reactions
    if (!isReactionsOnlyUpdate(args.input) && message.sourceID !== userID) {
      throw new ApiCallerError('message_edit_forbidden');
    }

    if (args.input.type !== undefined) {
      deprecated(
        'graphql: updateMessageByExternalID type',
        platformApplicationID,
      );
      if (args.input.type && args.input.type !== 'user_message') {
        throw new ApiCallerError('invalid_field', {
          message: 'Only user_messages can be sent with the JS API',
        });
      }
    }

    const removeAttachments: RemoveAttachment[] = [
      ...(args.input.removeFileAttachments?.map((fileID) => ({
        type: 'file' as RemoveAttachment['type'],
        id: fileID,
      })) ?? []),
      ...(args.input.removePreviewLinks?.map((previewID) => ({
        type: 'link_preview' as RemoveAttachment['type'],
        id: previewID,
      })) ?? []),
    ];

    await updateThreadMessage({
      context,
      thread,
      message,
      content: args.input.content ?? undefined,
      url: args.input.url ?? undefined,
      iconURL: args.input.iconURL ?? undefined,
      translationKey: args.input.translationKey ?? undefined,
      metadata: args.input.metadata ?? undefined,
      extraClassnames: args.input.extraClassnames ?? undefined,
      deleted: args.input.deleted ?? undefined,
      addReactions: args.input.addReactions?.map((reaction) => ({
        reaction,
        userID: externalUserID,
      })),
      removeReactions: args.input.removeReactions?.map((reaction) => ({
        reaction,
        userID: externalUserID,
      })),
      addAttachments: args.input.addFileAttachments?.map((fileID) => ({
        type: 'file',
        id: fileID,
      })),
      removeAttachments,
      skipLinkPreviews: args.input.skipLinkPreviews ?? undefined,
    });

    return { success: true, failureDetails: null };
  });

function isReactionsOnlyUpdate(input: UpdateMessageByExternalIDInput) {
  // Normally, users can only edit their own messages from the client APIs.  One
  // exception is if a user is adding/removing reactions.  In that case, they should
  // only be allowed to make these changes, and not let any other updates slip
  // through at the same time.
  const allowedFields = [
    'externalMessageID',
    'externalThreadID',
    'addReactions',
    'removeReactions',
  ];

  for (const key in input) {
    if (!allowedFields.includes(key)) {
      return false;
    }
  }
  return true;
}
