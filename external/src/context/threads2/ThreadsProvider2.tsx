import {
  useCallback,
  useContext as unsafeUseContext,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import { sort } from 'radash';
import { isEqual } from '@cord-sdk/react/common/lib/fast-deep-equal.ts';

import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';
import ThreadsReducer from 'external/src/context/threads2/ThreadsReducer.tsx';
import type {
  ThreadData,
  ThreadsLocation2,
} from 'external/src/context/threads2/ThreadsContext2.tsx';
import {
  ThreadsContext2,
  ThreadsDataContext2,
  ThreadsInitialState,
} from 'external/src/context/threads2/ThreadsContext2.tsx';
import { createReactionPayload } from 'external/src/components/threads/util.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { threadsAction } from 'external/src/context/threads2/actions/index.ts';
import type { Location, SharedToSlackInfo, UUID } from 'common/types/index.ts';
import {
  useLazyOlderThreadMessagesQuery,
  useCreateMessageReactionMutation,
  useDeleteMessageReactionMutation,
  useMarkThreadSeenMutation,
  useSetSubscribedMutation,
  useSetThreadResolvedMutation,
  useLazyLoadMessagesToDeepLinkedMessageQuery,
  useClearNotificationsForMessageMutation,
} from 'external/src/graphql/operations.ts';
import type {
  MessageFragment,
  ThreadParticipantFragment,
  UserFragment,
} from 'external/src/graphql/operations.ts';
import type { UpdateMessageFields } from 'external/src/context/threads2/actions/UpdateMessage.ts';
import { ThreadSubscriber } from 'external/src/components/2/ThreadSubscriber.tsx';
import {
  batchReactUpdates,
  isUserAuthorOfMessage,
  getThreadLatestTimestamp,
  doNothing,
} from 'external/src/lib/util.ts';
import { useUpdatingRef } from 'external/src/effects/useUpdatingRef.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { extractUsersFromMessage } from 'external/src/context/users/util.ts';
import { useReffedFns } from 'external/src/effects/useReffedFns.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { externalizeID, extractInternalID } from 'common/util/externalIDs.ts';
import { useMemoObject } from '@cord-sdk/react/hooks/useMemoObject.ts';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';
import type { SetPropertiesPayload } from 'external/src/context/threads2/actions/SetProperties.ts';
import type { MarkThreadsSeenPayload } from 'external/src/context/threads2/actions/MarkThreadsSeen.ts';
import type { ClientCreateMessage } from '@cord-sdk/types';
import { internalizeMessageContent_ONLY_BEST_EFFORT } from 'common/util/convertToExternal/thread.ts';

type ThreadUpdatingRefs = {
  [threadID: UUID]: { current: ThreadData | null };
};

export function ThreadsProvider2({
  location,
  children,
}: React.PropsWithChildren<{ location: ThreadsLocation2 }>) {
  const { user } = useContextThrowingIfNoProvider(IdentityContext);
  const { organization } = useContextThrowingIfNoProvider(OrganizationContext);
  const {
    addUsers,
    byInternalID: { requestUsers },
    byExternalID: { userByID: userByExternalID },
  } = useContextThrowingIfNoProvider(UsersContext);

  const logger = useLogger();
  const { logError, logEvent } = logger;

  // This will exist if we're in Inbox, as we maintain the Conversation ThreadsContext
  const threadsContextAboveThisOne = unsafeUseContext(ThreadsContext2);

  const [state, dispatch] = useReducer(
    ThreadsReducer,
    ThreadsInitialState({
      location,
    }),
  );

  // To avoid callbacks redefining on any change to state
  const stateRefForCallbacks = useUpdatingRef(state);

  // LOCAL-ONLY METHODS
  const addThread = useCallback(
    (
      newThreadID: UUID,
      externalID: string,
      message: MessageFragment,
      threadLocation: Location,
      threadName: string,
    ) => {
      // We should never be adding threads without having the user's
      // organization loaded, so this should be a no-op
      if (organization) {
        dispatch(
          threadsAction.addThread({
            newThreadID,
            externalID,
            orgID: organization.id,
            externalOrgID: organization.externalID,
            message,
            location: threadLocation,
            name: threadName,
          }),
        );
      }
    },
    [organization],
  );

  const mergeMessage = useCallback(
    (threadID: UUID, message: MessageFragment, isNewMessage: boolean) =>
      dispatch(
        threadsAction.mergeMessage({
          threadID,
          message,
          viewerIsAuthor: isUserAuthorOfMessage(message, user?.externalID),
          isNewMessage,
        }),
      ),
    [user?.externalID],
  );

  const mergeThread = useCallback(
    (thread: ThreadData) => dispatch(threadsAction.mergeThread({ thread })),
    [],
  );

  const removeThread = useCallback(
    (threadID: UUID) => dispatch(threadsAction.removeThread({ threadID })),
    [],
  );

  const removeMessage = useCallback(
    (threadID: UUID, messageID: UUID) =>
      dispatch(threadsAction.removeMessage({ threadID, messageID })),
    [],
  );

  const setDraftMessageInComposer = useCallback(
    (draftMessageInComposer: boolean) => {
      dispatch(
        threadsAction.setDraftMessageInComposer({ draftMessageInComposer }),
      );
    },
    [],
  );

  const setMessages = useCallback(
    (threadID: UUID, messages: MessageFragment[]) =>
      dispatch(threadsAction.setMessages({ threadID, messages })),
    [],
  );

  const setOlderMessagesCount = useCallback(
    (threadID: UUID, olderMessagesCount: number) =>
      dispatch(
        threadsAction.setOlderMessagesCount({ threadID, olderMessagesCount }),
      ),
    [],
  );

  const mergeParticipant = useCallback(
    (threadID: UUID, participant: ThreadParticipantFragment) =>
      dispatch(threadsAction.mergeParticipant({ threadID, participant })),
    [],
  );

  const setSharedToSlack = useCallback(
    (threadID: UUID, sharedToSlack: SharedToSlackInfo | null) =>
      dispatch(threadsAction.setSharedToSlack({ threadID, sharedToSlack })),
    [],
  );

  const setThreads = useCallback(
    (threads: ThreadData[]) => dispatch(threadsAction.setThreads(threads)),
    [],
  );

  const setTypingUsers = useCallback(
    (threadID: UUID, typingUsers: UserFragment[]) =>
      dispatch(threadsAction.setTypingUsers({ threadID, typingUsers })),
    [],
  );

  const updateMessage = useCallback(
    (threadID: UUID, updateMessageFields: Partial<UpdateMessageFields>) =>
      dispatch(
        threadsAction.updateMessage({ threadID, ...updateMessageFields }),
      ),
    [],
  );

  const appendMessageContent = useCallback(
    (threadID: UUID, messageID: UUID, appendedContent: string) =>
      dispatch(
        threadsAction.appendMessageContent({
          threadID,
          messageID,
          appendedContent,
          logger,
        }),
      ),
    [logger],
  );

  const getThreadByExternalID = useCallback(
    (externalThreadID: string) => {
      const cordThreadID = extractInternalID(externalThreadID);
      if (cordThreadID) {
        return state.threadsData[cordThreadID];
      }

      if (externalThreadID in state.externalIDMap) {
        return state.threadsData[state.externalIDMap[externalThreadID]];
      }
      return undefined;
    },
    [state.threadsData, state.externalIDMap],
  );

  const addExternalIDMapping = useCallback(
    (externalThreadID: string, threadID: UUID) => {
      dispatch(
        threadsAction.addExternalIDMapping({ externalThreadID, threadID }),
      );
    },
    [],
  );

  const optimisticAddCounter = useRef(1);

  const mergeOptimisticMessage = useCallback(
    (
      externalThreadID: string,
      messageID: UUID,
      message: ClientCreateMessage,
    ) => {
      const existingThreadID: string | undefined =
        stateRefForCallbacks.current.externalIDMap[externalThreadID];
      const existingThread: ThreadData | undefined =
        stateRefForCallbacks.current.threadsData[existingThreadID];
      if (!existingThread && !message.createThread) {
        // Two possible cases where the thread isn't in the cache and
        // createThread isn't set:
        //
        // * The thread already exists but isn't being viewed here
        // * The thread doesn't exist and this is going to fail on the backend
        //
        // In both cases, we don't need an optimistic update, so ignore it
        return doNothing;
      }

      const messageFragment: MessageFragment = {
        __typename: 'Message',
        id: messageID,
        content: internalizeMessageContent_ONLY_BEST_EFFORT(
          message.content,
          userByExternalID,
        ),
        url: message.url ?? null,
        externalID: message.id ?? externalizeID(messageID),
        source: user,
        attachments: [],
        seen: true,
        reactions: [],
        timestamp: new Date().toISOString(),
        deletedTimestamp: null,
        lastUpdatedTimestamp: null,
        importedFromSlackChannel: null,
        referencedUserData: [],
        task: null,
        importedSlackMessageType: null,
        slackURL: null,
        isFromEmailReply: false,
        type: 'user_message',
        iconURL: message.iconURL ?? null,
        translationKey: message.translationKey ?? null,
        metadata: message.metadata ?? {},
        seenBy: [{ externalID: user.externalID }],
        extraClassnames: message.extraClassnames ?? null,
        skipLinkPreviews: false,
      };

      if (existingThread) {
        mergeMessage(existingThreadID, messageFragment, true);
        return () => {
          removeMessage(existingThreadID, messageID);
        };
      } else {
        if (!message.createThread!.groupID && !organization) {
          // If they didn't provide a group ID, it will get rejected on the
          // backend, so don't bother trying to add it optimistically
          return doNothing;
        }
        const externalOrgID = (message.createThread!.groupID ??
          organization?.externalID)!;
        // This is really painful, but if they send a message for a different
        // group than they're logged in as, we don't have any idea what the
        // orgID is.  Happily, we only ever really use this value for stuff like
        // figuring out if we can share via Slack, which are really unlikely to
        // come into play before we get the real org ID from the backend.
        const orgID =
          organization?.externalID === externalOrgID
            ? organization.id
            : `optimistic-${optimisticAddCounter.current++}`;
        const newThreadID = `optimistic-${optimisticAddCounter.current++}`;
        dispatch(
          threadsAction.addThread({
            newThreadID,
            externalID: externalThreadID,
            orgID,
            externalOrgID,
            message: messageFragment,
            location: message.createThread!.location,
            name: message.createThread!.name,
          }),
        );
        return () => {
          removeThread(newThreadID);
        };
      }
    },
    [
      mergeMessage,
      organization,
      removeMessage,
      removeThread,
      stateRefForCallbacks,
      user,
      userByExternalID,
    ],
  );

  const getThreadByExternalMessageID = useCallback(
    (externalMessageID: string | undefined) => {
      if (!externalMessageID) {
        return undefined;
      }

      const threadID = state.messageExternalIDMap[externalMessageID];
      if (!threadID) {
        return undefined;
      }

      return state.threadsData[threadID];
    },
    [state.messageExternalIDMap, state.threadsData],
  );

  const reorderThreads = useCallback(() => {
    const orderedThreadIDs = sort(
      Object.values(stateRefForCallbacks.current.threadsData),
      getThreadLatestTimestamp,
      true,
    ).map((thread) => thread.id);
    if (!isEqual(orderedThreadIDs, stateRefForCallbacks.current.threadIDs)) {
      dispatch(threadsAction.setThreadIDs(orderedThreadIDs));
    }
    return orderedThreadIDs;
  }, [stateRefForCallbacks]);

  // LOCAL & REMOTE UPDATE METHODS
  const [createReaction] = useCreateMessageReactionMutation();
  const [deleteReaction] = useDeleteMessageReactionMutation();
  const [markThreadSeenMutation] = useMarkThreadSeenMutation();
  const [clearNotificationsForMessageMutation] =
    useClearNotificationsForMessageMutation();
  const [setResolvedMutation] = useSetThreadResolvedMutation();
  const [setSubscribedMutation] = useSetSubscribedMutation();

  const addReaction = useCallback(
    (threadID: UUID, messageID: UUID, unicodeReaction: string) => {
      if (!user) {
        logError('User not found');
        return;
      }

      const reactionPayload = createReactionPayload({
        unicodeReaction,
        user,
        messageID,
        threadID,
      });

      dispatch(threadsAction.addReaction(reactionPayload));

      void createReaction({
        variables: {
          messageID,
          unicodeReaction,
        },
      });

      logEvent('reaction-added', {
        emoji: unicodeReaction,
      });
    },
    [createReaction, user, logError, logEvent],
  );

  const removeReaction = useCallback(
    (threadID: UUID, message: MessageFragment, unicodeReaction: string) => {
      const reactionToDelete = message.reactions.find(
        (r) => r.unicodeReaction === unicodeReaction && r.user?.id === user?.id,
      );
      if (reactionToDelete) {
        dispatch(
          threadsAction.removeReaction({
            threadID,
            messageID: message.id,
            reactionID: reactionToDelete.id,
          }),
        );
        logEvent('reaction-removed', {
          emoji: unicodeReaction,
        });
        void deleteReaction({
          variables: {
            messageID: message.id,
            reactionID: reactionToDelete.id,
          },
        });
      }
    },
    [deleteReaction, user?.id, logEvent],
  );

  // Just the local 'optimistic' update - can mark seen or unseen
  const markThreadsSeenLocally = useCallback(
    (input: Omit<MarkThreadsSeenPayload, 'viewer'>) => {
      batchReactUpdates(() => {
        dispatch(threadsAction.markThreadsSeen({ ...input, viewer: user }));
        // If thread is in Inbox, plus Conversation above, we need to mark as seen there too
        if (threadsContextAboveThisOne !== NO_PROVIDER_DEFINED) {
          threadsContextAboveThisOne.markThreadsSeenLocally(input);
        }
      });
    },
    [threadsContextAboveThisOne, user],
  );

  // The local optimistic update plus the mutation
  const markThreadSeen = useCallback(
    (threadID: UUID) => {
      const thread = stateRefForCallbacks.current.threadsData[threadID];
      if (thread) {
        markThreadsSeenLocally({
          externalThreadID: thread.externalID,
          seen: true,
          filter: {},
        });
      }
      void markThreadSeenMutation({
        variables: { threadID },
      });
    },
    [stateRefForCallbacks, markThreadsSeenLocally, markThreadSeenMutation],
  );

  const clearNotificationsForMessage = useCallback(
    (messageID: UUID) => {
      void clearNotificationsForMessageMutation({
        variables: { messageID, byExternalID: false },
      });
    },
    [clearNotificationsForMessageMutation],
  );

  const setResolved = useCallback(
    (threadID: UUID, resolved: boolean, updateServer: boolean) => {
      dispatch(
        threadsAction.setProperties({
          id: threadID,
          resolved,
          resolvedTimestamp: resolved ? new Date() : null,
        }),
      );
      if (updateServer) {
        logEvent(resolved ? 'thread-resolved' : 'thread-unresolved', {
          threadID,
        });
        void setResolvedMutation({ variables: { resolved, threadID } });
      }
    },
    [logEvent, setResolvedMutation],
  );

  const setSubscribed = useCallback(
    (threadID: UUID, subscribed: boolean) => {
      dispatch(threadsAction.setSubscribed({ threadID, subscribed }));
      void setSubscribedMutation({
        variables: {
          subscribed,
          threadID: threadID,
        },
      });
    },
    [setSubscribedMutation],
  );

  const setName = useCallback((threadID: UUID, name: string) => {
    dispatch(threadsAction.setProperties({ id: threadID, name }));
  }, []);

  const setProperties = useCallback(
    (threadID: UUID, properties: Omit<SetPropertiesPayload, 'id'>) => {
      dispatch(threadsAction.setProperties({ id: threadID, ...properties }));
    },
    [],
  );

  const [loadOlderMessagesQuery] = useLazyOlderThreadMessagesQuery();
  const [loadMessagesFromQuery] = useLazyLoadMessagesToDeepLinkedMessageQuery();

  // Update the thread context with older messages
  const updateMessages = useCallback(
    (
      threadID: UUID,
      messages: MessageFragment[],
      olderMessagesCount: number,
    ) => {
      batchReactUpdates(() => {
        // Minus one because we already have the first message
        // Max of 0 because we don't ever want -1 if there's no more messages
        olderMessagesCount = Math.max(0, olderMessagesCount - 1);
        const firstMessage = messages[0];
        if (firstMessage) {
          dispatch(
            threadsAction.addFirstMessageOfAPILoad({
              threadID,
              messageID: firstMessage.id,
            }),
          );
        }
        for (const message of messages) {
          mergeMessage(threadID, message, false);
        }
        setOlderMessagesCount(threadID, olderMessagesCount);
      });
    },
    [mergeMessage, setOlderMessagesCount],
  );

  const loadOlderMessages = useCallback(
    async (threadID: UUID, messageCount: number) => {
      try {
        const thread = stateRefForCallbacks.current.threadsData[threadID];
        const { data } = await loadOlderMessagesQuery({
          variables: {
            threadID,
            cursor: thread.messages[1]?.id ?? null,
            range: -messageCount,
            ignoreDeleted: false,
          },
        });
        if (!data) {
          throw new Error("Couldn't load older messages");
        }
        const { messages, olderMessagesCount } = data.thread.loadMessages;
        messages.map((m) => extractUsersFromMessage(m, addUsers, requestUsers));
        updateMessages(threadID, messages, olderMessagesCount);
        return messages;
      } catch {
        return [];
      }
    },
    [
      addUsers,
      loadOlderMessagesQuery,
      requestUsers,
      stateRefForCallbacks,
      updateMessages,
    ],
  );

  const loadMessagesFrom = useCallback(
    async (threadID: UUID, messageID: UUID) => {
      try {
        const { data } = await loadMessagesFromQuery({
          variables: {
            threadID,
            // Named deepLinked but just means load from this messageID
            deepLinkedMessageID: messageID,
            ignoreDeleted: false,
          },
        });
        if (!data) {
          throw new Error("Couldn't load messages from query");
        }
        const { messages, olderMessagesCount } =
          data.thread.loadNewestMessagesToTarget;
        messages.map((m) => extractUsersFromMessage(m, addUsers, requestUsers));
        updateMessages(threadID, messages, olderMessagesCount);
        return messages;
      } catch {
        return [];
      }
    },
    [loadMessagesFromQuery, updateMessages, addUsers, requestUsers],
  );

  const resolvedThreadsIDsSetRef = useRef<Set<UUID>>(new Set());
  const resolvedThreadIDsSet = useMemo(() => {
    const resolvedThreadIDs = new Set(
      state.threadIDs.filter(
        (threadID) => state.threadsData[threadID].resolved,
      ),
    );
    if (isEqual(resolvedThreadIDs, resolvedThreadsIDsSetRef.current)) {
      return resolvedThreadsIDsSetRef.current;
    }
    resolvedThreadsIDsSetRef.current = resolvedThreadIDs;
    return resolvedThreadIDs;
  }, [state.threadIDs, state.threadsData]);

  const threadUpdatingRefs = useRef<ThreadUpdatingRefs>({});
  const getThreadUpdatingRef = useCallback(
    (threadID: UUID) => {
      if (threadUpdatingRefs.current[threadID]) {
        threadUpdatingRefs.current[threadID].current =
          stateRefForCallbacks.current.threadsData[threadID] ?? null;
      } else {
        threadUpdatingRefs.current[threadID] = {
          current: stateRefForCallbacks.current.threadsData[threadID] ?? null,
        };
      }
      return threadUpdatingRefs.current[threadID];
    },
    [stateRefForCallbacks],
  );

  // Avoid exposing a function with a frequently changing dependency by mistake
  const fns = useReffedFns({
    getThreadUpdatingRef,
    addReaction,
    addThread,
    markThreadSeen,
    markThreadsSeenLocally,
    clearNotificationsForMessage,
    mergeMessage,
    mergeOptimisticMessage,
    mergeParticipant,
    mergeThread,
    removeThread,
    removeMessage,
    removeReaction,
    setMessages,
    setResolved,
    setSharedToSlack,
    setSubscribed,
    setName,
    setProperties,
    setThreads,
    setTypingUsers,
    updateMessage,
    appendMessageContent,
    loadMessagesFrom,
    loadOlderMessages,
    reorderThreads,
    getThreadByExternalID,
    getThreadByExternalMessageID,
    setDraftMessageInComposer,
    addExternalIDMapping,
  });

  const threadIDsWithUndeletedMessages = useMemoObject(
    useMemo(
      () =>
        state.threadIDs.filter(
          (id) => state.threadsData[id].messagesCountExcludingDeleted > 0,
        ),
      [state.threadIDs, state.threadsData],
    ),
  );

  const threadIDsWithMessagesIncludingDeleted = useMemoObject(
    useMemo(
      () =>
        state.threadIDs.filter(
          (id) => state.threadsData[id].allMessagesCount > 0,
        ),
      [state.threadIDs, state.threadsData],
    ),
  );

  const threadsContextValue = useMemo(
    () => ({
      threadIDsWithUndeletedMessages,
      threadIDsWithMessagesIncludingDeleted,
      resolvedThreadIDsSet,
      localOnlyThreadIDs: state.localOnlyThreadIDs,
      location: state.location,
      draftMessageInComposer: state.draftMessageInComposer,
      ...fns,
    }),
    [
      threadIDsWithUndeletedMessages,
      threadIDsWithMessagesIncludingDeleted,
      resolvedThreadIDsSet,
      state.localOnlyThreadIDs,
      state.location,
      state.draftMessageInComposer,
      fns,
    ],
  );

  return (
    <ThreadsContext2.Provider value={threadsContextValue}>
      <ThreadsDataContext2.Provider value={state.threadsData}>
        {children}
        {/* We need to subscribe to all the different threadIDs we know about,
            including preallocated IDs associated with externalIDs where the
            thread doesn't exist yet, so we need to use externalIDMap instead
            of state.threadIDs or the like. */}
        {Object.values(state.externalIDMap).map((threadID) => (
          <ThreadSubscriber key={threadID} threadID={threadID} />
        ))}
      </ThreadsDataContext2.Provider>
    </ThreadsContext2.Provider>
  );
}
