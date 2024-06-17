import { v4 as uuid } from 'uuid';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { assertViewerHasPlatformUser } from 'server/src/auth/index.ts';
import { createThreadMessage } from 'server/src/public/routes/platform/messages/CreateThreadMessageHandler.ts';
import { sendErrors } from 'server/src/public/mutations/util/sendErrors.ts';
import { ApiCallerError } from 'server/src/public/routes/platform/util.ts';
import { deprecated } from 'server/src/logging/deprecate.ts';

export const createMessageByExternalIDResolver: Resolvers['Mutation']['createMessageByExternalID'] =
  sendErrors(async (_, args, context) => {
    const { platformApplicationID, externalUserID } =
      assertViewerHasPlatformUser(context.session.viewer);

    const { externalOrgID: viewerExternalOrgID } = context.session.viewer;

    const thread =
      await context.loaders.threadLoader.loadByExternalIDStrictOrgCheck(
        args.input.externalThreadID,
      );
    let threadOrg;
    if (thread) {
      threadOrg = await context.loaders.orgLoader.loadOrg(thread?.orgID);
    }

    const externalOrgID = threadOrg?.externalID ?? viewerExternalOrgID;

    if (!externalOrgID) {
      throw new ApiCallerError('group_not_found', {
        message: 'Must specify a groupID if creating a new thread',
      });
    }

    if (args.input.type !== undefined) {
      deprecated(
        'graphql: createMessageByExternalID type',
        platformApplicationID,
      );
      if (args.input.type && args.input.type !== 'user_message') {
        throw new ApiCallerError('invalid_field', {
          message: 'Only user_messages can be sent with the JS API',
        });
      }
    }

    if (!args.input.messageID) {
      deprecated(
        'graphql: createMessageByExternalID missing messageID',
        platformApplicationID,
      );
    }

    await createThreadMessage({
      platformApplicationID,
      threadID: args.input.externalThreadID,
      id: args.input.externalMessageID ?? undefined,
      internalMessageID: args.input.messageID ?? uuid(),
      authorID: externalUserID,
      content: args.input.content,
      url: args.input.url ?? undefined,
      addReactions: args.input.addReactions?.map((reaction) => ({
        reaction,
        timestamp: new Date(),
        userID: externalUserID,
      })),
      addAttachments: args.input.addFileAttachments?.map((fileID) => ({
        type: 'file',
        id: fileID,
      })),
      iconURL: args.input.iconURL ?? undefined,
      translationKey: args.input.translationKey ?? undefined,
      extraClassnames: args.input.extraClassnames ?? '',
      createThread: args.input.createThread
        ? {
            organizationID: externalOrgID,
            groupID: externalOrgID,
            location: args.input.createThread.location,
            url: args.input.createThread.url,
            name: args.input.createThread.name,
            metadata: args.input.createThread.metadata ?? undefined,
            extraClassnames:
              args.input.createThread.extraClassnames ?? undefined,
            addSubscribers: args.input.createThread.addSubscribers ?? undefined,
          }
        : undefined,
      metadata: args.input.metadata ?? undefined,
      subscribeToThread: args.input.subscribeToThread ?? undefined,
      screenshotAttachment: args.input.screenshotAttachment,
    });

    return { success: true, failureDetails: null };
  });
