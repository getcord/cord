import type { RequestContext } from 'server/src/RequestContext.ts';
import { assertViewerHasUser } from 'server/src/auth/index.ts';
import { isInlineDisplayableImage } from '@cord-sdk/react/common/lib/uploads.ts';
import { generateOutboundNotificationLoggingURL } from 'server/src/notifications/outbound/logging.ts';
import type { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import submitAsync from 'server/src/asyncTier/submitAsync.ts';
import type { ThreadActionType } from 'server/src/notifications/types/thread_action.ts';
import type {
  SendMentionSlackNotificationData,
  SendThreadActionSlackNotificationData,
} from 'server/src/asyncTier/jobs/sendSlackNotificationWithDelay.ts';
import { sendSlackNotificationWithDelay } from 'server/src/asyncTier/jobs/sendSlackNotificationWithDelay.ts';
import { detailsForDisplay } from 'server/src/entity/user/util.ts';
import type { NotificationReplyAction } from '@cord-sdk/types';
import { headerText as getMentionNotificationHeader } from 'server/src/notifications/types/reply.ts';
import { headerText as getThreadActionNotificationHeader } from 'server/src/notifications/types/thread_action.ts';
import setTimeoutAsync from 'common/util/setTimeoutAsync.ts';
import {
  loadPartitionedAttachments,
  getIcon,
  generateOutboundNotificationData,
} from 'server/src/notifications/outbound/util.ts';
import type { UUID } from 'common/types/index.ts';
import { buildOutboundEmailNotificationData } from 'server/src/util/email.ts';
import { sendEmailNotification } from 'server/src/asyncTier/jobs/sendEmailNotificationWithDelay.ts';

type SendOutboundNotification = {
  context: RequestContext;
  targetUserID: UUID;
  message: MessageEntity | null;
  providerName?: string;
  screenshotID?: UUID | null;
};
type SendThreadActionOutboundNotification = SendOutboundNotification & {
  notificationType: 'thread_action';
  threadActionType: ThreadActionType;
};
type SendMentionOutboundNotification = SendOutboundNotification & {
  notificationType: 'reply';
  replyActions: NotificationReplyAction[];
};
export async function sendOutboundNotification(
  data: SendThreadActionOutboundNotification | SendMentionOutboundNotification,
) {
  const {
    context,
    targetUserID,
    message,
    providerName,
    screenshotID,
    notificationType,
  } = data;

  const userID = assertViewerHasUser(context.session.viewer);
  if (!message) {
    return;
  }
  const baseNotificationData = await generateOutboundNotificationData({
    context,
    targetUserID,
    userID,
    message,
  });
  if (!baseNotificationData) {
    return;
  }
  const {
    thread,
    target,
    targetOrgMember,
    isEmailNotification,
    isSlackNotification,
    sender,
    partnerDetails,
    pageURL,
    emailMatchedSlackUserID,
    org,
  } = baseNotificationData;
  const messageID = message.id;
  const orgID = org.id;

  if (notificationType === 'reply') {
    const actionText = getMentionNotificationHeader(data.replyActions)[0];
    const actionIcon = getIcon(data.replyActions);

    const [
      screenshot,
      [files, annotationScreenshotFiles, annotationsHighlightedText],
    ] = await Promise.all([
      screenshotID ? context.loaders.fileLoader.loadFile(screenshotID) : null,
      loadPartitionedAttachments(context, messageID),
    ]);

    if (screenshot) {
      files.unshift(screenshot);
    }
    const imageAttachmentsURLs = files
      .filter((file) => isInlineDisplayableImage(file.mimeType))
      .map((file) => file.getPermanentDownloadURL());
    const annotationScreenshotURLs = annotationScreenshotFiles.map((file) =>
      file.getPermanentDownloadURL(),
    );

    const allImageURLs = [...imageAttachmentsURLs, ...annotationScreenshotURLs];

    const nonImageFileAttachmentNames = files
      .filter((file) => !isInlineDisplayableImage(file.mimeType))
      .map((file) => file.name);

    if (isEmailNotification) {
      const emailData = await buildOutboundEmailNotificationData({
        context,
        message,
        sender,
        orgID,
        target,
        actionText,
        actionIcon,
        targetOrgMember,
        thread,
        providerName,
        partnerDetails,
        allImageURLs,
        nonImageFileAttachmentNames,
        notificationType,
        pageURL,
        userID,
      });

      if (!emailData) {
        return;
      }

      if (process.env.IS_TEST) {
        await sendEmailNotification(emailData);
      } else if (process.env.NODE_ENV === 'development') {
        setTimeoutAsync(() => sendEmailNotification(emailData), 1000);
      } else {
        await submitAsync('sendEmailNotificationWithDelay', emailData, {
          startAfter: 40,
        });
      }
    }

    if (isSlackNotification) {
      const [sendingUsername, notificationURL] = await Promise.all([
        detailsForDisplay(sender, context).then((value) => value.displayName),
        generateOutboundNotificationLoggingURL({
          messageID,
          url: pageURL,
          targetOrgID: targetOrgMember.orgID,
          targetUserID,
          type: emailMatchedSlackUserID ? 'slackEmailMatched' : 'slack',
          platformApplicationID: context.session.viewer.platformApplicationID,
          metadata: {},
          sharerUserID: userID,
          sharerOrgID: orgID,
        }),
      ]);

      const slackData: SendMentionSlackNotificationData = {
        viewerUserID: context.session.viewer.userID,
        viewerOrgID: orgID,
        viewerPlatformApplicationID:
          context.session.viewer.platformApplicationID,
        senderUserID: userID,
        senderOrgID: orgID,
        senderName: sendingUsername,
        targetUserID: emailMatchedSlackUserID
          ? emailMatchedSlackUserID
          : targetUserID,
        messageID,
        url: notificationURL,
        pageName: thread.name,
        annotationsHighlightedText,
        providerName,
        messageContent: message.content,
        allImageURLs,
        actionText,
        notificationType,
      };

      if (process.env.IS_TEST) {
        await sendSlackNotificationWithDelay(slackData);
      } else if (process.env.NODE_ENV === 'development') {
        setTimeoutAsync(
          () => sendSlackNotificationWithDelay(slackData),
          1 * 1000,
        );
      } else {
        await submitAsync('sendSlackNotificationWithDelay', slackData, {
          startAfter: 10,
        });
      }
    }
  }

  if (notificationType === 'thread_action') {
    const actionText = getThreadActionNotificationHeader(
      data.threadActionType,
    )[0];
    // TODO: add new icons for thread resolve and unresolve for email templates
    const actionIcon = 'mention';

    if (isEmailNotification) {
      const emailData = await buildOutboundEmailNotificationData({
        context,
        message,
        sender,
        orgID,
        target,
        actionText,
        actionIcon,
        targetOrgMember,
        thread,
        providerName,
        partnerDetails,
        allImageURLs: [],
        nonImageFileAttachmentNames: [],
        notificationType,
        pageURL,
        userID,
      });

      if (!emailData) {
        return;
      }

      if (process.env.IS_TEST) {
        await sendEmailNotification(emailData);
      } else if (process.env.NODE_ENV === 'development') {
        setTimeoutAsync(() => sendEmailNotification(emailData), 40 * 1000);
      } else {
        await submitAsync('sendEmailNotificationWithDelay', emailData, {
          startAfter: 40,
        });
      }
    }

    if (isSlackNotification) {
      const [sendingUsername, notificationURL] = await Promise.all([
        detailsForDisplay(sender, context).then((value) => value.displayName),
        generateOutboundNotificationLoggingURL({
          messageID,
          url: pageURL,
          targetOrgID: targetOrgMember.orgID,
          targetUserID,
          type: emailMatchedSlackUserID ? 'slackEmailMatched' : 'slack',
          platformApplicationID: context.session.viewer.platformApplicationID,
          metadata: {},
          sharerUserID: userID,
          sharerOrgID: orgID,
        }),
      ]);

      const slackData: SendThreadActionSlackNotificationData = {
        viewerUserID: context.session.viewer.userID,
        viewerOrgID: orgID,
        viewerPlatformApplicationID:
          context.session.viewer.platformApplicationID,
        senderUserID: userID,
        senderOrgID: orgID,
        senderName: sendingUsername,
        targetUserID: emailMatchedSlackUserID
          ? emailMatchedSlackUserID
          : targetUserID,
        messageID,
        url: notificationURL,
        pageName: thread.name,
        providerName,
        actionText,
        notificationType,
      };
      if (process.env.IS_TEST) {
        await sendSlackNotificationWithDelay(slackData);
      } else if (process.env.NODE_ENV === 'development') {
        setTimeoutAsync(
          () => sendSlackNotificationWithDelay(slackData),
          10 * 1000,
        );
      } else {
        await submitAsync('sendSlackNotificationWithDelay', slackData, {
          startAfter: 10,
        });
      }
    }
  }
}
