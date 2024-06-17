import type { RequestContext } from 'server/src/RequestContext.ts';
import { getLinksForMessage } from 'server/src/asyncTier/jobs/generateLinkPreviews.ts';
import submitAsync from 'server/src/asyncTier/submitAsync.ts';
import type { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { MessageLinkPreviewEntity } from 'server/src/entity/message_link_preview/MessageLinkPreviewEntity.ts';
import {
  FeatureFlags,
  flagsUserFromContext,
  getTypedFeatureFlagValue,
} from 'server/src/featureflags/index.ts';

export async function scheduleGenerateLinkPreviews(
  context: RequestContext,
  message: MessageEntity,
) {
  if (message.skipLinkPreviews) {
    return;
  }

  const flagUser = flagsUserFromContext(context);
  const linkPreviewsEnabled = await getTypedFeatureFlagValue(
    FeatureFlags.SHOW_LINK_PREVIEWS,
    flagUser,
  );
  if (!linkPreviewsEnabled) {
    return;
  }

  const existingPreviewCount = await MessageLinkPreviewEntity.count({
    where: { messageID: message.id },
  });

  const links = getLinksForMessage(message.content);
  if (existingPreviewCount === 0 && links.size === 0) {
    // If there are no existing previews and no links, it's safe to just do
    // nothing
    return;
  }

  void submitAsync(
    'generateLinkPreviews',
    {
      messageID: message.id,
    },
    { singletonKey: message.id },
  );
}

export async function scheduleUpdateLinkPreviews(
  context: RequestContext,
  message: MessageEntity,
) {
  if (message.skipLinkPreviews) {
    await MessageLinkPreviewEntity.destroy({
      where: { messageID: message.id },
    });
  } else {
    const flagUser = flagsUserFromContext(context);
    const linkPreviewsEnabled = await getTypedFeatureFlagValue(
      FeatureFlags.SHOW_LINK_PREVIEWS,
      flagUser,
    );
    if (!linkPreviewsEnabled) {
      return;
    }

    void submitAsync(
      'generateLinkPreviews',
      {
        messageID: message.id,
      },
      { singletonKey: message.id },
    );
  }
}
