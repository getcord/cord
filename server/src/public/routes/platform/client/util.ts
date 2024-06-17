import type { UUID } from '@cord-sdk/types';
import { getMentionedUserIDs } from 'common/util/index.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import type {
  ThreadFragment,
  UserFragment,
} from 'server/src/schema/operations.ts';
import { executeUsersQuery } from 'server/src/schema/operations.ts';

export function collectNeededUserIDs(thread: ThreadFragment): UUID[] {
  const users = new Set<UUID>();
  thread.replyingUserIDs.forEach((u) => users.add(u));
  thread.actionMessageReplyingUserIDs.forEach((u) => users.add(u));
  thread.initialMessagesInclDeleted.forEach((m) =>
    getMentionedUserIDs(m.content ?? []).forEach((u) => users.add(u)),
  );
  return [...users];
}

export async function getUserByInternalIdFunction(
  context: RequestContext,
  userIDs: UUID[],
): Promise<(id: UUID) => UserFragment | undefined> {
  const userGraphQL = await executeUsersQuery({
    context,
    variables: {
      ids: userIDs,
    },
  });

  const users = new Map<UUID, UserFragment>();
  userGraphQL.users.forEach((u) => users.set(u.id, u));
  return (id: UUID) => users.get(id);
}
