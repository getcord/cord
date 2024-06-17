import type { UUID } from 'common/types/index.ts';
import { AsyncTierJobDefinition } from 'server/src/asyncTier/jobDefinition.ts';
import { assertViewerHasIdentity, Viewer } from 'server/src/auth/index.ts';
import { sendActionEmailNotification } from 'server/src/email/index.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { EmailOutboundNotificationEntity } from 'server/src/entity/email_notification/EmailOutboundNotificationEntity.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { getFeatureFlagValue } from 'server/src/featureflags/index.ts';
import { contextWithSession } from 'server/src/RequestContext.ts';
import type { CustomEmailTemplate } from 'server/src/entity/application/ApplicationEntity.ts';
import type { ThreadDetails } from 'server/src/util/email.ts';
import type { ActionIcon } from 'server/src/email/index.ts';
import { getTemplateIDForNotification } from 'server/src/email/util.ts';
import type { NotificationType } from 'server/src/entity/notification/NotificationEntity.ts';

export default new AsyncTierJobDefinition(
  'sendEmailNotificationWithDelay',
  sendEmailNotification,
);

export type SendEmailNotificationWithDelayData = {
  viewerUserID: UUID | undefined;
  viewerPlatformApplicationID: UUID | undefined;
  threadOrgID: UUID | undefined;
  messageID: UUID;
  targetUserID: UUID;
  targetOrgID: UUID;
  threadID: UUID;
  targetEmail: string;
  unsubscribeThreadURL: string;
  pageName: string;
  notificationURL: string;
  providerName: string | undefined;
  actionText: string;
  actionIcon: ActionIcon;
  partnerDetails: CustomEmailTemplate | undefined;
  threadDetails: ThreadDetails;
  notificationType: NotificationType;
};

export async function sendEmailNotification(
  data: SendEmailNotificationWithDelayData,
) {
  let viewer: Viewer;

  if (!data.viewerUserID || !data.threadOrgID) {
    throw new Error(
      'Trying to send email notification without viewer userID or orgID',
    );
  }

  if (data.viewerPlatformApplicationID) {
    const [user, org, app] = await Promise.all([
      UserEntity.findByPk(data.viewerUserID),
      OrgEntity.findByPk(data.threadOrgID),
      ApplicationEntity.findByPk(data.viewerPlatformApplicationID),
    ]);

    if (!user?.externalID || !org?.externalID || !app) {
      throw new Error(
        'Trying to send platform user email notification without external user or org ID',
      );
    }

    viewer = await Viewer.createLoggedInPlatformViewer({
      user,
      org,
    });
  } else {
    viewer = Viewer.createLoggedInViewer(data.viewerUserID, data.threadOrgID);
  }

  const context = await contextWithSession(
    { viewer },
    getSequelize(),
    null,
    null,
  );
  const message = await context.loaders.messageLoader.loadMessage(
    data.messageID,
  );

  // If we are unable to load the message, we can not send a notification for it.
  // Because there is a 40 second delay between when a user takes an action and
  // we send the notification, it is possible the thread or message was deleted.
  // We have seen this as errors in #ops about foreign key violations on the
  // email_notifications table below when it tries to create the notification.
  // This doesn't make 0 the chance that this can happen, but does cut the time
  // window down dramatically
  if (!message) {
    context.logger.log(
      'warn',
      'Attempting to send notification to message that no longer exists',
      { threadID: data.threadID, messageID: data.messageID },
    );
    return;
  }

  const { userID, orgID } = assertViewerHasIdentity(context.session.viewer);
  const featureFlagUser = {
    userID,
    orgID,
    platformApplicationID:
      context.session.viewer.platformApplicationID ?? 'extension',
    version: null,
    customerID: context.application?.customerID,
  };
  // Since we only have resolve action type for thread_action notifications we can default
  // to thread_resolve template. In the future if we have more types of thread_action notifications,
  // we should expand the props on getTemplateIDForNotification to handle this.
  const templateId = await getTemplateIDForNotification({
    notificationActionType:
      data.notificationType === 'thread_action' ? 'thread_resolve' : 'mention',
    context,
    featureFlagUser,
  });

  let canSkipSending = false;
  if (
    // we always want to send self-mentions
    data.viewerUserID !== data.targetUserID &&
    message
  ) {
    const lastSeen = (
      await context.loaders.threadParticipantLoader.loadForUser({
        userID: data.targetUserID,
        threadID: message.threadID,
      })
    )?.lastSeenTimestamp;

    // One client always wants us to send an email even if viewed in Cord
    // because they need an email for every message
    const alwaysSendEmail = await getFeatureFlagValue(
      'always_send_email_notification',
      featureFlagUser,
    );
    canSkipSending =
      !alwaysSendEmail && !!lastSeen && lastSeen >= message.timestamp;
  }
  if (canSkipSending) {
    return;
  }

  const emailNotification = await EmailOutboundNotificationEntity.create({
    userID: data.targetUserID,
    orgID: data.targetOrgID,
    threadID: data.threadID,
    email: data.targetEmail,
    // Target user may not be in same org - could instead be part of Slack org
    threadOrgID: data.threadOrgID,
  });

  await sendActionEmailNotification({
    context,
    recipientEmail: data.targetEmail,
    actionText: data.actionText,
    actionIconType: data.actionIcon,
    pageName: data.pageName,
    pageURL: data.notificationURL,
    providerName: data.providerName,
    unsubscribeURL: data.unsubscribeThreadURL,
    partnerDetails: data.partnerDetails,
    threadDetails: data.threadDetails,
    emailNotification,
    templateId,
    notificationType: data.notificationType,
  });
}
