import type {
  CoreNotificationData,
  TranslationParameters,
} from '@cord-sdk/types';
import type { NotificationsNodeFragment } from 'common/graphql/types.ts';
import type { UserByInternalIdFn } from 'common/util/convertToExternal/thread.ts';
import {
  getMessageData,
  getThreadData,
} from 'common/util/convertToExternal/thread.ts';
import { userToUserData } from 'common/util/convertToExternal/user.ts';

function gqlNotificationFragmentHeaderToNotificationVariables(
  gqlHeader: NotificationsNodeFragment['header'][number],
): CoreNotificationData['header'][number] {
  if ('user' in gqlHeader) {
    return {
      type: 'user',
      userID: gqlHeader.user.externalID,
      user: userToUserData(gqlHeader.user),
    };
  } else if ('text' in gqlHeader) {
    return { type: 'text', text: gqlHeader.text, bold: gqlHeader.bold };
  } else {
    const _: never = gqlHeader;
    return { type: 'text', text: '', bold: false };
  }
}

function gqlNotificationFragmentAttachmentToNotificationVariables(
  gqlAttachment: NotificationsNodeFragment['attachment'],
  userByInternalID: UserByInternalIdFn,
): CoreNotificationData['attachment'] {
  if (!gqlAttachment) {
    return null;
  } else if ('message' in gqlAttachment) {
    return {
      type: 'message',
      messageID: gqlAttachment.message.externalID,
      threadID: gqlAttachment.message.thread.externalID,
      message: getMessageData({
        message: gqlAttachment.message,
        thread: gqlAttachment.message.thread,
        userByInternalID,
      }),
    };
  } else if ('url' in gqlAttachment) {
    return {
      type: 'url',
      url: gqlAttachment.url,
    };
  } else if ('thread' in gqlAttachment) {
    return {
      type: 'thread',
      thread: getThreadData(gqlAttachment.thread, userByInternalID),
    };
  } else {
    const _: never = gqlAttachment;
    return null;
  }
}

export function convertGqlNotificationHeaderTranslation(
  gqlNotif: NotificationsNodeFragment,
): CoreNotificationData['headerTranslation'] {
  if (!gqlNotif.headerTranslationKey) {
    return null;
  }
  if (!gqlNotif.headerSimpleTranslationParams) {
    throw new Error('Got notification with translation key but no parameters');
  }
  const parameters: TranslationParameters = {
    ...gqlNotif.headerSimpleTranslationParams,
    senders: gqlNotif.senders.map(userToUserData),
  };
  return {
    key: gqlNotif.headerTranslationKey,
    parameters,
  };
}

export function gqlNotificationFragmentToNotificationVariables(
  gqlNotif: NotificationsNodeFragment,
  userByInternalID: UserByInternalIdFn,
): CoreNotificationData {
  return {
    id: gqlNotif.externalID,
    senderUserIDs: gqlNotif.senders.map((u) => u.externalID),
    iconUrl: gqlNotif.iconUrl ?? null,
    header: gqlNotif.header.map(
      gqlNotificationFragmentHeaderToNotificationVariables,
    ),
    headerTranslation: convertGqlNotificationHeaderTranslation(gqlNotif),
    attachment: gqlNotificationFragmentAttachmentToNotificationVariables(
      gqlNotif.attachment,
      userByInternalID,
    ),
    readStatus: gqlNotif.readStatus,
    timestamp:
      typeof gqlNotif.timestamp === 'string'
        ? new Date(gqlNotif.timestamp)
        : gqlNotif.timestamp,
    extraClassnames: gqlNotif.extraClassnames,
    metadata: gqlNotif.metadata,
  };
}
