import { assert } from 'common/util/index.ts';
import type { SpecificNotificationEntity } from 'server/src/entity/notification/NotificationEntity.ts';
import type { NotificationReplyAction } from '@cord-sdk/types';
import type { RequestContext } from 'server/src/RequestContext.ts';
import type { Notification } from 'server/src/schema/resolverTypes.ts';

export async function buildReplyNotification(
  context: RequestContext,
  notif: SpecificNotificationEntity<'reply'>,
): Promise<Notification | null> {
  assert(
    notif.recipientID === context.session.viewer.userID,
    'Viewer must be notif recipient',
  );

  if (notif.messageID === null) {
    throw new Error('Reply notif must have messageID');
  }

  if (notif.replyActions === null) {
    throw new Error('No reply actions');
  }

  if (notif.senderID === null) {
    throw new Error('Reply notif must have a sender');
  }

  const [sender, message] = await Promise.all([
    context.loaders.userLoader.loadUser(notif.senderID),
    context.loaders.messageLoader.loadMessage(notif.messageID),
  ]);

  if (sender === null) {
    throw new Error('Unable to load sender');
  }

  if (message === null) {
    throw new Error('Unable to load message');
  }

  // If the underlying message has been deleted, don't return a notification
  if (message.deletedTimestamp) {
    return null;
  }

  const thread = await context.loaders.threadLoader.loadThread(
    message.threadID,
  );

  if (thread === null) {
    throw new Error('Unable to load thread');
  }

  const [header, connective, translationKey] = headerText(notif.replyActions);

  return {
    id: notif.id,
    externalID: notif.externalID,
    senders: [sender],
    iconUrl: null,
    header: [
      {
        user: sender,
      },
      {
        text: ` ${header} ${connective} `,
        bold: false,
      },
      {
        text: thread.name,
        bold: true,
      },
    ],
    headerTranslationKey: translationKey,
    headerSimpleTranslationParams: { threadName: thread.name },
    attachment: {
      message,
    },
    readStatus: notif.readStatus,
    timestamp: notif.createdTimestamp,
    extraClassnames: notif.extraClassnames,
    metadata: notif.metadata,
  };
}

export function headerText(
  actions: NotificationReplyAction[],
): [string, string, string] {
  if (actions.includes('unassign-task')) {
    let text = 'unassigned you from a task';
    let key = 'cord.reply_unassign';
    if (actions.includes('mention')) {
      text = 'mentioned you and ' + text;
      key = 'cord.reply_mention_unassign';
    }
    return [text, 'in', key];
  } else if (actions.includes('assign-task')) {
    let text = 'assigned you to a task';
    let key = 'cord.reply_assign';
    if (actions.includes('mention')) {
      text = 'mentioned you and ' + text;
      key = 'cord.reply_mention_assign';
    }
    return [text, 'in', key];
  } else if (actions.includes('mention')) {
    let text = 'mentioned you';
    let key = 'cord.reply_mention';
    if (actions.includes('attach-file')) {
      text += ' and sent you a file';
      key = 'cord.reply_mention_attachment';
    }
    return [text, 'in', key];
  } else if (actions.includes('create-thread')) {
    return ['created a new thread', 'named', 'cord.thread_create'];
  } else {
    return ['replied', 'on', 'cord.reply'];
  }
}
