import { createContext } from 'react';

import type { Location, SharedToSlackInfo, UUID } from 'common/types/index.ts';
import type {
  InboxThreadFragment2Fragment,
  MessageFragment,
  ThreadFragment,
  UserFragment,
  ThreadParticipantFragment,
} from 'external/src/graphql/operations.ts';
import type { UpdateMessageFields } from 'external/src/context/threads2/actions/UpdateMessage.ts';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';
import type { SetPropertiesPayload } from 'external/src/context/threads2/actions/SetProperties.ts';
import type { MarkThreadsSeenPayload } from 'external/src/context/threads2/actions/MarkThreadsSeen.ts';
import type { ClientCreateMessage } from '@cord-sdk/types';

export type ThreadsLocation2 = 'chat' | 'inbox' | 'elsewhere';

export type ThreadData = Omit<
  ThreadFragment,
  'initialMessagesInclDeleted' | 'resolvedTimestamp'
> & {
  messages: MessageFragment[];
  hasNewMessages: boolean;
  olderMessagesCount: number;
  // We start a new message block at the start of each batch of messages queried
  firstMessageIDsOfLoad: Set<UUID>;
  participantsMap: Map<UUID, ThreadParticipantFragment>;
  resolvedTimestamp: Date | null;
};

export function threadFragmentToThreadData(thread: ThreadFragment): ThreadData {
  const hasNewMessages = thread.newMessagesCount > 0;
  const participantsMap = participantsToMap(thread.participants);

  // TODO (?) omit participants and just use participantsMap.  Update consumers
  // of participants (array) to use participantsMap (map)
  return {
    ...thread,
    messages: thread.initialMessagesInclDeleted,
    olderMessagesCount:
      thread.allMessagesCount - thread.initialMessagesInclDeleted.length,
    hasNewMessages,
    firstMessageIDsOfLoad: thread.initialMessagesInclDeleted[0]
      ? new Set(thread.initialMessagesInclDeleted[0].id)
      : new Set(),
    participantsMap,
    resolvedTimestamp: thread.resolvedTimestamp
      ? new Date(thread.resolvedTimestamp)
      : null,
  };
}

export function inboxThreadFragmentToThreadData(
  thread: InboxThreadFragment2Fragment & {
    typingUsers: Array<UserFragment>;
  },
): ThreadData {
  const hasNewMessages = thread.newMessagesCount > 0;
  const participantsMap = participantsToMap(thread.participants);

  return {
    ...thread,
    resolvedTimestamp: thread.resolvedTimestamp
      ? new Date(thread.resolvedTimestamp)
      : null,
    olderMessagesCount: thread.allMessagesCount - thread.messages.length,
    hasNewMessages,
    subscribed: true,
    viewerIsThreadParticipant: true,
    firstMessageIDsOfLoad: thread.messages[0]
      ? new Set(thread.messages[0].id)
      : new Set(),
    replyingUserIDs: thread.replyingUserIDs,
    actionMessageReplyingUserIDs: thread.actionMessageReplyingUserIDs,
    location: thread.location,
    extraClassnames: thread.extraClassnames,
    participantsMap,
  };
}

export type ThreadsState = {
  // threadIDs contains the list of threads *in sorted order*, based on the
  // sorting criteria.  It should be equal to the keys of threadsData and a
  // subset of the values of externalIDMap.
  threadIDs: UUID[];
  // A list of the thread IDs that we've added via mergeOptimisticMessage and
  // thus need to be merged into lists that are coming from the server.  It is a
  // subset of threadIDs.
  localOnlyThreadIDs: UUID[];
  // threadsData contains all the threads that have been loaded, in arbitrary
  // order.  The keys are equal to threadIDs and a subset of externalIDMap.
  threadsData: {
    [threadID in UUID]: ThreadData;
  };
  // externalIDMap contains a map from externalIDs to internal IDs, including
  // preallocated IDs for which no thread yet exists.  It's a superset of
  // threadIDs and the keys of threadsData.
  externalIDMap: {
    [externalID in string]: UUID;
  };
  // Map the external ID of all messages that we know about to the internal ID
  // of their thread. This lets us try to find the cached thread (and thus the
  // cached message) knowing only the message's external ID.
  messageExternalIDMap: {
    [externalID in string]: UUID;
  };
  location: ThreadsLocation2;
  draftMessageInComposer: boolean;
};

// Don't store threadsData in ThreadsContext, because it changes too often and
// would cause too many unnecessary rerenders across all threads. We instead
// surface it on ThreadContext for each thread.
export type ThreadsContextType = Omit<
  ThreadsState,
  'threadsData' | 'threadIDs' | 'externalIDMap' | 'messageExternalIDMap'
> & {
  threadIDsWithUndeletedMessages: UUID[];
  threadIDsWithMessagesIncludingDeleted: UUID[];

  setDraftMessageInComposer: (draftMessageInComposer: boolean) => void;
  resolvedThreadIDsSet: Set<UUID>;
  /**
   * Returns an up-to-date ref of the thread. Note: do not use this function if
   * you need changes in the thread to cause re-renders of your React
   * component. In that case you should access the thread data via
   * Thread2Context, or failing that ThreadsDataContext2
   */
  getThreadUpdatingRef: (threadID: UUID) => { current: ThreadData | null };
  addReaction: (
    threadID: UUID,
    messageID: UUID,
    unicodeReaction: string,
  ) => void;
  addThread: (
    newThreadID: UUID,
    externalID: string,
    message: MessageFragment,
    location: Location,
    name: string,
  ) => void;
  markThreadSeen: (threadID: UUID) => void;
  clearNotificationsForMessage: (messageID: UUID) => void;
  markThreadsSeenLocally: (
    input: Omit<MarkThreadsSeenPayload, 'viewer'>,
  ) => void;
  mergeMessage: (
    threadID: UUID,
    message: MessageFragment,
    isNewMessage: boolean,
  ) => void;
  mergeOptimisticMessage: (
    externalThreadID: string,
    messageID: UUID,
    message: ClientCreateMessage,
  ) => () => void;
  mergeThread: (thread: ThreadData) => void;
  removeMessage: (threadID: UUID, messageID: UUID) => void;
  removeReaction: (
    threadID: UUID,
    message: MessageFragment,
    unicodeReaction: string,
  ) => void;
  setMessages: (threadID: UUID, messages: MessageFragment[]) => void;
  mergeParticipant: (
    threadID: UUID,
    participant: ThreadParticipantFragment,
  ) => void;
  setResolved: (
    threadID: UUID,
    resolved: boolean,
    updateServer: boolean,
  ) => void;
  setSharedToSlack: (
    threadID: UUID,
    sharedToSlack: SharedToSlackInfo | null,
  ) => void;
  setSubscribed: (threadID: UUID, subscribed: boolean) => void;
  setName: (threadID: UUID, name: string) => void;
  setProperties: (
    threadID: UUID,
    properties: Omit<SetPropertiesPayload, 'id'>,
  ) => void;
  setThreads: (threads: ThreadData[]) => void;
  setTypingUsers: (threadID: UUID, typingUsers: UserFragment[]) => void;
  updateMessage: (
    threadID: UUID,
    updateMessageFields: Partial<UpdateMessageFields>,
  ) => void;
  appendMessageContent: (
    threadID: UUID,
    messageID: UUID,
    appendedContent: string,
  ) => void;
  loadOlderMessages: (
    threadID: UUID,
    messageCount: number,
  ) => Promise<MessageFragment[]>;
  loadMessagesFrom: (
    threadID: UUID,
    messageID: UUID,
  ) => Promise<MessageFragment[]>;
  reorderThreads: () => UUID[];
  getThreadByExternalID: (externalThreadID: string) => ThreadData | undefined;
  addExternalIDMapping: (externalThreadID: string, threadID: UUID) => void;
  getThreadByExternalMessageID: (
    externalMessageID: string | undefined,
  ) => ThreadData | undefined;
  removeThread: (threadID: UUID) => void;
};
export const ThreadsContext2 = createContext<
  ThreadsContextType | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);

export function ThreadsInitialState({
  location,
}: {
  location: ThreadsLocation2;
}): ThreadsState {
  return {
    threadIDs: [],
    localOnlyThreadIDs: [],
    threadsData: {},
    externalIDMap: {},
    messageExternalIDMap: {},
    location,
    draftMessageInComposer: false,
  };
}

export type ThreadsDataContextType = { [threadID: UUID]: ThreadData };

export const ThreadsDataContext2 = createContext<
  ThreadsDataContextType | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);

export const participantsToMap = (
  participants: ThreadParticipantFragment[],
) => {
  const participantsMap = new Map<UUID, ThreadParticipantFragment>();
  participants.forEach((p) => {
    if (p.user?.id) {
      participantsMap.set(p.user?.id, p);
    }
  });
  return participantsMap;
};
