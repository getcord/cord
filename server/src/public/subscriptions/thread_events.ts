import { pubSubAsyncIterator } from 'server/src/pubsub/index.ts';
import {
  ThreadMessageAddedTypeName,
  ThreadMessageUpdatedTypeName,
  ThreadMessageContentAppendedTypeName,
  ThreadMessageRemovedTypeName,
  ThreadTypingUsersUpdatedTypeName,
  ThreadShareToSlackTypeName,
  ThreadPropertiesUpdatedTypeName,
  ThreadParticipantsUpdatedIncrementalTypeName,
  ThreadCreatedTypeName,
  ThreadSubscriberUpdatedTypeName,
  ThreadDeletedTypeName,
} from 'common/types/index.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const threadEventsSubscriptionResolver: Resolvers['Subscription']['threadEvents'] =
  {
    resolve: (payload) => payload,
    subscribe: (_root, { threadID }) =>
      pubSubAsyncIterator(
        // this must map to the ThreadEvents type definition in mapping.ts
        ['thread-created', { threadID }],
        ['thread-message-added', { threadID }],
        ['thread-message-updated', { threadID }],
        ['thread-message-content-appended', { threadID }],
        ['thread-message-removed', { threadID }],
        ['thread-participants-updated-incremental', { threadID }],
        ['thread-typing-users-updated', { threadID }],
        ['thread-properties-updated', { threadID }],
        ['thread-share-to-slack', { threadID }],
        ['thread-subscriber-updated', { threadID }],
        ['thread-deleted', { threadID }],
      ),
  };

export const threadEventTypeResolver: Resolvers['ThreadEvent'] = {
  __resolveType: (event) => {
    switch (event.name) {
      case 'thread-created':
        return ThreadCreatedTypeName;
      case 'thread-message-added':
        return ThreadMessageAddedTypeName;
      case 'thread-message-updated':
        return ThreadMessageUpdatedTypeName;
      case 'thread-message-content-appended':
        return ThreadMessageContentAppendedTypeName;
      case 'thread-message-removed':
        return ThreadMessageRemovedTypeName;
      case 'thread-participants-updated-incremental':
        return ThreadParticipantsUpdatedIncrementalTypeName;
      case 'thread-typing-users-updated':
        return ThreadTypingUsersUpdatedTypeName;
      case 'thread-share-to-slack':
        return ThreadShareToSlackTypeName;
      case 'thread-properties-updated':
        return ThreadPropertiesUpdatedTypeName;
      case 'thread-subscriber-updated':
        return ThreadSubscriberUpdatedTypeName;
      case 'thread-deleted':
        return ThreadDeletedTypeName;
    }
  },
};
