import type { MessageContent, UUID } from 'common/types/index.ts';
import { AsyncTierJobDefinition } from 'server/src/asyncTier/jobDefinition.ts';
import { Viewer } from 'server/src/auth/index.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { contextWithSession } from 'server/src/RequestContext.ts';
import {
  sendSlackMentionNotification,
  sendSlackThreadActionNotification,
} from 'server/src/slack/util.ts';

export default new AsyncTierJobDefinition(
  'sendSlackNotificationWithDelay',
  sendSlackNotificationWithDelay,
);

type SendSlackNotification = {
  viewerUserID: UUID | undefined;
  viewerOrgID: UUID | undefined;
  viewerPlatformApplicationID: UUID | undefined;
  senderUserID: UUID;
  senderOrgID: UUID;
  senderName: string;
  targetUserID: UUID;
  messageID: UUID;
  url: string | null;
  pageName: string | null | undefined;
  providerName: string | undefined;
  actionText: string;
};
export type SendThreadActionSlackNotificationData = SendSlackNotification & {
  notificationType: 'thread_action';
};
export type SendMentionSlackNotificationData = SendSlackNotification & {
  notificationType: 'reply';
  messageContent: MessageContent;
  allImageURLs: string[];
  annotationsHighlightedText: string[];
};
export async function sendSlackNotificationWithDelay(
  data:
    | SendThreadActionSlackNotificationData
    | SendMentionSlackNotificationData,
) {
  let viewer: Viewer;

  if (!data.viewerUserID || !data.viewerOrgID) {
    throw new Error(
      'Trying to send slack notification without viewer userID or orgID',
    );
  }

  if (data.viewerPlatformApplicationID) {
    const [user, org] = await Promise.all([
      UserEntity.findByPk(data.viewerUserID),
      OrgEntity.findByPk(data.viewerOrgID),
    ]);

    if (!user?.externalID || !org?.externalID) {
      throw new Error(
        'Trying to send platform user slack notification without external user or org ID',
      );
    }

    viewer = await Viewer.createLoggedInPlatformViewer({
      user,
      org,
    });
  } else {
    viewer = Viewer.createLoggedInViewer(data.viewerUserID, data.viewerOrgID);
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
    canSkipSending = !!lastSeen && lastSeen >= message.timestamp;
  }

  if (canSkipSending) {
    return;
  }

  const notificationData = {
    context,
    senderUserID: data.senderUserID,
    senderOrgID: data.senderOrgID,
    senderName: data.senderName,
    targetUserID: data.targetUserID,
    messageID: data.messageID,
    url: data.url,
    pageName: data.pageName,
    providerName: data.providerName,
    actionText: data.actionText,
  };

  if (data.notificationType === 'thread_action') {
    await sendSlackThreadActionNotification({
      ...notificationData,
    });
  } else {
    await sendSlackMentionNotification({
      ...notificationData,
      // using messageContent passed to this job instead of message.content since
      // message.content might have changed in the meantime
      messageContent: data.messageContent,
      allImageURLs: data.allImageURLs,
      actionText: data.actionText,
      annotationsHighlightedText: data.annotationsHighlightedText,
    });
  }
}
