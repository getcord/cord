import type { RequestContext } from 'server/src/RequestContext.ts';
import type { NotificationChannels, UUID } from 'common/types/index.ts';
import { MessageAttachmentType } from 'common/types/index.ts';
import { NOTIFICATION_CHANNELS } from 'common/const/UserPreferenceKeys.ts';
import { getNotificationChannels } from 'common/util/notifications.ts';
import {
  FeatureFlags,
  getTypedFeatureFlagValue,
} from 'server/src/featureflags/index.ts';
import { loadLinkedSlackUserOrgScoped } from 'server/src/entity/user/util.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import type {
  MessageAnnotationAttachmentData,
  MessageFileAttachmentData,
} from 'server/src/entity/message_attachment/MessageAttachmentEntity.ts';
import type { FileEntity } from 'server/src/entity/file/FileEntity.ts';
import { isDefined } from 'common/util/index.ts';
import type { NotificationReplyAction } from '@cord-sdk/types';
import { getFileAttachmentEntities } from 'server/src/entity/message_attachment/MessageAttachmentLoader.ts';
import { findSlackUserEmailMatch } from 'server/src/util/findSlackUserEmailMatch.ts';
import { injectDeeplinkQueryParamsV1 } from 'server/src/deep_link_threads/index.ts';
import type { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';

export function getIcon(actions: NotificationReplyAction[]) {
  if (actions.includes('assign-task') || actions.includes('unassign-task')) {
    // external/src/static/email/task.png
    return 'task';
  } else if (actions.includes('mention') && actions.includes('attach-file')) {
    // external/src/static/email/paperclip.png
    return 'paperclip';
  } else {
    // external/src/static/email/mention.png
    return 'mention';
  }
}

export async function loadPartitionedAttachments(
  context: RequestContext,
  messageID: UUID,
): Promise<[FileEntity[], FileEntity[], string[]]> {
  const attachments =
    await context.loaders.messageAttachmentLoader.loadAttachmentsForMessage(
      messageID,
    );

  const fileIDs: UUID[] = [];
  const annotationIDs: (UUID | null | undefined)[] = [];
  const highlightedText: (string | null | undefined)[] = [];

  getFileAttachmentEntities(attachments).forEach((attachment) => {
    switch (attachment.type) {
      case MessageAttachmentType.FILE: {
        const attachmentData = attachment.data as MessageFileAttachmentData;
        fileIDs.push(attachmentData.fileID);
        break;
      }
      case MessageAttachmentType.ANNOTATION: {
        const attachmentData =
          attachment.data as MessageAnnotationAttachmentData;
        annotationIDs.push(
          attachmentData.blurredScreenshotFileID ??
            attachmentData.screenshotFileID,
        );
        highlightedText.push(
          attachmentData.location?.highlightedTextConfig?.textToDisplay ??
            attachmentData.customHighlightedTextConfig?.textToDisplay,
        );
        break;
      }
    }
  });

  return await Promise.all([
    context.loaders.fileLoader.loadFiles(fileIDs),
    context.loaders.fileLoader.loadFiles(annotationIDs.filter(isDefined)),
    highlightedText.filter(isDefined),
  ]);
}

export async function getNotificationPreference(
  context: RequestContext,
  target: UserEntity,
  orgID: UUID,
  emailMatchedSlackUserID: string | undefined,
) {
  const notificationChannelPreference =
    await context.loaders.userPreferenceLoader.loadPreferenceValueForUser<NotificationChannels>(
      NOTIFICATION_CHANNELS,
      target.id,
    );

  const notificationChannels = getNotificationChannels(
    notificationChannelPreference,
    target.id,
    !!target.email,
    !!(await loadLinkedSlackUserOrgScoped(target, context, orgID)) ||
      !!emailMatchedSlackUserID,
  );

  const emailNotificationsEnabled = await getTypedFeatureFlagValue(
    FeatureFlags.ENABLE_EMAIL_NOTIFICATIONS,
    {
      userID: target.id,
      orgID: orgID,
      platformApplicationID:
        context.session.viewer.platformApplicationID ?? 'extension',
      version: context.clientVersion,
      customerID: context.application?.customerID,
    },
  );

  return {
    isEmailNotification:
      notificationChannels.email &&
      emailNotificationsEnabled &&
      context.application?.enableEmailNotifications,
    isSlackNotification: notificationChannels.slack,
  };
}

export async function getPartnerDetails(
  context: RequestContext,
  sender: UserEntity,
) {
  // Because a platform user can now mention Slack users if they link their org
  // to Slack, we need to look at whether the notification sender is a platform
  // user (as opposed to checking whether the target user is a platform
  // user)
  if (sender.platformApplicationID) {
    const application = await context.loaders.applicationLoader.load(
      sender.platformApplicationID,
    );

    return application?.customEmailTemplate ?? undefined;
  } else {
    return undefined;
  }
}

// Creates common variables used between all outbound notifications types
export async function generateOutboundNotificationData({
  context,
  targetUserID,
  message,
  userID,
}: {
  context: RequestContext;
  targetUserID: UUID;
  message: MessageEntity;
  userID: string;
}) {
  const orgID = message.orgID;
  const messageID = message.id;
  const threadID = message.threadID;

  const [sender, target, org, targetOrgMember, thread] = await Promise.all([
    context.loaders.userLoader.loadUserInAnyViewerOrg(userID),
    context.loaders.userLoader.loadUser(targetUserID),
    context.loaders.orgLoader.loadOrg(orgID),
    context.loaders.orgMembersLoader.loadForSpecifiedPlatformOrgOrLinkedSlackOrg(
      context,
      targetUserID,
      orgID,
    ),
    context.loaders.threadLoader.loadThread(threadID),
  ]);

  if (!thread) {
    context.logger.error(`Cannot load thread ${threadID}`);
    return;
  }

  if (!sender || !org) {
    context.logger.error('Cannot load user for ' + userID, {
      messageID,
      threadID,
    });
    return;
  }

  if (!target) {
    context.logger.error('Cannot load target user for ' + targetUserID, {
      messageID,
      threadID,
    });
    return;
  }

  if (target.state !== 'active') {
    context.logger.info(
      'Not sending notification to deleted user ' + targetUserID,
      { messageID, threadID },
    );
    return;
  }

  if (!targetOrgMember) {
    context.logger.error(
      `Target user ${targetUserID} does not exist in org ${orgID}, nor in org linked to it.`,
      { messageID, threadID },
    );
    return;
  }

  const emailMatchedSlackUserID = await findSlackUserEmailMatch(
    context,
    org,
    target,
  ).then((value) => value?.id);

  const { isEmailNotification, isSlackNotification } =
    await getNotificationPreference(
      context,
      target,
      orgID,
      emailMatchedSlackUserID,
    );

  if (!isEmailNotification && !isSlackNotification) {
    return;
  }

  const [partnerDetails, queryParamDeeplinkEnabled] = await Promise.all([
    getPartnerDetails(context, sender),
    getTypedFeatureFlagValue(FeatureFlags.QUERY_PARAM_DEEP_LINKS, {
      userID: targetUserID,
      orgID: targetOrgMember.orgID,
      platformApplicationID:
        context.session.viewer.platformApplicationID ?? 'extension',
      version: context.clientVersion,
      customerID: context.application?.customerID,
    }),
  ]);

  let pageURL = message.url ?? thread.url ?? null;
  if (queryParamDeeplinkEnabled && pageURL) {
    pageURL = injectDeeplinkQueryParamsV1(
      context.logger,
      pageURL,
      threadID,
      messageID,
    );
  }

  return {
    thread,
    target,
    targetOrgMember,
    isEmailNotification,
    isSlackNotification,
    sender,
    org,
    partnerDetails,
    pageURL,
    emailMatchedSlackUserID,
  };
}
