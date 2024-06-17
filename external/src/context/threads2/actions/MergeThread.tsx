import { action, actionReducer } from 'external/src/context/common.ts';
import { ThreadsActions } from 'external/src/context/threads2/actions/actionTypes.ts';
import type {
  ThreadsState,
  ThreadData,
} from 'external/src/context/threads2/ThreadsContext2.tsx';

type MergeThreadPayload = {
  thread: ThreadData;
};

export const MergeThreadAction = action<{ thread: ThreadData }>(
  ThreadsActions.MERGE_THREAD,
);

export const MergeThreadReducer = actionReducer(
  (state: ThreadsState, { thread }: MergeThreadPayload) => {
    // Make sure we don't push duplicate threadIDs
    let threadIDs = state.threadIDs.includes(thread.id)
      ? state.threadIDs
      : [thread.id, ...state.threadIDs];
    let localOnlyThreadIDs = state.localOnlyThreadIDs;

    const threadsData = { ...state.threadsData };
    // If we previously knew about a different thread with this external ID
    // (probably because it was optimistically rendered and we didn't know what
    // its ID would be), delete it
    if (
      thread.externalID in state.externalIDMap &&
      state.externalIDMap[thread.externalID] !== thread.id
    ) {
      const replacedThreadID = state.externalIDMap[thread.externalID];
      threadIDs = threadIDs.filter((id) => id !== replacedThreadID);
      localOnlyThreadIDs = localOnlyThreadIDs.filter(
        (id) => id !== replacedThreadID,
      );
      delete threadsData[replacedThreadID];
    }
    // If this thread was marked as local-only, we now have server data, so
    // remove it from the list
    if (localOnlyThreadIDs.includes(thread.id)) {
      localOnlyThreadIDs = localOnlyThreadIDs.filter((id) => id !== thread.id);
    }
    threadsData[thread.id] = thread;

    const messageExternalIDMap = { ...state.messageExternalIDMap };
    for (const message of thread.messages) {
      messageExternalIDMap[message.externalID] = thread.id;
    }

    return {
      ...state,
      threadIDs,
      localOnlyThreadIDs,
      threadsData,
      externalIDMap: {
        ...state.externalIDMap,
        [thread.externalID]: thread.id,
      },
      messageExternalIDMap,
    };
  },
);
