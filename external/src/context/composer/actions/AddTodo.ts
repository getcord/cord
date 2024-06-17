import { ComposerActions } from 'external/src/context/composer/actions/index.ts';
import type { ComposerState } from 'external/src/context/composer/ComposerState.ts';
import { action, actionReducer } from 'external/src/context/common.ts';
import type { Todo } from 'common/types/index.ts';
import { createNewEmptyTaskInput } from 'external/src/lib/util.ts';
import type { TaskInputType } from 'external/src/graphql/operations.ts';

export const AddTodoAction = action<{
  todo: Todo;
  defaultTaskType: TaskInputType;
}>(ComposerActions.ADD_TODO);

function todoAlreadyExists(todos: Todo[], newTodo: Todo) {
  for (const todo of todos) {
    if (todo.id === newTodo.id) {
      return true;
    }
  }
  return false;
}

export const AddTodoReducer = actionReducer(
  (
    state: ComposerState,
    { todo, defaultTaskType }: { todo: Todo; defaultTaskType: TaskInputType },
  ): ComposerState => {
    if (!state.task) {
      return {
        ...state,
        task: {
          ...createNewEmptyTaskInput(defaultTaskType),
          todos: [todo],
        },
      };
    }

    if (todoAlreadyExists(state.task.todos, todo)) {
      return state;
    }

    return {
      ...state,
      task: {
        ...state.task,
        todos: state.task.todos.concat(todo),
      },
    };
  },
);
