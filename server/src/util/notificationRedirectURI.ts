import type {
  OutboundNotificationMetadata,
  OutboundNotificationMetadataByType,
  OutboundNotificationType,
  UUID,
} from 'common/types/index.ts';
import { LogLevel } from 'common/types/index.ts';
import type { MessageOutboundNotificationEntity } from 'server/src/entity/message_notification/MessageOutboundNotificationEntity.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { logServerEvent } from 'server/src/entity/event/EventMutator.ts';
import { AuthProviderType, Viewer } from 'server/src/auth/index.ts';
import { contextWithSession } from 'server/src/RequestContext.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import type { Logger } from 'server/src/logging/Logger.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { externalizeID } from 'common/util/externalIDs.ts';
import type {
  MessageNotificationDataByType,
  UserDetails,
} from 'server/src/util/redirectURI.ts';
import {
  applicationSupportsRedirect,
  generateSignedExternalRedirectURI,
} from 'server/src/util/redirectURI.ts';
import { detailsForDisplay } from 'server/src/entity/user/util.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';

// We treat type 'slackEmailMatched' the same as a 'slack' mention in this instance
type MessageNotificationTypeExcludingSlackMatchedEmail = Exclude<
  OutboundNotificationType,
  'slackEmailMatched'
>;

type MessageNotificationRedirectURIData =
  MessageNotificationDataByType[MessageNotificationTypeExcludingSlackMatchedEmail];

type NotificationRedirectType = {
  messageNotificationEntity: MessageOutboundNotificationEntity;
  targetOrgID: UUID;
  targetExternalOrgID: string | null;
  platformApplicationID: UUID;
  redirectID: string;
};
// generate the redirectURI with the data required
export async function getNotificationRedirectURI(
  logger: Logger,
  {
    messageNotificationEntity,
    targetOrgID,
    targetExternalOrgID,
    platformApplicationID,
    redirectID,
  }: NotificationRedirectType,
) {
  try {
    const appSupportsRedirect = await applicationSupportsRedirect(
      platformApplicationID,
    );
    if (!appSupportsRedirect) {
      return messageNotificationEntity.url;
    }

    // Redirect URI does exist
    const data = await getNotificationRedirectURIData({
      messageNotificationEntity,
    });

    logServerEvent({
      session: {
        viewer: Viewer.createOrgViewer(targetOrgID),
      },
      type: 'notification-logging-redirect-uri',
      logLevel: LogLevel.DEBUG,
      payload: {
        redirectURIInfo: JSON.parse(JSON.stringify(data)),
        orgID: targetOrgID,
        groupID: targetOrgID,
        platformApplicationID,
        redirectID,
        externalOrgID: targetExternalOrgID,
        messageNotifications: messageNotificationEntity.get({ plain: true }),
      },
    });

    return await generateSignedExternalRedirectURI(
      platformApplicationID,
      messageNotificationEntity.url,
      data,
    );
  } catch (error) {
    logger.error('getSharedToEmailRedirectURI:' + error, {
      orgID: targetOrgID,
      groupID: targetOrgID,
      platformApplicationID,
      redirectID,
      externalOrgID: targetExternalOrgID,
      messageNotifications: messageNotificationEntity.get({ plain: true }),
    });

    return messageNotificationEntity.url;
  }
}

type GetNotificationRedirectURIData = {
  messageNotificationEntity: MessageOutboundNotificationEntity;
};

async function getNotificationRedirectURIData({
  messageNotificationEntity,
}: GetNotificationRedirectURIData): Promise<MessageNotificationRedirectURIData> {
  const {
    type,
    sharerUserID,
    sharerOrgID,
    targetUserID,
    targetOrgID,
    messageID,
    url,
    timestamp,
    metadata,
  } = messageNotificationEntity;

  if (!sharerUserID || !sharerOrgID) {
    throw new Error('SharerUserID or SharerOrgID not defined');
  }

  const [sharer, message, sharerOrg] = await Promise.all([
    UserEntity.findByPk(sharerUserID),
    MessageEntity.findByPk(messageID),
    OrgEntity.findByPk(sharerOrgID),
  ]);

  const context = await contextWithSession(
    {
      viewer: targetUserID
        ? Viewer.createLoggedInViewer(targetUserID, targetOrgID)
        : Viewer.createOrgViewer(targetOrgID),
    },
    getSequelize(),
    null,
    null,
  );

  if (!sharer) {
    throw new Error('Sharer not found');
  }

  if (!sharer.externalID && sharer.userType === 'person') {
    throw new Error('Sharer externalID not defined and user is not bot');
  }

  if (!sharer.externalProvider && sharer.userType === 'person') {
    throw new Error('Sharer AuthProvider is null');
  }

  if (!message) {
    throw new Error('MessageEntity not found');
  }

  if (!sharerOrg || !sharerOrg.externalID) {
    throw new Error('Sharer Org not found or externalID not defined');
  }

  const thread = await ThreadEntity.findByPk(message.threadID);

  if (!thread) {
    throw new Error('ThreadEntity not found');
  }

  const threadID = thread.externalID;

  const sharerDisplayDetails = await detailsForDisplay(sharer, context);

  const sharerDetails: UserDetails = {
    userType: sharer.externalProvider,
    userID: sharer.externalID,
    email: sharer.email,
    name: sharerDisplayDetails.displayName,
    profilePictureURL: sharerDisplayDetails.profilePictureURL,
    orgID: sharerOrg.externalID,
    groupID: sharerOrg.externalID,
  };

  const baseData = {
    sharerDetails,
    threadID,
    url,
    timestamp,
  };

  switch (type) {
    case 'email': {
      const targetDetails = await getTargetDetails(
        type,
        targetOrgID,
        targetUserID,
        sharerDetails,
        sharerUserID,
        context,
      );

      const emailMentionData: MessageNotificationDataByType['email'] = {
        type,
        ...baseData,
        messageID: externalizeID(message.id),
        targetDetails,
      };
      return emailMentionData;
    }
    case 'sharedToEmail': {
      const targetDetails = await getTargetDetails(
        type,
        targetOrgID,
        targetUserID,
        sharerDetails,
        sharerUserID,
        context,
        metadata,
      );

      const sharedToEmailData: MessageNotificationDataByType['sharedToEmail'] =
        {
          type,
          targetDetails,
          ...baseData,
        };
      return sharedToEmailData;
    }
    case 'sharedToSlackChannel': {
      const targetDetails = await getTargetDetails(
        type,
        targetOrgID,
        targetUserID,
        sharerDetails,
        sharerUserID,
        context,
        metadata,
      );

      const sharedToSlackChannelData: MessageNotificationDataByType['sharedToSlackChannel'] =
        {
          type,
          targetDetails,
          ...baseData,
        };
      return sharedToSlackChannelData;
    }
    case 'slackEmailMatched':
    case 'slack': {
      const targetDetails = await getTargetDetails(
        'slack',
        targetOrgID,
        targetUserID,
        sharerDetails,
        sharerUserID,
        context,
        metadata,
      );

      const slackData: MessageNotificationDataByType['slack'] = {
        type: 'slack',
        targetDetails,
        messageID: externalizeID(message.id),
        ...baseData,
      };
      return slackData;
    }
  }
}

function asSharedToEmailMetadata(
  metadata: OutboundNotificationMetadata,
): OutboundNotificationMetadataByType['sharedToEmail'] | null {
  if (
    'type' in metadata &&
    metadata.type === 'sharedToEmail' &&
    'targetEmail' in metadata &&
    typeof metadata.targetEmail === 'string'
  ) {
    return metadata;
  }

  return null;
}

function asSharedToSlackChannelMetadata(
  metadata: OutboundNotificationMetadata,
): OutboundNotificationMetadataByType['sharedToSlackChannel'] | null {
  if (
    'type' in metadata &&
    metadata.type === 'sharedToSlackChannel' &&
    'targetSlackChannelID' in metadata &&
    typeof metadata.targetSlackChannelID === 'string'
  ) {
    return metadata;
  }
  return null;
}

async function getTargetDetails<
  Type extends MessageNotificationTypeExcludingSlackMatchedEmail,
>(
  notificationType: Type,
  targetOrgID: UUID,
  targetUserID: UUID | null,
  sharerDetails: UserDetails,
  sharerUserID: UUID,
  context: RequestContext,
  metadata?: OutboundNotificationMetadata,
): Promise<MessageNotificationDataByType[Type]['targetDetails']> {
  switch (notificationType) {
    case 'slack':
    case 'email': {
      if (!targetUserID) {
        throw new Error('targetUserID not defined');
      }

      // if sharer and target are the same
      if (targetUserID === sharerUserID) {
        return sharerDetails;
      }

      const [target, targetOrg] = await Promise.all([
        UserEntity.findByPk(targetUserID),
        OrgEntity.findByPk(targetOrgID),
      ]);

      if (!target || !target.externalID) {
        throw new Error('target not found or externalID not found');
      }

      if (!target.externalProvider) {
        throw new Error('Target AuthProvider is null');
      }

      if (!targetOrg || !targetOrg.externalID) {
        throw new Error('targetOrg not found or externalID not found');
      }

      const targetProfileDisplayDetails = await detailsForDisplay(
        target,
        context,
      );

      return {
        userType: target.externalProvider,
        userID: target.externalID,
        name: targetProfileDisplayDetails.displayName,
        email: target.email,
        profilePictureURL: targetProfileDisplayDetails.profilePictureURL,
        orgID: targetOrg.externalID,
        groupID: targetOrg.externalID,
      };
    }

    case 'sharedToEmail': {
      if (!metadata) {
        throw new Error('Metadata does not exist');
      }
      const sharedToEmailMetadata = asSharedToEmailMetadata(metadata);

      if (!sharedToEmailMetadata) {
        throw new Error('SharedToEmailMetadata does not exist');
      }
      return {
        userType: null,
        email: sharedToEmailMetadata.targetEmail,
      };
    }

    case 'sharedToSlackChannel': {
      if (!metadata) {
        throw new Error('Metadata does not exist');
      }
      const sharedToSlackChannelMetadata =
        asSharedToSlackChannelMetadata(metadata);

      if (!sharedToSlackChannelMetadata) {
        throw new Error('SharedToSlackChannelMetadata does not exist');
      }
      const targetOrg = await OrgEntity.findByPk(targetOrgID);

      if (!targetOrg || !targetOrg.externalID) {
        throw new Error('targetOrg not found or externalID not found');
      }

      return {
        userType: AuthProviderType.SLACK,
        orgID: targetOrg.externalID,
        groupID: targetOrg.externalID,
        slackChannelID: sharedToSlackChannelMetadata.targetSlackChannelID,
      };
    }
    default: {
      const unhandledType: never = notificationType;
      throw new Error('Forgot to handle type: ' + unhandledType);
    }
  }
}
