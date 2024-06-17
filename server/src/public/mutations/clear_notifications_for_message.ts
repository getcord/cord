import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import {
  assertViewerHasPlatformUser,
  assertViewerHasUser,
} from 'server/src/auth/index.ts';
import { NotificationEntity } from 'server/src/entity/notification/NotificationEntity.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import { NotificationMutator } from 'server/src/entity/notification/NotificationMutator.ts';
import { ApiCallerError } from 'server/src/public/routes/platform/util.ts';

export const clearNotificationsForMessageMutation: Resolvers['Mutation']['clearNotificationsForMessage'] =
  async (_, args, context) => {
    const { messageID, byExternalID } = args;

    const internalMessageID = await getInternalMessageID(
      messageID,
      byExternalID ?? false,
      context,
    );

    await markAttachedNotificationsAsSeen(internalMessageID, context);

    return {
      success: true,
      failureDetails: null,
    };
  };

async function getInternalMessageID(
  messageID: string,
  byExternalID: boolean,
  context: RequestContext,
): Promise<string> {
  if (!byExternalID) {
    return messageID;
  }

  const { platformApplicationID } = assertViewerHasPlatformUser(
    context.session.viewer,
  );

  const message = await context.loaders.messageLoader.loadMessageByExternalID(
    messageID,
    platformApplicationID,
  );

  if (!message) {
    throw new ApiCallerError('message_not_found');
  }

  return message.id;
}

async function markAttachedNotificationsAsSeen(
  messageID: string,
  context: RequestContext,
): Promise<void> {
  const { viewer } = context.session;

  const userID = assertViewerHasUser(viewer);

  const notifs = await NotificationEntity.findAll({
    where: {
      messageID,
      recipientID: userID,
      readStatus: 'unread',
    },
  });

  const notificationMutator = new NotificationMutator(viewer);

  await Promise.all(
    notifs.map((notif) => notificationMutator.markAsRead(notif)),
  );
}
