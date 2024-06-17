import type { UUID } from 'common/types/index.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import type { TaskInput } from 'server/src/admin/resolverTypes.ts';
import type { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { TaskMutator } from 'server/src/entity/task/TaskMutator.ts';
import { TaskAssigneeMutator } from 'server/src/entity/task_assignee/TaskAssigneeMutator.ts';
import { TaskTodoMutator } from 'server/src/entity/task_todo/TaskTodoMutator.ts';

export async function updateMessageTask(
  context: RequestContext,
  message: MessageEntity,
  task: TaskInput | null,
) {
  const viewer = context.session.viewer;
  const taskMutator = new TaskMutator(viewer, context.loaders);
  let newTaskAssignees: UUID[] = [];
  let removedTaskAssignees: UUID[] = [];

  if (task === null) {
    await taskMutator.deleteTaskFromMessageID(message.id, message.orgID);
  } else {
    const taskAssigneeMutator = new TaskAssigneeMutator(
      viewer,
      context.loaders,
    );
    await taskMutator.createOrUpdateTask(task, message.id);
    const { newAssigneeIDs, removedAssigneeIDs } =
      await taskAssigneeMutator.updateTaskAssignees(task.id, task.assigneeIDs);
    newTaskAssignees = newAssigneeIDs;
    removedTaskAssignees = removedAssigneeIDs;

    const taskTodoMutator = new TaskTodoMutator(viewer);
    await taskTodoMutator.setTaskTodos(task.id, task.todos);
  }
  return { newTaskAssignees, removedTaskAssignees };
}
