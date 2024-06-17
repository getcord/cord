import { useEffect } from 'react';

import {
  ThreadsContext2,
  threadFragmentToThreadData,
} from 'external/src/context/threads2/ThreadsContext2.tsx';
import { useThreadEventsSubscription } from 'external/src/graphql/operations.ts';
import type { UUID } from 'common/types/index.ts';
import {
  ThreadMessageAddedTypeName,
  ThreadMessageRemovedTypeName,
  ThreadMessageUpdatedTypeName,
  ThreadMessageContentAppendedTypeName,
  ThreadPropertiesUpdatedTypeName,
  ThreadParticipantsUpdatedIncrementalTypeName,
  ThreadShareToSlackTypeName,
  ThreadTypingUsersUpdatedTypeName,
  ThreadCreatedTypeName,
  ThreadSubscriberUpdatedTypeName,
  ThreadDeletedTypeName,
} from 'common/types/index.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import {
  extractUsersFromMessage,
  extractUsersFromThread2,
} from 'external/src/context/users/util.ts';

export function ThreadSubscriber({ threadID }: { threadID: UUID }) {
  const {
    mergeThread,
    mergeMessage,
    removeMessage,
    removeThread,
    mergeParticipant,
    setProperties,
    setSharedToSlack,
    setTypingUsers,
    updateMessage,
    appendMessageContent,
    localOnlyThreadIDs,
  } = useContextThrowingIfNoProvider(ThreadsContext2);

  const { data: subscriptionData } = useThreadEventsSubscription({
    skip: localOnlyThreadIDs.includes(threadID),
    variables: {
      threadID,
    },
  });

  const { user } = useContextThrowingIfNoProvider(IdentityContext);
  const {
    addUsers,
    byInternalID: { requestUsers },
  } = useContextThrowingIfNoProvider(UsersContext);

  useEffect(() => {
    if (subscriptionData) {
      const type = subscriptionData.threadEvents.__typename;
      switch (type) {
        case ThreadCreatedTypeName: {
          extractUsersFromThread2(
            subscriptionData.threadEvents.thread,
            addUsers,
            requestUsers,
          );
          mergeThread(
            threadFragmentToThreadData(subscriptionData.threadEvents.thread),
          );
          break;
        }
        case ThreadMessageAddedTypeName: {
          extractUsersFromMessage(
            subscriptionData.threadEvents.message,
            addUsers,
            requestUsers,
          );
          mergeMessage(threadID, subscriptionData.threadEvents.message, true);
          break;
        }
        case ThreadMessageUpdatedTypeName: {
          extractUsersFromMessage(
            subscriptionData.threadEvents.message,
            addUsers,
            requestUsers,
          );
          updateMessage(threadID, subscriptionData.threadEvents.message);
          break;
        }
        case ThreadMessageContentAppendedTypeName: {
          appendMessageContent(
            threadID,
            subscriptionData.threadEvents.id,
            subscriptionData.threadEvents.appendedContent,
          );
          break;
        }
        case ThreadTypingUsersUpdatedTypeName: {
          addUsers(...subscriptionData.threadEvents.users);
          setTypingUsers(
            threadID,
            subscriptionData.threadEvents.users.filter(
              (typingUser) => typingUser.id !== user?.id,
            ),
          );
          break;
        }
        case ThreadParticipantsUpdatedIncrementalTypeName: {
          mergeParticipant(threadID, subscriptionData.threadEvents.participant);
          break;
        }
        case ThreadSubscriberUpdatedTypeName: {
          mergeParticipant(threadID, subscriptionData.threadEvents.subscriber);
          break;
        }
        case ThreadMessageRemovedTypeName: {
          removeMessage(threadID, subscriptionData.threadEvents.id);
          break;
        }
        case ThreadPropertiesUpdatedTypeName: {
          setProperties(threadID, {
            ...subscriptionData.threadEvents.thread,
            resolvedTimestamp: subscriptionData.threadEvents.thread
              .resolvedTimestamp
              ? new Date(subscriptionData.threadEvents.thread.resolvedTimestamp)
              : null,
          });
          break;
        }
        case ThreadShareToSlackTypeName: {
          setSharedToSlack(threadID, subscriptionData.threadEvents.info);
          break;
        }
        case ThreadDeletedTypeName: {
          removeThread(subscriptionData.threadEvents.id);
          break;
        }
        default: {
          const _: never = type;
          console.warn(
            'Unhandled channel event',
            subscriptionData.threadEvents,
          );
        }
      }
    }
  }, [
    addUsers,
    requestUsers,
    mergeThread,
    mergeMessage,
    removeMessage,
    setSharedToSlack,
    setTypingUsers,
    setProperties,
    subscriptionData,
    threadID,
    updateMessage,
    appendMessageContent,
    user?.id,
    mergeParticipant,
    removeThread,
  ]);

  return null;
}
