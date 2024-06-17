import { ComposerActions } from 'external/src/context/composer/actions/index.ts';
import type { ComposerState } from 'external/src/context/composer/ComposerState.ts';
import { action, actionReducer } from 'external/src/context/common.ts';
import type { Todo } from 'common/types/index.ts';

export const UpdateTodoAction = action<Todo>(ComposerActions.UPDATE_TODO);

export const UpdateTodoReducer = actionReducer(
  (state: ComposerState, todo: Todo): ComposerState => {
    if (!state.task) {
      return state;
    }
    const todos = state.task.todos.map((t) => (t.id === todo.id ? todo : t));
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    const done = todos.every((todo) => todo.done);
    return {
      ...state,
      task: {
        ...state.task,
        done,
        todos,
      },
    };
  },
);
