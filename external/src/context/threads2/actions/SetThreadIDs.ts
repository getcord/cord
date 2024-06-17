import { ThreadsActions } from 'external/src/context/threads2/actions/actionTypes.ts';
import { action, actionReducer } from 'external/src/context/common.ts';
import type { ThreadsState } from 'external/src/context/threads2/ThreadsContext2.tsx';
import type { UUID } from 'common/types/index.ts';

export const SetThreadIDsAction = action<UUID[]>(ThreadsActions.SET_THREAD_IDS);

export const SetThreadIDsReducer = actionReducer(
  (state: ThreadsState, threadIDs: UUID[]) => {
    return {
      ...state,
      threadIDs,
    };
  },
);
