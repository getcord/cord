import { MessageLinkPreviewMutator } from 'server/src/entity/message_link_preview/MessageLinkPreviewMutator.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const hideLinkPreviewResolver: Resolvers['Mutation']['hideLinkPreview'] =
  async (_, args, context) => {
    const { linkPreviewID } = args;

    const messageLinkPreviewMutator = new MessageLinkPreviewMutator(
      context.session.viewer,
      context.loaders,
    );
    const result = await messageLinkPreviewMutator.hide(linkPreviewID);

    return {
      success: result,
      failureDetails: null,
    };
  };
