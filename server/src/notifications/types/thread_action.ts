import { assert } from 'common/util/index.ts';
import type { SpecificNotificationEntity } from 'server/src/entity/notification/NotificationEntity.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import type { Notification } from 'server/src/schema/resolverTypes.ts';

export type ThreadActionType = 'resolve' | 'unresolve';

export async function buildThreadActionNotification(
  context: RequestContext,
  notif: SpecificNotificationEntity<'thread_action'>,
): Promise<Notification | null> {
  assert(
    notif.recipientID === context.session.viewer.userID,
    'Viewer must be notif recipient',
  );

  if (notif.senderID === null) {
    throw new Error('Thread action notif must have a sender');
  }

  if (notif.threadID === null) {
    throw new Error('Thread action notif must have a threadID');
  }

  const [sender, thread] = await Promise.all([
    context.loaders.userLoader.loadUser(notif.senderID),
    context.loaders.threadLoader.loadThread(notif.threadID),
  ]);

  // Notifs for thread actions don't necessarily require a sender. However, we currently
  // only create the notifs when we have an `actor` so it's always associated with a
  // message and a user - the content for the notification has also followed this logic
  // and doesn't handle the case where we might not have a sender, hence the check below.
  if (sender === null) {
    throw new Error('Unable to load sender');
  }

  if (thread === null) {
    throw new Error('Unable to load thread');
  }

  if (!notif.threadActionType) {
    throw new Error(
      'threadActionType must be present for thread action notifs',
    );
  }
  const [header, translationKey] = headerText(notif.threadActionType);

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
        text: ` ${header} `,
        bold: false,
      },
      {
        text: thread.name,
        bold: true,
      },
    ],
    headerTranslationKey: translationKey,
    headerSimpleTranslationParams: { threadName: thread.name },
    readStatus: notif.readStatus,
    timestamp: notif.createdTimestamp,
    extraClassnames: notif.extraClassnames,
    metadata: notif.metadata,
    attachment: { thread },
  };
}

export function headerText(action: ThreadActionType): [string, string] {
  switch (action) {
    case 'resolve':
      return [`resolved the thread`, 'cord.thread_resolve'];
    case 'unresolve':
      return [`reopened the thread`, 'cord.thread_unresolve'];
    default: {
      const _: never = action;
      throw new Error('Unknown thread action type: ' + action);
    }
  }
}
