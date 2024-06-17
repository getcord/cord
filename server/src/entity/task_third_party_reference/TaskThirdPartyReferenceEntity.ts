import { Table, Column, Model } from 'sequelize-typescript';
import { DataTypes, Op } from 'sequelize';
import type { UUID, TaskPreviewData } from 'common/types/index.ts';
import { ThirdPartyConnectionDataType } from 'server/src/entity/common.ts';
import type { ThirdPartyConnectionType } from 'server/src/schema/resolverTypes.ts';

@Table({
  tableName: 'task_third_party_references',
  timestamps: false,
})
export class TaskThirdPartyReference extends Model {
  @Column({ type: DataTypes.UUID, primaryKey: true })
  taskID!: UUID;

  @Column({ type: DataTypes.UUID })
  taskTodoID!: UUID | null;

  @Column({ type: DataTypes.TEXT, primaryKey: true })
  externalID!: string;

  @Column({ type: ThirdPartyConnectionDataType, primaryKey: true })
  externalConnectionType!: ThirdPartyConnectionType;

  @Column({ type: DataTypes.TEXT })
  externalLocationID!: string | null;

  @Column({ type: DataTypes.JSONB })
  previewData!: TaskPreviewData | null;

  @Column({ type: DataTypes.BOOLEAN })
  imported!: boolean;

  static async findForTask(
    taskID: UUID,
    externalConnectionType: ThirdPartyConnectionType,
  ): Promise<TaskThirdPartyReference | null> {
    return await TaskThirdPartyReference.findOne({
      where: {
        taskID,
        taskTodoID: null,
        externalConnectionType,
      },
    });
  }

  static async findAllForTask(taskID: UUID) {
    return await TaskThirdPartyReference.findAll({
      where: {
        taskID,
        taskTodoID: { [Op.is]: null },
      },
    });
  }

  static async findAllForTaskTodos(taskID: UUID, taskTodoIDs: UUID[]) {
    return await TaskThirdPartyReference.findAll({
      where: {
        taskID,
        taskTodoID: taskTodoIDs,
      },
    });
  }

  static async findTaskWithExternalID(
    externalID: string,
    externalConnectionType: ThirdPartyConnectionType,
  ) {
    return await TaskThirdPartyReference.findOne({
      where: {
        externalID,
        externalConnectionType,
        taskTodoID: { [Op.is]: null },
      },
    });
  }
}
