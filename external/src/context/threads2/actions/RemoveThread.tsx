import type { UUID } from 'common/types/index.ts';
import { action, actionReducer } from 'external/src/context/common.ts';
import { ThreadsActions } from 'external/src/context/threads2/actions/actionTypes.ts';
import type { ThreadsState } from 'external/src/context/threads2/ThreadsContext2.tsx';

type RemoveThreadPayload = {
  threadID: UUID;
};

export const RemoveThreadAction = action<RemoveThreadPayload>(
  ThreadsActions.REMOVE_THREAD,
);

export const RemoveThreadReducer = actionReducer(
  (state: ThreadsState, { threadID }: RemoveThreadPayload) => {
    const threadData = state.threadsData[threadID];

    if (threadData === undefined) {
      return state;
    }

    // Make a copy of everything we delete from, to ensure we don't corrupt the
    // previous state
    const updatedState = {
      ...state,
      threadsData: { ...state.threadsData },
      externalIDMap: { ...state.externalIDMap },
      messageExternalIDMap: { ...state.messageExternalIDMap },
      threadIDs: state.threadIDs.filter((id) => id !== threadID),
    };

    // Only update localOnlyThreadIDs if it actually changes, so that the array
    // avoids changing object identity unnecessarily
    if (updatedState.localOnlyThreadIDs.includes(threadID)) {
      updatedState.localOnlyThreadIDs = updatedState.localOnlyThreadIDs.filter(
        (id) => id !== threadID,
      );
    }

    threadData.messages.forEach(
      (message) => delete updatedState.messageExternalIDMap[message.externalID],
    );

    delete updatedState.externalIDMap[threadData.externalID];
    delete updatedState.threadsData[threadID];

    return updatedState;
  },
);
