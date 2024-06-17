import { action, actionReducer } from 'external/src/context/common.ts';
import type { UUID } from 'common/types/index.ts';
import type { ThreadsState } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { ThreadsActions } from 'external/src/context/threads2/actions/actionTypes.ts';

type SetSubscribedPayload = {
  threadID: UUID;
  subscribed: boolean;
};

export const SetSubscribedAction = action<SetSubscribedPayload>(
  ThreadsActions.SET_SUBSCRIBED,
);

export const SetSubscribedReducer = actionReducer(
  (state: ThreadsState, payload: SetSubscribedPayload) => {
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
          subscribed: payload.subscribed,
        },
      },
    };
  },
);
