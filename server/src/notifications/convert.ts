import type {
  CoreNotificationData,
  TranslationParameters,
} from '@cord-sdk/types';
import type { RequestContextLoaders } from 'server/src/RequestContextLoaders.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { userDisplayName, userFullName } from 'server/src/entity/user/util.ts';
import { getCoreMessageData } from 'server/src/public/routes/platform/messages/getCoreMessageData.ts';
import { getCoreThreadData } from 'server/src/public/routes/platform/threads/util/getCoreThreadData.ts';
import type { Notification } from 'server/src/schema/resolverTypes.ts';

function gqlNotificationHeaderToNotificationVariables(
  gqlHeader: Notification['header'][number],
): CoreNotificationData['header'][number] {
  if ('user' in gqlHeader) {
    return {
      type: 'user',
      userID: gqlHeader.user.externalID,
      user: {
        id: gqlHeader.user.externalID,
        name: gqlHeader.user.name,
        shortName: gqlHeader.user.screenName,
        displayName: userDisplayName(gqlHeader.user),
        secondaryDisplayName: userFullName(gqlHeader.user),
        profilePictureURL: gqlHeader.user.profilePictureURL,
        metadata: gqlHeader.user.metadata,
      },
    };
  } else if ('text' in gqlHeader) {
    return { type: 'text', text: gqlHeader.text, bold: gqlHeader.bold };
  } else {
    const _: never = gqlHeader;
    return { type: 'text', text: '', bold: false };
  }
}

async function gqlNotificationAttachmentToNotificationVariables(
  loaders: RequestContextLoaders,
  gqlAttachment: Notification['attachment'],
): Promise<CoreNotificationData['attachment']> {
  if (!gqlAttachment) {
    return null;
  } else if ('message' in gqlAttachment) {
    const message = gqlAttachment.message;
    const thread = await ThreadEntity.findByPk(message.threadID);
    if (!thread) {
      throw new Error(
        `Could not find thread ${message.threadID} for message ${message.id}`,
      );
    }
    const coreMessageData = await getCoreMessageData(loaders, message, thread);
    return {
      type: 'message',
      messageID: message.externalID,
      threadID: thread.externalID,
      message: coreMessageData,
    };
  } else if ('url' in gqlAttachment) {
    return {
      type: 'url',
      url: gqlAttachment.url,
    };
  } else if ('thread' in gqlAttachment) {
    const thread = gqlAttachment.thread;

    const threadEntity = await ThreadEntity.findByPk(thread.id);
    if (!threadEntity) {
      throw new Error(`Could not find thread ${thread.id}`);
    }
    const coreThreadData = await getCoreThreadData(loaders, thread);

    return {
      type: 'thread',
      thread: coreThreadData,
    };
  } else {
    const _: never = gqlAttachment;
    return null;
  }
}

function convertGqlNotificationHeaderTranslation(
  gqlNotif: Notification,
): CoreNotificationData['headerTranslation'] {
  if (!gqlNotif.headerTranslationKey) {
    return null;
  }
  if (!gqlNotif.headerSimpleTranslationParams) {
    throw new Error('Got notification with translation key but no parameters');
  }
  const parameters: TranslationParameters = {
    ...gqlNotif.headerSimpleTranslationParams,
    senders: gqlNotif.senders.map((sender) => ({
      id: sender.externalID,
      name: sender.name,
      shortName: sender.screenName,
      displayName: userDisplayName(sender),
      secondaryDisplayName: userFullName(sender),
      profilePictureURL: sender.profilePictureURL,
      metadata: sender.metadata,
    })),
  };
  return {
    key: gqlNotif.headerTranslationKey,
    parameters,
  };
}

export async function gqlNotificationToNotificationVariables(
  loaders: RequestContextLoaders,
  gqlNotif: Notification,
): Promise<CoreNotificationData> {
  return {
    id: gqlNotif.externalID,
    senderUserIDs: gqlNotif.senders.map((u) => u.externalID),
    iconUrl: gqlNotif.iconUrl ?? null,
    header: gqlNotif.header.map(gqlNotificationHeaderToNotificationVariables),
    headerTranslation: convertGqlNotificationHeaderTranslation(gqlNotif),
    attachment: await gqlNotificationAttachmentToNotificationVariables(
      loaders,
      gqlNotif.attachment,
    ),
    readStatus: gqlNotif.readStatus,
    timestamp:
      typeof gqlNotif.timestamp === 'string'
        ? new Date(gqlNotif.timestamp)
        : gqlNotif.timestamp,
    extraClassnames: gqlNotif.extraClassnames ?? null,
    metadata: gqlNotif.metadata,
  };
}
