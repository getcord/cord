import { action, actionReducer } from 'external/src/context/common.ts';
import type { SharedToSlackInfo, UUID } from 'common/types/index.ts';
import type { ThreadsState } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { ThreadsActions } from 'external/src/context/threads2/actions/actionTypes.ts';

type SetSharedToSlackPayload = {
  threadID: UUID;
  sharedToSlack: SharedToSlackInfo | null;
};

export const SetSharedToSlackAction = action<SetSharedToSlackPayload>(
  ThreadsActions.SET_SHARED_TO_SLACK,
);

export const SetSharedToSlackReducer = actionReducer(
  (state: ThreadsState, payload: SetSharedToSlackPayload) => {
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
          sharedToSlack: payload.sharedToSlack,
        },
      },
    };
  },
);
