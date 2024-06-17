import type { Viewer } from 'server/src/auth/index.ts';
import type { UUID } from 'common/types/index.ts';
import { TaskTodoEntity } from 'server/src/entity/task_todo/TaskTodoEntity.ts';

export class TaskTodoLoader {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  async loadTaskTodosNoOrgCheck(taskID: UUID): Promise<TaskTodoEntity[]> {
    return await TaskTodoEntity.findAll({
      where: { taskID },
    });
  }
}
