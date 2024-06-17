import { ComposerActions } from 'external/src/context/composer/actions/index.ts';
import type { ComposerState } from 'external/src/context/composer/ComposerState.ts';
import { action, actionReducer } from 'external/src/context/common.ts';
import type { UUID } from 'common/types/index.ts';

export const RemoveTodoAction = action<UUID>(ComposerActions.REMOVE_TODO);

export const RemoveTodoReducer = actionReducer(
  (state: ComposerState, todoID: UUID): ComposerState => {
    if (!state.task) {
      return state;
    }
    return {
      ...state,
      task: {
        ...state.task,
        todos: state.task.todos.filter((todo) => todo.id !== todoID),
      },
    };
  },
);
