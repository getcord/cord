import type { MessageContent, MessageType, UUID } from 'common/types/index.ts';
import { convertStructuredMessageToText } from '@cord-sdk/react/common/lib/messageNode.ts';
import { convertNodeListToEmailHtml } from 'server/src/email/util.ts';
import { middleElideFileName } from 'common/util/middleElideFileName.ts';
import type { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import { detailsForDisplay } from 'server/src/entity/user/util.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { getStableColorPalette } from 'common/ui/getStableColorPalette.ts';
import { API_ORIGIN } from 'common/const/Urls.ts';
import type { SendEmailNotificationWithDelayData } from 'server/src/asyncTier/jobs/sendEmailNotificationWithDelay.ts';
import type { ActionIcon } from 'server/src/email/index.ts';
import { encodeUnsubscribeThreadToken } from 'server/src/email/index.ts';
import { generateOutboundNotificationLoggingURL } from 'server/src/notifications/outbound/logging.ts';
import { UNSUBSCRIBE_PATH } from 'server/src/public/routes/MainRouter.ts';
import type { CustomEmailTemplate } from 'server/src/entity/application/ApplicationEntity.ts';
import type { NotificationType } from 'server/src/entity/notification/NotificationEntity.ts';
import type { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import type { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';

type UserDetails = {
  name: string;
  profile_picture: string | null;
  initial: string;
  /**
   * Matches the color palette we assign in the UI.
   * Useful to have fallback avatars have the same
   * colour both in the UI and in emails.
   */
  color_palette: number;
};

type MessageDetailsWithoutAnnotations = {
  message: string;
  message_preview: string;
  timestamp: string;
  message_type: MessageType;
};

type MessageDetailsWithAnnotationsAndAttachments =
  MessageDetailsWithoutAnnotations & {
    annotations: {
      first_annotation: string | null;
      other_annotations: string[];
      extra_number_annotations: number;
    } | null;
    file_names: string[];
  };

export type ThreadDetails = {
  senderName: string;
  firstMessageDetails: MessageDetailsWithoutAnnotations | null;
  firstMessageUserDetails: UserDetails | null;
  previousMessageDetails: MessageDetailsWithoutAnnotations | null;
  previousMessageUserDetails: UserDetails | null;
  currentMessageDetails: MessageDetailsWithAnnotationsAndAttachments;
  currentMessageUserDetails: UserDetails;
  messagesCountLeft: number;
};

type GetThreadDetailsArgs = {
  threadID: UUID;
  currentMessage: MessageEntity;
  sender: UserEntity;
  currentMessageAttachments: string[];
  currentFileAttachments: string[];
  context: RequestContext;
};

// If the thread is long enough we show the current, previous, and first message.
const MAX_NUM_MESSAGES_SHOWN = 3;
const MAX_NUM_ANNOTATIONS_SHOWN = 3;
const MAX_FILE_NAME_LENGTH = 50;

// Returns data of the message and author, and any context in the thread i.e
// potentially the previous message and author, and if the thread has more
// than 3 messages we also return the first message and author of the thread,
// and a count of how many messages are in between.
// This data is sent to sendgrid ot render.
export async function getThreadDetails({
  threadID,
  currentMessage,
  sender,
  currentMessageAttachments,
  currentFileAttachments,
  context,
}: GetThreadDetailsArgs): Promise<ThreadDetails | null> {
  try {
    const messageID = currentMessage.id;

    // number of older messages up to the current message (+1 for current message)
    const messagesCountExcludingDeleted =
      (await context.loaders.threadLoader.loadMessagesCountExcludingDeletedNoOrgCheck(
        threadID,
        messageID,
      )) + 1;

    const senderDetailsForDisplay = await detailsForDisplay(sender, context);

    const senderName = senderDetailsForDisplay.displayName;

    const currentMessageUserDetails = await getUserDetails({
      context,
      sender,
      message: currentMessage,
    });

    const currentMessageDetails = createMessageDetailsWithAnnotations(
      currentMessage.content,
      currentMessage.timestamp,
      currentMessageAttachments.length > 0 ? currentMessageAttachments : null,
      currentFileAttachments,
      currentMessage.type,
    );

    let firstMessageUserDetails: UserDetails | null = null;
    let firstMessageDetails: MessageDetailsWithoutAnnotations | null = null;
    let previousMessageUserDetails: UserDetails | null = null;
    let previousMessageDetails: MessageDetailsWithoutAnnotations | null = null;

    // The number of messages left without the current, previous, or first message
    const messagesCountLeft =
      messagesCountExcludingDeleted > MAX_NUM_MESSAGES_SHOWN
        ? messagesCountExcludingDeleted - MAX_NUM_MESSAGES_SHOWN
        : 0;

    if (messagesCountExcludingDeleted === 1) {
      return {
        senderName,
        firstMessageUserDetails,
        firstMessageDetails,
        previousMessageUserDetails,
        previousMessageDetails,
        currentMessageUserDetails,
        currentMessageDetails,
        messagesCountLeft,
      };
    }

    // there has to be at least 1 previous message
    const messages = await context.loaders.messageLoader.loadMessages({
      threadID,
      range: -1,
      ignoreDeleted: true,
      cursor: messageID,
    });
    if (messages.length === 0 || messages[0].id === messageID) {
      throw Error(
        `Could not find previous messages in thread ${threadID}, current message: ${messageID}`,
      );
    }

    const previousMessage = messages[0];

    previousMessageUserDetails = await getUserDetails({
      context,
      sender,
      message: previousMessage,
    });

    previousMessageDetails = createMessageDetailsWithoutAnnotations(
      previousMessage.content,
      previousMessage.timestamp,
      previousMessage.type,
    );

    if (messagesCountExcludingDeleted === 2) {
      return {
        senderName,
        firstMessageDetails,
        firstMessageUserDetails,
        previousMessageDetails,
        previousMessageUserDetails,
        currentMessageUserDetails,
        currentMessageDetails,
        messagesCountLeft,
      };
    }

    // more than two messages so we can find the first message of the thread
    const firstMessages = await context.loaders.messageLoader.loadMessages({
      threadID,
      range: 1,
      ignoreDeleted: true,
    });

    if (firstMessages.length === 0) {
      throw Error(
        `Could not find previous messages in thread ${threadID}, current message: ${messageID}`,
      );
    }

    const firstMessageOfThread = firstMessages[0];

    firstMessageUserDetails = await getUserDetails({
      context,
      sender,
      message: firstMessageOfThread,
    });

    firstMessageDetails = createMessageDetailsWithoutAnnotations(
      firstMessageOfThread.content,
      firstMessageOfThread.timestamp,
      firstMessageOfThread.type,
    );

    return {
      senderName,
      firstMessageDetails,
      firstMessageUserDetails,
      previousMessageDetails,
      previousMessageUserDetails,
      currentMessageUserDetails,
      currentMessageDetails,
      messagesCountLeft,
    };
  } catch (e) {
    context.logger.logException('getThreadDetails failed', e, {
      threadID,
      currentMessageID: currentMessage.id,
      senderUserID: sender.id,
      currentMessageAttachments,
      currentFileAttachments,
      viewer: JSON.parse(JSON.stringify(context.session.viewer)),
    });
    return null;
  }
}

async function createMessageUserDetails(
  user: UserEntity,
  context: RequestContext,
): Promise<UserDetails> {
  const userDisplayDetails = await detailsForDisplay(user, context);

  const name = userDisplayDetails.displayName;
  return {
    name,
    profile_picture: userDisplayDetails.profilePictureURL,
    initial: name.slice(0, 1).toUpperCase(),
    color_palette: getStableColorPalette(user.externalID),
  };
}

function createMessageDetailsWithoutAnnotations(
  messageContent: MessageContent,
  messageTimestamp: Date,
  messageType: MessageType,
): MessageDetailsWithoutAnnotations {
  return {
    message: convertNodeListToEmailHtml(messageContent),
    message_preview: convertStructuredMessageToText(messageContent),
    timestamp: messageTimestamp.toISOString(),
    message_type: messageType,
  };
}

function createMessageDetailsWithAnnotations(
  messageContent: MessageContent,
  messageTimestamp: Date,
  annotations: string[] | null = null,
  nonImageFileAttachmentNames: string[],
  messageType: MessageType,
): MessageDetailsWithAnnotationsAndAttachments {
  const extraNumberOfAnnotations =
    annotations && annotations.length > MAX_NUM_ANNOTATIONS_SHOWN
      ? annotations.length - MAX_NUM_ANNOTATIONS_SHOWN
      : 0;

  return {
    message: convertNodeListToEmailHtml(messageContent),
    message_preview: convertStructuredMessageToText(messageContent),
    timestamp: messageTimestamp.toISOString(),
    annotations: annotations
      ? {
          first_annotation: annotations[0] ?? null,
          // only want the next 2 annotations on the list
          other_annotations:
            annotations.slice(1, MAX_NUM_ANNOTATIONS_SHOWN) ?? [],
          extra_number_annotations: extraNumberOfAnnotations,
        }
      : null,
    file_names: nonImageFileAttachmentNames.map((fileName) =>
      middleElideFileName(fileName, MAX_FILE_NAME_LENGTH),
    ),
    message_type: messageType,
  };
}

type GetUserDetailsArgs = {
  context: RequestContext;
  sender: UserEntity;
  message: MessageEntity;
};

async function getUserDetails({
  context,
  sender,
  message,
}: GetUserDetailsArgs) {
  if (message.sourceID === sender.id) {
    return await createMessageUserDetails(sender, context);
  } else {
    const user = await context.loaders.userLoader.loadUser(message.sourceID);
    if (!user) {
      throw new Error(`Could not load user for messageID: ${message.id}`);
    }
    return await createMessageUserDetails(user, context);
  }
}

export async function buildOutboundEmailNotificationData({
  context,
  message,
  sender,
  orgID,
  target,
  actionText,
  targetOrgMember,
  actionIcon,
  thread,
  providerName,
  partnerDetails,
  allImageURLs,
  nonImageFileAttachmentNames,
  notificationType,
  pageURL,
  userID,
  ...rest
}: {
  context: RequestContext;
  message: MessageEntity;
  sender: UserEntity;
  orgID: string;
  target: UserEntity;
  actionText: string;
  targetOrgMember: OrgMembersEntity;
  actionIcon: ActionIcon;
  thread: ThreadEntity;
  providerName: string | undefined;
  partnerDetails: CustomEmailTemplate | undefined;
  allImageURLs: string[];
  nonImageFileAttachmentNames: string[];
  pageURL: string;
  userID: string;
  notificationType: NotificationType;
}): Promise<SendEmailNotificationWithDelayData | undefined> {
  const _: Record<string, never> = rest;

  const threadID = thread.id;
  const messageID = message.id;
  const targetUserID = target.id;

  // Used to check if the user has opted-out of email notifications for that thread
  const isSubscribed =
    await context.loaders.emailSubscriptionLoader.isUserSubscribedToThread(
      targetUserID,
      threadID,
    );

  if (!isSubscribed) {
    return;
  }

  const unsubscribeThreadToken = encodeUnsubscribeThreadToken({
    userID: targetUserID,
    orgID: targetOrgMember.orgID,
    threadID,
    appID: sender.platformApplicationID,
  });
  const unsubscribeThreadURL = `${API_ORIGIN}${UNSUBSCRIBE_PATH}?token=${unsubscribeThreadToken}`;

  const notificationURL = await generateOutboundNotificationLoggingURL({
    messageID,
    url: pageURL,
    targetOrgID: targetOrgMember.orgID,
    targetUserID,
    type: 'email',
    platformApplicationID: context.session.viewer.platformApplicationID,
    metadata: {},
    sharerUserID: userID,
    sharerOrgID: orgID,
  });

  const threadDetails = await getThreadDetails({
    threadID,
    currentMessage: message,
    sender,
    currentMessageAttachments: allImageURLs,
    currentFileAttachments: nonImageFileAttachmentNames,
    context,
  });

  if (!threadDetails) {
    context.logger.error('Could not generate threadDetails for v2 email');
    return;
  }

  return {
    viewerUserID: context.session.viewer.userID,
    viewerPlatformApplicationID: context.session.viewer.platformApplicationID,
    threadOrgID: orgID,
    targetUserID,
    targetOrgID: targetOrgMember.orgID,
    threadID,
    messageID,
    targetEmail: target.email!, // Checked in notificationChannels
    actionText,
    actionIcon,
    pageName: thread.name,
    notificationURL,
    providerName,
    unsubscribeThreadURL,
    partnerDetails,
    threadDetails,
    notificationType,
  };
}
