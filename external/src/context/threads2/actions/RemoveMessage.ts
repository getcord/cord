import { ThreadsActions } from 'external/src/context/threads2/actions/actionTypes.ts';
import { action, actionReducer } from 'external/src/context/common.ts';
import type { UUID } from 'common/types/index.ts';
import type { ThreadsState } from 'external/src/context/threads2/ThreadsContext2.tsx';

type RemoveMessagePayload = {
  threadID: UUID;
  messageID: UUID;
};

export const RemoveMessageAction = action<RemoveMessagePayload>(
  ThreadsActions.REMOVE_MESSAGE,
);

export const RemoveMessageReducer = actionReducer(
  (state: ThreadsState, payload: RemoveMessagePayload) => {
    const thread = state.threadsData[payload.threadID];
    if (!thread) {
      return state;
    }
    const removedMessage = thread.messages.find(
      (message) => message.id === payload.messageID,
    );
    const newMessages = thread.messages.filter(
      (message) => message.id !== payload.messageID,
    );
    if (!removedMessage) {
      return state;
    }

    // If removing last message of thread, remove thread. Note this is different
    // from deleting messages. This is used for things like removing a scraped
    // external task
    if (!newMessages.length) {
      const { [thread.id]: _thread, ...otherThreadsData } = state.threadsData;
      return {
        ...state,
        threadsData: otherThreadsData,
        threadIDs: state.threadIDs.filter((threadID) => threadID !== thread.id),
      };
    }

    const newThread = { ...thread, messages: newMessages };
    newThread.allMessagesCount--;
    newThread.replyCount--;
    if (removedMessage.type === 'user_message') {
      newThread.userMessagesCount--;
    } else {
      newThread.actionMessagesCount--;
    }
    if (!removedMessage.deletedTimestamp) {
      newThread.messagesCountExcludingDeleted--;
    }

    const messageExternalIDMap = { ...state.messageExternalIDMap };
    delete messageExternalIDMap[removedMessage.externalID];

    return {
      ...state,
      threadsData: {
        ...state.threadsData,
        [thread.id]: newThread,
      },
      messageExternalIDMap,
    };
  },
);
// messages: state.messages.filter((message) => message.id !== messageID),
