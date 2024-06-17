import type { FileAttachmentInput, UUID } from 'common/types/index.ts';
import type { NotificationReplyAction } from '@cord-sdk/types';

export function getNotificationReplyActions({
  userID,
  taskAssigneeUserIDs,
  mentionedUserIDs,
  fileAttachments,
  removedTaskAssigneeUserIDs,
  isFirstMessageInThread = false,
}: {
  userID: UUID;
  taskAssigneeUserIDs: UUID[];
  mentionedUserIDs: UUID[];
  fileAttachments: FileAttachmentInput[];
  removedTaskAssigneeUserIDs?: UUID[];
  isFirstMessageInThread?: boolean;
}) {
  const actions: NotificationReplyAction[] = [];
  if (taskAssigneeUserIDs.includes(userID)) {
    actions.push('assign-task');
  }
  if (mentionedUserIDs.includes(userID)) {
    actions.push('mention');
  }
  if (fileAttachments.length > 0) {
    actions.push('attach-file');
  }
  if (isFirstMessageInThread) {
    actions.push('create-thread');
  } else if (removedTaskAssigneeUserIDs?.includes(userID)) {
    actions.push('unassign-task');
  }
  return actions;
}
