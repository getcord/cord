import { ComposerActions } from 'external/src/context/composer/actions/index.ts';
import type { ComposerState } from 'external/src/context/composer/ComposerState.ts';
import { action, actionReducer } from 'external/src/context/common.ts';
import { createNewEmptyTaskInput } from 'external/src/lib/util.ts';
import type { TaskInputType } from 'external/src/graphql/operations.ts';

export const SetTaskTypeAction = action<TaskInputType>(
  ComposerActions.SET_TASK_TYPE,
);

export const SetTaskTypeReducer = actionReducer(
  (state: ComposerState, type: TaskInputType): ComposerState => {
    return {
      ...state,
      task: state.task
        ? {
            ...state.task,
            type,
          }
        : createNewEmptyTaskInput(type),
    };
  },
);
