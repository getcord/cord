import type {
  FileAttachmentInput,
  MessageContent,
  UUID,
} from 'common/types/index.ts';
import type {
  AnnotationAttachmentInput,
  ScreenshotAttachmentInput,
} from 'server/src/admin/resolverTypes.ts';
import type { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import type { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import type { PageEntity } from 'server/src/entity/page/PageEntity.ts';
import { getFeatureFlagValue } from 'server/src/featureflags/index.ts';
import type { FlagsUser } from 'server/src/featureflags/index.ts';
import type { TaskInput } from 'server/src/console/resolverTypes.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import { ACTIVATION_FIRST_MESSAGE_SENT } from 'common/const/UserPreferenceKeys.ts';
import { UserPreferenceMutator } from 'server/src/entity/user_preference/UserPreferenceMutator.ts';
import { assertViewerHasUser } from 'server/src/auth/index.ts';

// Individual tasks
import {
  createMessageMentions,
  updateMessageMentions,
} from 'server/src/schema/common.ts';
import { addNewMessageAttachments } from 'server/src/message/new_message_tasks/addNewMessageAttachments.ts';
import { markThreadSeenForViewer } from 'server/src/message/new_message_tasks/markThreadSeenForViewer.ts';
import { addNewMessageTasks } from 'server/src/message/new_message_tasks/addNewMessageTasks.ts';
import { publishNewMessageEvents } from 'server/src/message/new_message_tasks/publishNewMessageEvents.ts';
import { maybeUnresolveThread } from 'server/src/message/new_message_tasks/maybeUnresolveThread.ts';
import { maybeNotifyReferencedUsers } from 'server/src/message/new_message_tasks/maybeNotifyReferencedUsers.ts';
import { ThreadParticipantMutator } from 'server/src/entity/thread_participant/ThreadParticipantMutator.ts';
import { notifyReferencedUsers } from 'server/src/message/update_message_tasks/notifyReferencedUsers.ts';
import {
  publishUpdatedMessageEvents,
  publishAppendedMessageContentEvents,
} from 'server/src/message/update_message_tasks/publishUpdatedMessageEvents.ts';
import { updateMessageAttachments } from 'server/src/message/update_message_tasks/updateMessageAttachments.ts';
import { updateMessageTask } from 'server/src/message/update_message_tasks/updateMessageTask.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import {
  scheduleGenerateLinkPreviews,
  scheduleUpdateLinkPreviews,
} from 'server/src/message/new_message_tasks/scheduleGenerateLinkPreviews.tsx';

type ExecuteNewMessageCreationTasksArgs = {
  context: RequestContext;
  flagsUser: FlagsUser;
  application: ApplicationEntity;
  page: PageEntity;
  thread: ThreadEntity;
  message: MessageEntity;
  fileAttachments: FileAttachmentInput[];
  annotationAttachments: AnnotationAttachmentInput[];
  screenshotAttachment: ScreenshotAttachmentInput | null | undefined;
  isFirstMessage: boolean;
  task: TaskInput | null | undefined;
  subscribeToThread: boolean;
  sendNotifications?: boolean;
};

// Very nearly named this function 'executeRandomBagOf...' What we have here is
// a long list of discrete tasks that all need to be done when a new message
// comes rolling in to our system. Messages can be created via GraphQL from
// users using our UIs, via mirroring Slack conversations, by reply to Cord
// notification emails, or they can be injected via REST API. I'm sure there
// will be other ways to create them soon, too. This function has grown by
// accretion over the course of years, so there's not much 'design' to it. It
// just does each of the things one after another.
export async function executeNewMessageCreationTasks({
  context,
  flagsUser,
  application,
  page,
  thread,
  message,
  fileAttachments,
  annotationAttachments,
  screenshotAttachment,
  isFirstMessage,
  task,
  subscribeToThread,
  sendNotifications = true,
}: ExecuteNewMessageCreationTasksArgs): Promise<void> {
  await addNewMessageAttachments(
    context,
    message,
    fileAttachments,
    annotationAttachments,
    screenshotAttachment,
  );

  let taskAssigneeUserIDs: UUID[] = [];
  if (task) {
    taskAssigneeUserIDs = await addNewMessageTasks(
      context.session.viewer,
      context.loaders,
      task,
      message.id,
    );
  }

  const mentionedUserIDs = await createMessageMentions(
    context,
    message.id,
    message.content,
  );

  if (sendNotifications) {
    await maybeNotifyReferencedUsers(
      context,
      flagsUser,
      application,
      page,
      thread,
      message,
      mentionedUserIDs,
      taskAssigneeUserIDs,
      fileAttachments,
      isFirstMessage,
      subscribeToThread,
      screenshotAttachment?.blurredScreenshotFileID ||
        screenshotAttachment?.screenshotFileID ||
        undefined,
    );
  }

  const showActivationNux = await getFeatureFlagValue(
    'show_activation_welcome_message_nux',
    flagsUser,
  );

  if (showActivationNux) {
    const userID = assertViewerHasUser(context.session.viewer);
    // Dismiss the activation NUX when user sends their first message
    const userPreferenceMutator = new UserPreferenceMutator(
      context.session.viewer,
    );
    await userPreferenceMutator.setPreferenceForUser(
      userID,
      ACTIVATION_FIRST_MESSAGE_SENT,
      true,
    );
  }
  // These pubsub events are in the same transaction so we can correctly publish
  // the events after the transaction is completed resulting in the 'thread-message-added'
  // event containing the correct state of thread participants.
  await getSequelize().transaction(async (transaction) => {
    // We want the pubsub event for 'thread-message-added' to be published
    // before the one for 'thread-participants-updated-incremental' to prevent
    // the UI flickering from showing the 'Seen by X' and then being immediately
    // replaced with a new message.

    await publishNewMessageEvents(
      application,
      page,
      thread,
      message,
      isFirstMessage,
      annotationAttachments.length > 0,
      mentionedUserIDs,
      context,
      transaction,
    );

    await markThreadSeenForViewer(
      context.session.viewer,
      thread.id,
      transaction,
    );
  });

  await maybeUnresolveThread(context, thread, message);

  await scheduleGenerateLinkPreviews(context, message);
}

// Similar function as the one above, but for when a message gets updated.
export async function executeUpdateMessageTasks({
  context,
  message,
  thread,
  task,
  fileAttachments,
  annotationAttachments,
  wasDeletedOrUndeleted,
  authorUpdated,
  content,
  originalSubscribers,
}: {
  context: RequestContext;
  message: MessageEntity;
  thread: ThreadEntity;
  fileAttachments?: FileAttachmentInput[] | null;
  annotationAttachments?: AnnotationAttachmentInput[] | null;
  task?: TaskInput | null;
  wasDeletedOrUndeleted: boolean;
  authorUpdated?: boolean;
  content?: MessageContent | null;
  originalSubscribers: Set<UUID>;
}) {
  const viewer = context.session.viewer;
  let updateAnnotationsOnPage = false;

  // Checks if attachments are being updated
  if (fileAttachments && annotationAttachments) {
    const attachmentsUpdated = await updateMessageAttachments(
      context,
      message,
      fileAttachments,
      annotationAttachments,
    );

    if (attachmentsUpdated) {
      updateAnnotationsOnPage = true;
    }
  }

  let newTaskAssigneeUserIDs: UUID[] = [];
  let removedTaskAssigneeUserIDs: UUID[] = [];

  if (task !== undefined) {
    ({
      newTaskAssignees: newTaskAssigneeUserIDs,
      removedTaskAssignees: removedTaskAssigneeUserIDs,
    } = await updateMessageTask(context, message, task));
  }

  if (wasDeletedOrUndeleted) {
    const threadParticipationMutator = new ThreadParticipantMutator(
      viewer,
      context.loaders,
    );
    await threadParticipationMutator.updateLastUnseenMessageTimestamp(
      message.threadID,
      message.orgID,
    );
    const threadHasAnnotations =
      await context.loaders.messageAttachmentLoader.loadThreadHasAnnotations(
        message.threadID,
      );
    if (threadHasAnnotations) {
      updateAnnotationsOnPage = true;
    }
  }

  if (authorUpdated) {
    const threadHasAnnotations =
      await context.loaders.messageAttachmentLoader.loadThreadHasAnnotations(
        message.threadID,
      );
    if (threadHasAnnotations) {
      updateAnnotationsOnPage = true;
    }
  }

  const newUserReferenceIDs: UUID[] = [];
  let newMentionUserIDs: UUID[] = [];
  // if content was updated, checks and updates mentions
  if (content !== undefined && content !== null) {
    newMentionUserIDs = await updateMessageMentions(
      context,
      message.id,
      content,
    );
    newUserReferenceIDs.push(...newMentionUserIDs);
  }

  const page =
    await context.loaders.pageLoader.loadPrimaryPageForThreadNoOrgCheck(
      message.threadID,
    );

  if (newUserReferenceIDs.length > 0 || removedTaskAssigneeUserIDs.length > 0) {
    const threadParticipantMutator = new ThreadParticipantMutator(
      viewer,
      context.loaders,
    );
    await threadParticipantMutator.subscribeUsersToThread(
      message.threadID,
      newUserReferenceIDs,
    );
    await notifyReferencedUsers({
      context,
      message: message,
      page,
      mentionedUserIDs: newMentionUserIDs,
      taskAssigneeUserIDs: newTaskAssigneeUserIDs,
      removedTaskAssigneeUserIDs,
      fileAttachments,
    });
  }

  if (content !== undefined && content !== null) {
    await scheduleUpdateLinkPreviews(context, message);
  }

  publishUpdatedMessageEvents(
    context,
    thread,
    message,
    updateAnnotationsOnPage,
    newUserReferenceIDs,
    originalSubscribers,
  );
}

export async function executeAppendMessageContentTasks({
  context,
  message,
  appendedContent,
}: {
  context: RequestContext;
  message: MessageEntity;
  appendedContent: string;
}) {
  await scheduleUpdateLinkPreviews(context, message);
  publishAppendedMessageContentEvents(message, appendedContent);
}
