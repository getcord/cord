import { LogLevel } from 'common/types/index.ts';
import type { FileAttachmentInput, UUID } from 'common/types/index.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import type { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { NotificationMutator } from 'server/src/entity/notification/NotificationMutator.ts';
import { getFeatureFlagValue } from 'server/src/featureflags/index.ts';
import type { FlagsUser } from 'server/src/featureflags/index.ts';
import { getNotificationReplyActions } from 'server/src/message/util/getNotificationReplyActions.ts';
import { sendOutboundNotification } from 'server/src/notifications/outbound/sendOutboundNotifications.ts';
import type { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';

import { getUsersToNotify } from 'server/src/message/util/getUsersToNotify.ts';
import type { PageEntity } from 'server/src/entity/page/PageEntity.ts';
import { shareThreadToApplicationSupportSlackChannel } from 'server/src/bots/ApplicationSupportBot.ts';
import { logServerEvent } from 'server/src/entity/event/EventMutator.ts';
import { ThreadParticipantMutator } from 'server/src/entity/thread_participant/ThreadParticipantMutator.ts';

export async function maybeNotifyReferencedUsers(
  context: RequestContext,
  flagsUser: FlagsUser,
  application: ApplicationEntity,
  page: PageEntity,
  thread: ThreadEntity,
  message: MessageEntity,
  mentionedUserIDs: UUID[],
  taskAssigneeUserIDs: UUID[],
  fileAttachments: FileAttachmentInput[],
  isFirstMessageInThread: boolean,
  subscribeToThread: boolean,
  screenshotID: string | undefined,
) {
  const userReferenceIDSet = new Set([
    ...mentionedUserIDs,
    ...taskAssigneeUserIDs,
  ]);

  // Quick solution to a customer's problem.
  // Every Cord thread will create a thread in Slack. See PR #520
  if (
    application.supportBotID &&
    application.supportOrgID &&
    (await getFeatureFlagValue(
      'share_every_thread_to_application_support_channel',
      flagsUser,
    )) === true
  ) {
    userReferenceIDSet.add(application.supportBotID);
  }

  const userReferenceIDs = [...userReferenceIDSet];

  const usersToNotify = await getUsersToNotify({
    context,
    flagsUser,
    threadID: message.threadID,
    referencedUsers: userReferenceIDs,
    pageContextHash: page.contextHash,
  });

  const threadParticipantMutator = new ThreadParticipantMutator(
    context.session.viewer,
    context.loaders,
  );

  if (subscribeToThread) {
    await threadParticipantMutator.setViewerSubscribed(thread, true);
  }

  if (userReferenceIDs.length > 0) {
    await threadParticipantMutator.subscribeUsersToThread(
      thread.id,
      userReferenceIDs,
    );
  }

  // Imagine there's a thread with a few messages that user A has not written
  // any of, and is not tagged in, but they come across it and decide to read
  // the messages. This makes them become a thread participant so we can record
  // the fact that they saw these messages at X time, and we record that
  // lastUnseenMessageTimestamp is null (because they've seen everything)
  //
  // Another user comes along and writes some new messages - this means there
  // are some new messages user A has not seen (even though in a sense it's
  // still not 'relevant' to them because they're not @ mentioned, don't get
  // notified etc).
  //
  // Running this fn meaning that lastUnseenMessageTimestamp can be updated with
  // a value, so we know in other places that for this user, this has become a
  // thread with unread messages in it.
  //
  // TL;DR: we need to mark the thread newly active for others before we bail out
  // in the next lines.
  await threadParticipantMutator.markThreadNewlyActiveForOtherUsers(
    thread.id,
    message.id,
  );

  if (usersToNotify.length === 0) {
    return;
  }

  // TODO: temp measure for perf issues with web3 app.  They're not using components
  // that use our notifications, and their users have @example.com emails so lets not
  // wait while we send thousands of those into the ether.
  if (context.application?.id !== '9e7d98ae-5da5-42ca-b857-2f15dc9a63db') {
    await Promise.all(
      usersToNotify.map((userID) => {
        const replyActions = getNotificationReplyActions({
          userID,
          taskAssigneeUserIDs,
          mentionedUserIDs,
          fileAttachments,
          isFirstMessageInThread,
        });
        return Promise.all([
          sendOutboundNotification({
            context,
            targetUserID: userID,
            message,
            providerName: undefined,
            replyActions,
            screenshotID,
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

  if (
    application.supportBotID &&
    userReferenceIDs.includes(application.supportBotID)
  ) {
    shareThreadToApplicationSupportSlackChannel(
      application,
      context,
      thread.id,
    ).catch(
      context.logger.exceptionLogger(
        'shareThreadToApplicationSupportSlackChannel in createThreadMessageResolver',
      ),
    );

    logServerEvent({
      session: context.session,
      type: 'user-mentioned-application-support-bot',
      logLevel: LogLevel.DEBUG,
      payload: {
        threadID: thread.id,
        messageID: message.id,
      },
    });
  }
}
