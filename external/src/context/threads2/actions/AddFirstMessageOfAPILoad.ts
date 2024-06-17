import { action, actionReducer } from 'external/src/context/common.ts';
import type { UUID } from 'common/types/index.ts';
import type { ThreadsState } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { ThreadsActions } from 'external/src/context/threads2/actions/actionTypes.ts';

type AddFirstMessageOfAPILoadPayload = {
  threadID: UUID;
  messageID: UUID;
};

export const AddFirstMessageOfAPILoadAction =
  action<AddFirstMessageOfAPILoadPayload>(
    ThreadsActions.ADD_FIRST_MESSAGE_OF_API_LOAD,
  );

export const AddFirstMessageOfAPILoadReducer = actionReducer(
  (state: ThreadsState, payload: AddFirstMessageOfAPILoadPayload) => {
    const thread = state.threadsData[payload.threadID];
    if (!thread) {
      return state;
    }

    return {
      ...state,
      threadsData: {
        ...state.threadsData,
        [thread.id]: {
          ...thread,
          firstMessageIDsOfLoad: new Set([
            ...thread.firstMessageIDsOfLoad,
            payload.messageID,
          ]),
        },
      },
    };
  },
);
