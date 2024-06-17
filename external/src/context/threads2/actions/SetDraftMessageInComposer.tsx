import { action, actionReducer } from 'external/src/context/common.ts';
import { ThreadsActions } from 'external/src/context/threads2/actions/actionTypes.ts';
import type { ThreadsState } from 'external/src/context/threads2/ThreadsContext2.tsx';

export const SetDraftMessageInComposerAction = action(
  ThreadsActions.SET_DRAFT_MESSAGE_IN_COMPOSER,
);

export const SetDraftMessageInComposerReducer = actionReducer(
  (
    state: ThreadsState,
    { draftMessageInComposer }: { draftMessageInComposer: boolean },
  ) => {
    return {
      ...state,
      draftMessageInComposer,
    };
  },
);
