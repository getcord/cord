import type { UUID } from '@cord-sdk/types';
import type { RequestContext } from 'server/src/RequestContext.ts';
import { assertViewerHasUser } from 'server/src/auth/index.ts';
import { NotificationMutator } from 'server/src/entity/notification/NotificationMutator.ts';
import type { ThreadActionType } from 'server/src/notifications/types/thread_action.ts';
import { sendOutboundNotification } from 'server/src/notifications/outbound/sendOutboundNotifications.ts';

export async function createThreadActionNotifications({
  context,
  threadID,
  messageID,
  threadActionType,
}: {
  context: RequestContext;
  threadID: string;
  messageID: string;
  threadActionType: ThreadActionType;
}) {
  const viewerUserID = assertViewerHasUser(context.session.viewer);

  const usersToNotify = new Set<UUID>();
  const participants =
    await context.loaders.threadParticipantLoader.loadForThreadIDNoOrgCheck(
      threadID,
    );
  participants.forEach((tp) =>
    tp.subscribed && tp.userID !== viewerUserID
      ? usersToNotify.add(tp.userID)
      : null,
  );

  const message = await context.loaders.messageLoader.loadMessage(messageID);

  await Promise.all(
    [...usersToNotify].map((userIDToNotify: string) => {
      return Promise.all([
        sendOutboundNotification({
          context,
          targetUserID: userIDToNotify,
          providerName: undefined,
          message,
          notificationType: 'thread_action',
          threadActionType,
        }),
        new NotificationMutator(context.session.viewer).create({
          recipientID: userIDToNotify,
          type: 'thread_action',
          threadActionType,
          threadID,
          messageID,
        }),
      ]);
    }),
  );
}
