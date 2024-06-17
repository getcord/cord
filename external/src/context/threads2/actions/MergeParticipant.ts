import { action, actionReducer } from 'external/src/context/common.ts';
import type { ThreadParticipantFragment } from 'external/src/graphql/operations.ts';
import type { UUID } from 'common/types/index.ts';
import { ThreadsActions } from 'external/src/context/threads2/actions/actionTypes.ts';
import type { ThreadsState } from 'external/src/context/threads2/ThreadsContext2.tsx';

type MergeParticipantPayload = {
  threadID: UUID;
  participant: ThreadParticipantFragment;
};

export const MergeParticipantAction = action<MergeParticipantPayload>(
  ThreadsActions.MERGE_PARTICIPANT,
);

export const MergeParticipantReducer = actionReducer(
  (state: ThreadsState, { threadID, participant }: MergeParticipantPayload) => {
    const thread = state.threadsData[threadID];
    if (!thread) {
      return state;
    }

    // TODO: this should not be nullable
    if (!participant.user?.id) {
      return state;
    }

    const newParticipantsMap = new Map(thread.participantsMap);
    newParticipantsMap.set(participant.user.id, participant);

    const newParticipants = Array.from(newParticipantsMap.values());

    return {
      ...state,
      threadsData: {
        ...state.threadsData,
        [thread.id]: {
          ...thread,
          participants: newParticipants,
          participantsMap: newParticipantsMap,
        },
      },
    };
  },
);
