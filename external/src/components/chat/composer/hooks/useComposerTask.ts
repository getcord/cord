import { useCallback, useMemo } from 'react';

import { SetTaskAction } from 'external/src/context/composer/actions/SetTask.ts';
import { ComposerContext } from 'external/src/context/composer/ComposerContext.ts';
import { EditorCommands } from 'external/src/editor/commands.ts';
import { createNewEmptyTaskInput } from 'external/src/lib/util.ts';
import { AddTodoAction } from 'external/src/context/composer/actions/AddTodo.ts';
import { RemoveTodoAction } from 'external/src/context/composer/actions/RemoveTodo.ts';
import { UpdateTodoAction } from 'external/src/context/composer/actions/UpdateTodo.ts';
import { AddAssigneeAction } from 'external/src/context/composer/actions/AddAssignee.ts';
import { RemoveAssigneeAction } from 'external/src/context/composer/actions/RemoveAssignee.ts';
import { SetTaskTypeAction } from 'external/src/context/composer/actions/SetTaskTypeAction.ts';
import type { TaskInputType } from 'external/src/graphql/operations.ts';
import type { Todo, UUID } from 'common/types/index.ts';
import { useDefaultTaskType } from 'external/src/effects/useDefaultTaskType.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

export function useComposerTask() {
  const [defaultTaskType, setDefaultTaskType] = useDefaultTaskType();

  const {
    state: { task },
    editor,
    dispatch,
  } = useContextThrowingIfNoProvider(ComposerContext);

  const addTask = useCallback(() => {
    dispatch(SetTaskAction(createNewEmptyTaskInput(defaultTaskType)));
    EditorCommands.focusAndMoveCursorToEndOfText(editor);
  }, [dispatch, defaultTaskType, editor]);

  const removeTask = useCallback(() => {
    EditorCommands.convertAssigneesToText(editor);
    EditorCommands.convertTodosToBullets(editor);
    dispatch(SetTaskAction(null));
  }, [dispatch, editor]);

  const addTodo = useCallback(
    (todo: Todo) => {
      dispatch(AddTodoAction({ todo, defaultTaskType }));
    },
    [defaultTaskType, dispatch],
  );

  const removeTodo = useCallback(
    (todoID: UUID) => {
      dispatch(RemoveTodoAction(todoID));
    },
    [dispatch],
  );

  const updateTodo = useCallback(
    (todo: Todo) => {
      dispatch(UpdateTodoAction(todo));
    },
    [dispatch],
  );

  const addAssignee = useCallback(
    (userID: UUID) => {
      dispatch(AddAssigneeAction({ userID, defaultTaskType }));
    },
    [defaultTaskType, dispatch],
  );

  const removeAssignee = useCallback(
    (userID: UUID) => {
      dispatch(RemoveAssigneeAction(userID));
    },
    [dispatch],
  );

  const setTaskType = useCallback(
    (type: TaskInputType) => {
      dispatch(SetTaskTypeAction(type));
      setDefaultTaskType(type);
    },
    [dispatch, setDefaultTaskType],
  );

  return useMemo(
    () => ({
      task,
      addTask,
      removeTask,
      addTodo,
      removeTodo,
      updateTodo,
      addAssignee,
      removeAssignee,
      setTaskType,
    }),
    [
      addAssignee,
      addTask,
      addTodo,
      removeAssignee,
      removeTask,
      removeTodo,
      setTaskType,
      task,
      updateTodo,
    ],
  );
}
