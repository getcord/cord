import { ComposerActions } from 'external/src/context/composer/actions/index.ts';
import type { ComposerState } from 'external/src/context/composer/ComposerState.ts';
import { action, actionReducer } from 'external/src/context/common.ts';
import type { UUID } from 'common/types/index.ts';

export const RemoveAssigneeAction = action<UUID>(
  ComposerActions.REMOVE_ASSIGNEE,
);

export const RemoveAssigneeReducer = actionReducer(
  (state: ComposerState, userID: string): ComposerState => {
    if (!state.task) {
      return state;
    }
    return {
      ...state,
      task: {
        ...state.task,
        assigneeIDs: state.task.assigneeIDs.filter((id) => id !== userID),
      },
    };
  },
);
