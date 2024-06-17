import { action, actionReducer } from 'external/src/context/common.ts';
import type { UUID } from 'common/types/index.ts';
import type { UserFragment } from 'external/src/graphql/operations.ts';
import type { ThreadsState } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { ThreadsActions } from 'external/src/context/threads2/actions/actionTypes.ts';

type SetTypingUsersPayload = {
  threadID: UUID;
  typingUsers: UserFragment[];
};

export const SetTypingUsersAction = action<SetTypingUsersPayload>(
  ThreadsActions.SET_TYPING_USERS,
);

export const SetTypingUsersReducer = actionReducer(
  (state: ThreadsState, payload: SetTypingUsersPayload) => {
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
          typingUsers: payload.typingUsers,
        },
      },
    };
  },
);
