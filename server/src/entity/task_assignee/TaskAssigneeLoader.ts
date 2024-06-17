import type { Viewer } from 'server/src/auth/index.ts';
import type { UUID } from 'common/types/index.ts';
import { TaskAssigneeEntity } from 'server/src/entity/task_assignee/TaskAssigneeEntity.ts';

export class TaskAssigneeLoader {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  async loadTaskAssigneesForTaskNoOrgCheck(taskID: UUID) {
    return await TaskAssigneeEntity.findAll({
      where: { taskID },
    });
  }
}
