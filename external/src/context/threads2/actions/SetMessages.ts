import { action, actionReducer } from 'external/src/context/common.ts';
import type { UUID } from 'common/types/index.ts';
import type { ThreadsState } from 'external/src/context/threads2/ThreadsContext2.tsx';
import type { MessageFragment } from 'external/src/graphql/operations.ts';
import { ThreadsActions } from 'external/src/context/threads2/actions/actionTypes.ts';

type SetMessagesPayload = {
  threadID: UUID;
  messages: MessageFragment[];
};

export const SetMessagesAction = action<SetMessagesPayload>(
  ThreadsActions.SET_MESSAGES,
);

export const SetMessagesReducer = actionReducer(
  (state: ThreadsState, payload: SetMessagesPayload) => {
    const thread = state.threadsData[payload.threadID];
    if (!thread) {
      return state;
    }

    const messageExternalIDMap = { ...state.messageExternalIDMap };
    for (const message of thread.messages) {
      delete messageExternalIDMap[message.externalID];
    }
    for (const message of payload.messages) {
      messageExternalIDMap[message.externalID] = thread.id;
    }

    return {
      ...state,
      threadsData: {
        ...state.threadsData,
        [thread.id]: {
          ...thread,
          messages: payload.messages,
        },
      },
      messageExternalIDMap,
    };
  },
);
