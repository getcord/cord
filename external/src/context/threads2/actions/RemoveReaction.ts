import { action, actionReducer } from 'external/src/context/common.ts';
import type { UUID } from 'common/types/index.ts';
import { ThreadsActions } from 'external/src/context/threads2/actions/actionTypes.ts';
import type { ThreadsState } from 'external/src/context/threads2/ThreadsContext2.tsx';

type RemoveReactionPayLoad = {
  threadID: UUID;
  messageID: UUID;
  reactionID: UUID;
};

export const RemoveReactionAction = action<RemoveReactionPayLoad>(
  ThreadsActions.REMOVE_REACTION,
);

export const RemoveReactionReducer = actionReducer(
  (state: ThreadsState, payload: RemoveReactionPayLoad) => {
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
                  reactions: message.reactions.filter(
                    (reaction) => reaction.id !== payload.reactionID,
                  ),
                }
              : message,
          ),
        },
      },
    };
  },
);
