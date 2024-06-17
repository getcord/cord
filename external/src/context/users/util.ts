import type { Nullable, UUID } from 'common/types/index.ts';
import { isDefined, isNotNull } from 'common/util/index.ts';
import type {
  InboxThreadFragment2Fragment,
  MessageFragment,
  TaskFragment,
  ThreadFragment,
  UserFragment,
} from 'external/src/graphql/operations.ts';

export function extractUsersFromList(
  userHolders: {
    user: Nullable<UserFragment>;
  }[],
): UserFragment[] {
  return userHolders.map((uh) => uh.user).filter(isNotNull);
}

export function extractUsersFromThread2(
  thread: ThreadFragment,
  addUsers: (...users: UserFragment[]) => void,
  requestUsers: (...ids: UUID[]) => void,
): void {
  extractUsersFromThreadLike(thread, addUsers, requestUsers);
}

export function extractUsersFromInboxThread2(
  thread: InboxThreadFragment2Fragment,
  addUsers: (...users: UserFragment[]) => void,
  requestUsers: (...ids: UUID[]) => void,
): void {
  extractUsersFromThreadLike(
    {
      ...thread,
      initialMessagesInclDeleted: thread.messages,
    },
    addUsers,
    requestUsers,
  );
}

type ThreadLike = Pick<
  ThreadFragment,
  | 'initialMessagesInclDeleted'
  | 'participants'
  | 'replyingUserIDs'
  | 'typingUsers'
  | 'mentioned'
  | 'actionMessageReplyingUserIDs'
>;

function extractUsersFromThreadLike(
  thread: ThreadLike,
  addUsers: (...users: UserFragment[]) => void,
  requestUsers: (...ids: UUID[]) => void,
): void {
  addUsers(...thread.typingUsers);
  addUsers(...thread.mentioned);
  thread.initialMessagesInclDeleted.forEach((m) =>
    extractUsersFromMessage(m, addUsers, requestUsers),
  );
  requestUsers(...thread.participants.map((p) => p.user?.id).filter(isDefined));
}

export function extractUsersFromMessage(
  message: MessageFragment,
  addUsers: (...users: UserFragment[]) => void,
  requestUsers: (...ids: UUID[]) => void,
): void {
  addUsers(message.source);
  addUsers(...extractUsersFromList(message.reactions));
  if (message.task) {
    extractUsersFromTask(message.task, addUsers, requestUsers);
  }
  requestUsers(...message.referencedUserData.map((rud) => rud.id));
}

function extractUsersFromTask(
  task: TaskFragment,
  addUsers: (...users: UserFragment[]) => void,
  _requestUsers: (...ids: UUID[]) => void,
): void {
  addUsers(...task.assignees.filter(isNotNull));
  if (task.doneStatusLastUpdatedBy) {
    addUsers(task.doneStatusLastUpdatedBy);
  }
}
