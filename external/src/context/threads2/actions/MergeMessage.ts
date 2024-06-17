import { action, actionReducer } from 'external/src/context/common.ts';
import type { MessageFragment } from 'external/src/graphql/operations.ts';
import type { UUID } from 'common/types/index.ts';
import { ThreadsActions } from 'external/src/context/threads2/actions/actionTypes.ts';
import type { ThreadsState } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { sortedInsert } from 'common/util/sortedInsert.ts';

type MergeMessagePayload = {
  threadID: UUID;
  message: MessageFragment;
  viewerIsAuthor: boolean;
  isNewMessage: boolean;
};

export const MergeMessageAction = action<MergeMessagePayload>(
  ThreadsActions.MERGE_MESSAGE,
);

const messageAlreadyExists = (
  message: MessageFragment,
  messages: MessageFragment[],
) => {
  // going back to front because it's most likely that the duplication occurs in
  // recent messages rather than old ones.
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].id === message.id) {
      return true;
    }
  }
  return false;
};

// insert a message into a list of existing messages assumed to be sorted ascending
const messagesWithMergedMessage = (
  messages: MessageFragment[],
  message: MessageFragment,
): MessageFragment[] => {
  if (messages.length === 0) {
    return [message];
  }

  if (messageAlreadyExists(message, messages)) {
    return messages.map((existingMessage) =>
      message.id === existingMessage.id ? message : existingMessage,
    );
  }

  return sortedInsert(messages, message, (m) => m.timestamp);
};

/*
  This reducer receives a message entity that it has to merge into the conversation.
  It needs to account for:
  - deduplicating messages that already exist, for example a message the user just sent
  - injecting it in the right place in the timeline
*/
export const MergeMessageReducer = actionReducer(
  (state: ThreadsState, payload: MergeMessagePayload) => {
    const thread = state.threadsData[payload.threadID];
    if (!thread) {
      return state;
    }

    const newMessages = messagesWithMergedMessage(
      thread.messages,
      payload.message,
    );
    const messageAlreadyExisted = newMessages.length === thread.messages.length;
    const newThread = {
      ...thread,
      messages: newMessages,
    };

    if (payload.isNewMessage && !messageAlreadyExisted) {
      newThread.allMessagesCount++;
      if (newThread.allMessagesCount > 1) {
        newThread.replyCount++;
      }
      payload.message.type === 'user_message'
        ? newThread.userMessagesCount++
        : newThread.actionMessagesCount++;
      newThread.messagesCountExcludingDeleted++;
      if (payload.viewerIsAuthor) {
        newThread.newMessagesCount = 0;
        newThread.firstUnseenMessageID = null;
        newThread.hasNewMessages = false;
      } else {
        newThread.newMessagesCount++;
        if (!newThread.firstUnseenMessageID) {
          newThread.firstUnseenMessageID = payload.message.id;
        }
        newThread.hasNewMessages = true;
      }
    }

    const { replyingUserIDs, actionMessageReplyingUserIDs } = newThread;
    if (!messageAlreadyExisted) {
      if (
        !replyingUserIDs.find((userID) => userID === payload.message.source.id)
      ) {
        newThread.replyingUserIDs = [
          ...replyingUserIDs,
          payload.message.source.id,
        ];
      }
      if (
        payload.message.type === 'action_message' &&
        !actionMessageReplyingUserIDs.find(
          (userID) => userID === payload.message.source.id,
        )
      ) {
        newThread.actionMessageReplyingUserIDs = [
          ...actionMessageReplyingUserIDs,
          payload.message.source.id,
        ];
      }
    }

    return {
      ...state,
      threadsData: {
        ...state.threadsData,
        [thread.id]: newThread,
      },
      messageExternalIDMap: {
        ...state.messageExternalIDMap,
        [payload.message.externalID]: thread.id,
      },
    };
  },
);
