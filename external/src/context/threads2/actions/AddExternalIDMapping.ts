import type { UUID } from 'common/types/index.ts';
import { action, actionReducer } from 'external/src/context/common.ts';
import type { ThreadsState } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { ThreadsActions } from 'external/src/context/threads2/actions/actionTypes.ts';

type AddExternalIDMappingPayload = {
  threadID: UUID;
  externalThreadID: string;
};

export const AddExternalIDMappingAction = action<AddExternalIDMappingPayload>(
  ThreadsActions.ADD_EXTERNAL_ID_MAPPING,
);

export const AddExternalIDMappingReducer = actionReducer(
  (state: ThreadsState, payload: AddExternalIDMappingPayload) => {
    if (state.externalIDMap[payload.externalThreadID] === payload.threadID) {
      return state;
    }
    if (
      state.externalIDMap[payload.externalThreadID] &&
      state.externalIDMap[payload.externalThreadID] !== payload.threadID
    ) {
      // We already know about this externalID, but it's mapped to a different
      // ID?
      throw new Error(
        `Conflicting externalID mappings for ${
          payload.externalThreadID
        }: new is ${payload.threadID}, existing is ${
          state.externalIDMap[payload.externalThreadID]
        }`,
      );
    }

    return {
      ...state,
      externalIDMap: {
        ...state.externalIDMap,
        [payload.externalThreadID]: payload.threadID,
      },
    };
  },
);
