import { action, actionReducer } from 'external/src/context/common.ts';
import { ThreadsActions } from 'external/src/context/threads2/actions/actionTypes.ts';
import { participantsToMap } from 'external/src/context/threads2/ThreadsContext2.tsx';
import type { ThreadsState } from 'external/src/context/threads2/ThreadsContext2.tsx';
import type { MessageFragment } from 'external/src/graphql/operations.ts';
import type { Location, UUID } from 'common/types/index.ts';

type Payload = {
  newThreadID: UUID;
  externalID: string;
  orgID: UUID;
  externalOrgID: string;
  message: MessageFragment;
  location: Location;
  name: string;
};

export const AddThreadAction = action<Payload>(ThreadsActions.ADD_THREAD);

// NOTE: This is used for adding threads that are local-only threads.  If you
// want to add a thread that you got from the server, use MergeThread.
export const AddThreadReducer = actionReducer(
  (
    state: ThreadsState,
    {
      newThreadID,
      externalID,
      orgID,
      externalOrgID,
      message,
      location,
      name,
    }: Payload,
  ) => {
    const participantType = 'ThreadParticipant';

    const participantsMap = participantsToMap([
      {
        user: message.source,
        lastSeenTimestamp: null,
        subscribed: null,
      },
    ]);

    return {
      ...state,
      threadIDs: [newThreadID, ...state.threadIDs],
      localOnlyThreadIDs: [newThreadID, ...state.localOnlyThreadIDs],
      threadsData: {
        ...state.threadsData,
        [newThreadID]: {
          id: newThreadID,
          externalID,
          externalOrgID,
          orgID,
          name,
          metadata: {},
          subscribed: true,
          typingUsers: [],
          mentioned: [],
          messages: [message],
          newMessagesCount: 0,
          newReactionsCount: 0,
          allMessagesCount: 1,
          userMessagesCount: 1,
          actionMessagesCount: 0,
          replyCount: 0,
          messagesCountExcludingDeleted: 1,
          participants: [
            {
              user: message.source,
              __typename: participantType,
              lastSeenTimestamp: null,
              subscribed: true,
            },
          ],
          participantsMap,
          viewerIsThreadParticipant: true,
          url: '',
          navigationURL: '',
          resolved: false,
          resolvedTimestamp: null,
          sharedToSlack: null,
          hasNewMessages: false,
          olderMessagesCount: 0,
          firstUnseenMessageID: null,
          firstMessageIDsOfLoad: new Set<string>(),
          replyingUserIDs: [],
          actionMessageReplyingUserIDs: [],
          location,
          extraClassnames: null, // TODO is there a case where this could come from user?
        },
      },
      externalIDMap: {
        ...state.externalIDMap,
        [externalID]: newThreadID,
      },
      messageExternalIDMap: {
        ...state.messageExternalIDMap,
        [message.externalID]: newThreadID,
      },
    };
  },
);
