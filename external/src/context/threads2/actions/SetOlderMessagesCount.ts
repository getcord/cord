import { action, actionReducer } from 'external/src/context/common.ts';
import type { UUID } from 'common/types/index.ts';
import type { ThreadsState } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { ThreadsActions } from 'external/src/context/threads2/actions/actionTypes.ts';

type SetOlderMessagesCountPayload = {
  threadID: UUID;
  olderMessagesCount: number;
};

export const SetOlderMessagesCountAction = action<SetOlderMessagesCountPayload>(
  ThreadsActions.SET_OLDER_MESSAGES_COUNT,
);

export const SetOlderMessagesCountReducer = actionReducer(
  (state: ThreadsState, payload: SetOlderMessagesCountPayload) => {
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
          olderMessagesCount: payload.olderMessagesCount,
        },
      },
    };
  },
);
