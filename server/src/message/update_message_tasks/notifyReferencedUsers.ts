import { unique } from 'radash';

import type { RequestContext } from 'server/src/RequestContext.ts';
import type { FileAttachmentInput, UUID } from 'common/types/index.ts';
import { NotificationMutator } from 'server/src/entity/notification/NotificationMutator.ts';
import { getNotificationReplyActions } from 'server/src/message/util/getNotificationReplyActions.ts';
import { sendOutboundNotification } from 'server/src/notifications/outbound/sendOutboundNotifications.ts';
import type { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import type { PageEntity } from 'server/src/entity/page/PageEntity.ts';

export async function notifyReferencedUsers({
  context,
  message,
  page,
  mentionedUserIDs,
  taskAssigneeUserIDs = [],
  removedTaskAssigneeUserIDs = [],
  fileAttachments = [],
}: {
  context: RequestContext;
  message: MessageEntity;
  page: PageEntity | null;
  mentionedUserIDs: UUID[];
  taskAssigneeUserIDs?: UUID[];
  removedTaskAssigneeUserIDs?: UUID[];
  fileAttachments?: FileAttachmentInput[] | null;
}) {
  const usersToNotify = unique([
    ...mentionedUserIDs,
    ...taskAssigneeUserIDs,
    ...removedTaskAssigneeUserIDs,
  ]);

  if (usersToNotify.length === 0) {
    return;
  }

  const provider =
    page && page.providerID
      ? await context.loaders.providerLoader.load(page.providerID)
      : null;

  await Promise.all(
    usersToNotify.map(async (userID) => {
      const replyActions = getNotificationReplyActions({
        userID,
        taskAssigneeUserIDs,
        mentionedUserIDs,
        fileAttachments: fileAttachments ?? [],
        removedTaskAssigneeUserIDs,
      });
      return await Promise.all([
        sendOutboundNotification({
          context,
          targetUserID: userID,
          message: message,
          providerName: provider?.name,
          replyActions,
          notificationType: 'reply',
        }),

        new NotificationMutator(context.session.viewer).create({
          recipientID: userID,
          type: 'reply',
          messageID: message.id,
          replyActions,
          threadID: message.threadID,
        }),
      ]);
    }),
  );
}
