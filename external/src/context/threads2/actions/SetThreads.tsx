import type { UUID } from 'common/types/index.ts';
import { action, actionReducer } from 'external/src/context/common.ts';
import { ThreadsActions } from 'external/src/context/threads2/actions/actionTypes.ts';
import type {
  ThreadsState,
  ThreadData,
} from 'external/src/context/threads2/ThreadsContext2.tsx';

export const SetThreadsAction = action<ThreadData[]>(
  ThreadsActions.SET_THREADS,
);

export const SetThreadsReducer = actionReducer(
  (state: ThreadsState, threads: ThreadData[]) => {
    const threadsData: { [threadID in UUID]: ThreadData } = {};
    const threadIDs: UUID[] = [];
    const externalIDMap: { [externalID in string]: UUID } = {};
    const messageExternalIDMap: { [externalID in string]: UUID } = {};
    for (const thread of threads) {
      threadsData[thread.id] = thread;
      externalIDMap[thread.externalID] = thread.id;
      for (const message of thread.messages) {
        messageExternalIDMap[message.externalID] = thread.id;
      }
      threadIDs.push(thread.id);
    }
    return {
      ...state,
      threadIDs,
      threadsData,
      externalIDMap,
      messageExternalIDMap,
    };
  },
);
