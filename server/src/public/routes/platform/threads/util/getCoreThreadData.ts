import type { CoreThreadData } from '@cord-sdk/types';
import type { RequestContextLoaders } from 'server/src/RequestContextLoaders.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import type { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import {
  loadUserMessagesCount,
  loadActionMessagesCount,
  loadDeletedMessagesCount,
  loadRepliers,
  loadActionMessageRepliers,
  loadParticipants,
  loadSubscribers,
  loadMentioned,
  loadTypingUsers,
  getThreadLocation,
} from 'server/src/public/routes/platform/threads/GetThreadHandler.ts';

export async function getCoreThreadData(
  loaders: RequestContextLoaders,
  thread: ThreadEntity,
): Promise<CoreThreadData> {
  const [
    org,
    total,
    userMessages,
    actionMessages,
    deletedMessages,
    repliers,
    actionMessageRepliers,
    participants,
    subscribers,
    mentioned,
    typing,
    location,
  ] = await Promise.all([
    OrgEntity.findByPk(thread.orgID),
    MessageEntity.count({ where: { threadID: thread.id } }),
    loadUserMessagesCount(thread.id),
    loadActionMessagesCount(thread.id),
    loadDeletedMessagesCount(thread.id),
    loadRepliers(loaders.threadLoader, thread.id),
    loadActionMessageRepliers(loaders.threadLoader, thread.id),
    loadParticipants(thread.id),
    loadSubscribers(thread.id),
    loadMentioned(thread.id),
    loadTypingUsers(thread.id),
    getThreadLocation(thread),
  ]);

  if (!org) {
    throw new Error('Unable to find thread org');
  }

  return {
    id: thread.externalID,
    organizationID: org.externalID,
    groupID: org.externalID,
    total,
    userMessages,
    actionMessages,
    deletedMessages,
    resolved: !!thread.resolvedTimestamp,
    resolvedTimestamp: thread.resolvedTimestamp,
    participants,
    repliers,
    actionMessageRepliers,
    subscribers,
    mentioned,
    typing,
    name: thread.name,
    url: thread.url,
    location,
    metadata: thread.metadata,
    extraClassnames: thread.extraClassnames,
  };
}
