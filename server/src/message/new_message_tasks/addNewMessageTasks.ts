import type { UUID } from 'common/types/index.ts';
import type { RequestContextLoaders } from 'server/src/RequestContextLoaders.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { TaskMutator } from 'server/src/entity/task/TaskMutator.ts';
import { TaskAssigneeMutator } from 'server/src/entity/task_assignee/TaskAssigneeMutator.ts';
import { TaskTodoMutator } from 'server/src/entity/task_todo/TaskTodoMutator.ts';
import type { TaskInput } from 'server/src/schema/resolverTypes.ts';

export async function addNewMessageTasks(
  viewer: Viewer,
  loaders: RequestContextLoaders,
  task: TaskInput,
  messageID: UUID,
) {
  const taskMutator = new TaskMutator(viewer, loaders);
  await taskMutator.createTask(task, messageID);

  const taskAssigneeMutator = new TaskAssigneeMutator(viewer, loaders);
  const taskAssigneeUserIDs = await taskAssigneeMutator.createTaskAssignees(
    task.id,
    task.assigneeIDs,
  );

  const taskTodoMutator = new TaskTodoMutator(viewer);
  await taskTodoMutator.createTaskTodos(task.id, task.todos);
  return taskAssigneeUserIDs;
}
