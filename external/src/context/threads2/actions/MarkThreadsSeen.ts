import type { UUID } from 'common/types/index.ts';
import { action, actionReducer } from 'external/src/context/common.ts';
import type {
  ThreadData,
  ThreadsState,
} from 'external/src/context/threads2/ThreadsContext2.tsx';
import { ThreadsActions } from 'external/src/context/threads2/actions/actionTypes.ts';
import type { ClientThreadFilter } from '@cord-sdk/types';
import { internalThreadMatchesFilter } from 'sdk/client/core/filter.ts';
import type { UserFragment } from 'external/src/graphql/operations.ts';

export type MarkThreadsSeenPayload = {
  externalThreadID?: string;
  viewer: UserFragment;
  filter: ClientThreadFilter;
  seen: boolean;
};

export const MarkThreadsSeenAction = action<MarkThreadsSeenPayload>(
  ThreadsActions.MARK_THREADS_SEEN,
);

export const MarkThreadsSeenReducer = actionReducer(
  (state: ThreadsState, payload: MarkThreadsSeenPayload) => {
    const { externalThreadID, viewer, filter, seen, ...rest } = payload;
    const _: Record<string, never> = rest;
    const newThreads: { [threadID in UUID]: ThreadData } = {};
    for (const [threadID, thread] of Object.entries(state.threadsData)) {
      if (
        externalThreadID !== undefined &&
        thread.externalID !== externalThreadID
      ) {
        continue;
      }
      if (!internalThreadMatchesFilter(thread, viewer, filter)) {
        continue;
      }
      newThreads[threadID] = {
        ...thread,
        messages: thread.messages.map((message) => ({
          ...message,
          seen,
        })),
        newMessagesCount: seen ? 0 : thread.allMessagesCount,
        newReactionsCount: seen ? 0 : thread.newReactionsCount,
        firstUnseenMessageID: seen ? null : thread.messages[0].id,
        hasNewMessages: !seen,
        viewerIsThreadParticipant: true,
      };
    }
    if (Object.entries(newThreads).length === 0) {
      return state;
    }

    return {
      ...state,
      threadsData: {
        ...state.threadsData,
        ...newThreads,
      },
    };
  },
);
