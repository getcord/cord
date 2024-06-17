import type { UUID, Todo } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { assertViewerHasOrg } from 'server/src/auth/index.ts';
import { TaskTodoEntity } from 'server/src/entity/task_todo/TaskTodoEntity.ts';
import { TaskThirdPartyReference } from 'server/src/entity/task_third_party_reference/TaskThirdPartyReferenceEntity.ts';
import {
  createJiraSubtasks,
  updateJiraTask,
} from 'server/src/third_party_tasks/jira/actions.ts';
import {
  createAsanaSubtasks,
  updateAsanaTask,
} from 'server/src/third_party_tasks/asana/actions.ts';
import {
  createLinearSubtasks,
  updateLinearTask,
} from 'server/src/third_party_tasks/linear/actions.ts';
import { Logger } from 'server/src/logging/Logger.ts';
import {
  createMondaySubtasks,
  updateMondayTask,
} from 'server/src/third_party_tasks/monday/actions.ts';

export class TaskTodoMutator {
  viewer: Viewer;
  logger: Logger;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
    this.logger = new Logger(viewer);
  }

  async createTaskTodos(taskID: UUID, todos: Todo[]) {
    if (todos.length === 0) {
      return [];
    }

    const orgID = assertViewerHasOrg(this.viewer);
    const entities = await TaskTodoEntity.bulkCreate(
      todos.map((todo) => ({
        id: todo.id,
        taskID,
        orgID,
        done: todo.done,
      })),
    );

    await this.createExternalSubtasks(taskID, entities);

    return entities;
  }

  async updateTaskTodosDoneState(taskID: UUID, todos: Todo[]) {
    if (todos.length === 0) {
      return [];
    }

    const orgID = assertViewerHasOrg(this.viewer);
    const result = await Promise.all(
      todos.map((todo) =>
        TaskTodoEntity.update(
          { done: todo.done },
          { where: { id: todo.id, orgID, taskID } },
        ),
      ),
    );

    await this.updateExternalSubtasks(taskID, todos);

    return result;
  }

  async deleteTaskTodos(taskID: UUID, todos: Todo[]) {
    if (todos.length === 0) {
      return;
    }

    const orgID = assertViewerHasOrg(this.viewer);
    return await TaskTodoEntity.destroy({
      where: {
        taskID,
        orgID,
        id: todos.map(({ id }) => id),
      },
    });
  }

  private async createExternalSubtasks(
    taskID: UUID,
    entities: TaskTodoEntity[],
  ) {
    const externalReferences =
      await TaskThirdPartyReference.findAllForTask(taskID);

    return await Promise.all(
      externalReferences.map(async (externalReference) => {
        switch (externalReference.externalConnectionType) {
          case 'jira':
            return await createJiraSubtasks(this.viewer, taskID, entities);
          case 'asana':
            return await createAsanaSubtasks(this.viewer, taskID, entities);
          case 'linear':
            return await createLinearSubtasks(this.viewer, taskID, entities);
          case 'monday':
            return await createMondaySubtasks(this.viewer, taskID, entities);
          case 'trello':
            this.logger.info(
              `attaching todos to trello tasks is not supported yet`,
            );
            return null;
        }
      }),
    );
  }

  private async updateExternalSubtasks(taskID: UUID, todos: Todo[]) {
    const todoDoneState = Object.fromEntries(
      todos.map((todo) => [todo.id, todo.done]),
    );

    const externalReferences =
      await TaskThirdPartyReference.findAllForTaskTodos(
        taskID,
        Object.keys(todoDoneState),
      );

    return await Promise.all(
      externalReferences.map((externalReference): Promise<any> | null => {
        switch (externalReference.externalConnectionType) {
          case 'jira':
            return updateJiraTask(
              this.viewer,
              externalReference,
              todoDoneState[externalReference.taskTodoID!],
            );
          case 'asana':
            return updateAsanaTask(
              this.viewer,
              externalReference,
              todoDoneState[externalReference.taskTodoID!],
            );
          case 'linear':
            return updateLinearTask(
              this.viewer,
              externalReference,
              todoDoneState[externalReference.taskTodoID!],
            );
          case 'monday':
            return updateMondayTask(
              this.viewer,
              externalReference,
              todoDoneState[externalReference.taskTodoID!],
            );
          default:
            this.logger.info(
              `updating of ${externalReference.externalConnectionType} is not supported yet`,
            );
            return null;
        }
      }),
    );
  }

  // Delete any deleted todos, update existing todos, add new todos
  async setTaskTodos(taskID: string, todos: Todo[]) {
    const orgID = assertViewerHasOrg(this.viewer);
    const oldTodos = await TaskTodoEntity.findAll({
      where: {
        taskID,
        orgID,
      },
    });

    const oldTodosMap = new Map(oldTodos.map((todo) => [todo.id, todo]));
    const newTodosMap = new Map(todos.map((todo) => [todo.id, todo]));
    const todosToCreate = todos.filter(
      (newTodo) => !oldTodosMap.has(newTodo.id),
    );
    const todosToDelete = oldTodos.filter(
      (oldTodo) => !newTodosMap.has(oldTodo.id),
    );
    const todosToUpdateDone = todos.filter(
      (todo) =>
        oldTodosMap.has(todo.id) &&
        oldTodosMap.get(todo.id)!.done !== todo.done,
    );
    const promises: Promise<any>[] = [
      this.deleteTaskTodos(taskID, todosToDelete),
      this.updateTaskTodosDoneState(taskID, todosToUpdateDone),
      this.createTaskTodos(taskID, todosToCreate),
    ];
    return await Promise.all(promises);
  }
}
