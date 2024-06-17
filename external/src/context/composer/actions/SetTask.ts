import { ComposerActions } from 'external/src/context/composer/actions/index.ts';
import type { ComposerState } from 'external/src/context/composer/ComposerState.ts';
import { action, actionReducer } from 'external/src/context/common.ts';
import type { TaskInput } from 'external/src/graphql/operations.ts';

export const SetTaskAction = action<TaskInput | null>(ComposerActions.SET_TASK);

export const SetTaskReducer = actionReducer(
  (state: ComposerState, task: TaskInput | null): ComposerState => ({
    ...state,
    task,
  }),
);
