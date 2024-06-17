import { TaskThirdPartyReference } from 'server/src/entity/task_third_party_reference/TaskThirdPartyReferenceEntity.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
export const taskResolver: Resolvers['Task'] = {
  assignees: async (task, _, context) => {
    const assignees =
      await context.loaders.taskAssigneeLoader.loadTaskAssigneesForTaskNoOrgCheck(
        task.id,
      );
    return await context.loaders.userLoader.loadUsersNoOrgCheck(
      assignees.map((assignee) => assignee.userID),
    );
  },
  todos: async (task, _, context) =>
    await context.loaders.taskTodoLoader.loadTaskTodosNoOrgCheck(task.id),
  doneStatusLastUpdatedBy: async (task, _, context) => {
    return task.doneStatusLastUpdatedBy
      ? await context.loaders.userLoader.loadUser(task.doneStatusLastUpdatedBy)
      : null;
  },
  thirdPartyReference: (task, args) =>
    TaskThirdPartyReference.findForTask(task.id, args.type),
  thirdPartyReferences: (task) =>
    TaskThirdPartyReference.findAllForTask(task.id),
};
