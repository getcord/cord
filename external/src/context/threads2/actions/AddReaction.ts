import { action, actionReducer } from 'external/src/context/common.ts';
import type { UUID } from 'common/types/index.ts';
import type {
  MessageReactionFragment,
  TaskFragment,
} from 'external/src/graphql/operations.ts';
import type { ThreadsState } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { ThreadsActions } from 'external/src/context/threads2/actions/actionTypes.ts';

export type AddReactionPayload = {
  threadID: UUID;
  messageID: UUID;
  reaction: MessageReactionFragment;
  task?: TaskFragment;
};

export const AddReactionAction = action<AddReactionPayload>(
  ThreadsActions.ADD_REACTION,
);

export const AddReactionReducer = actionReducer(
  (state: ThreadsState, payload: AddReactionPayload) => {
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
          messages: thread.messages.map((message) =>
            message.id === payload.messageID
              ? {
                  ...message,
                  reactions: [...message.reactions, payload.reaction],
                  task: payload.task ? payload.task : message.task,
                }
              : message,
          ),
        },
      },
    };
  },
);
