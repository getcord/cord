import DataLoader from 'dataloader';
import type { Viewer } from 'server/src/auth/index.ts';
import type { UUID } from 'common/types/index.ts';
import { TaskEntity } from 'server/src/entity/task/TaskEntity.ts';
import { inKeyOrderGroupedCustom } from 'server/src/entity/base/util.ts';

export class TaskLoader {
  dataloaderForMessage: DataLoader<UUID, TaskEntity>;

  constructor(private viewer: Viewer) {
    this.dataloaderForMessage = new DataLoader(
      async (keys) => {
        const tasks = await TaskEntity.findAll({
          where: { messageID: keys },
        });
        return inKeyOrderGroupedCustom(tasks, keys, (t) => t.messageID).map(
          // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
          (tasks) => tasks[0],
        );
      },
      { cache: false },
    );
  }

  async loadTaskForMessageNoOrgCheck(messageID: UUID) {
    return await this.dataloaderForMessage.load(messageID);
  }

  async loadTask(taskID: UUID, orgID: UUID) {
    return await TaskEntity.findOne({
      where: { id: taskID, orgID },
    });
  }
}
