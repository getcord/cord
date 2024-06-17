import { Table, Column, Model } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import type { UUID } from 'common/types/index.ts';

@Table({
  tableName: 'task_assignees',
  timestamps: false,
})
export class TaskAssigneeEntity extends Model {
  @Column({
    type: DataTypes.UUID,
    primaryKey: true,
  })
  taskID!: UUID;

  @Column({
    type: DataTypes.UUID,
    primaryKey: true,
  })
  userID!: UUID; // the user that is being assigned

  @Column({
    type: DataTypes.UUID,
  })
  orgID!: UUID;

  @Column({
    type: DataTypes.UUID,
  })
  assignerID!: UUID;

  @Column({
    type: DataTypes.TIME,
  })
  timestamp!: Date;
}
