import { ComposerActions } from 'external/src/context/composer/actions/index.ts';
import type { ComposerState } from 'external/src/context/composer/ComposerState.ts';
import { action, actionReducer } from 'external/src/context/common.ts';
import type { UUID } from 'common/types/index.ts';
import { createNewEmptyTaskInput } from 'external/src/lib/util.ts';
import type { TaskInputType } from 'external/src/graphql/operations.ts';

export const AddAssigneeAction = action<{
  userID: UUID;
  defaultTaskType: TaskInputType;
}>(ComposerActions.ADD_ASSIGNEE);

export const AddAssigneeReducer = actionReducer(
  (
    state: ComposerState,
    {
      userID,
      defaultTaskType,
    }: { userID: UUID; defaultTaskType: TaskInputType },
  ): ComposerState => {
    // Add task if one doesn't exist already
    const task = state.task
      ? { ...state.task }
      : createNewEmptyTaskInput(defaultTaskType);
    // Add assigneeID if not already added
    if (!task.assigneeIDs.find((id) => id === userID)) {
      task.assigneeIDs = [...task.assigneeIDs, userID];
    }
    return {
      ...state,
      task,
    };
  },
);
