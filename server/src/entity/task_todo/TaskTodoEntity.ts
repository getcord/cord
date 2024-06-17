import { Table, Column, Model, PrimaryKey } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import type { UUID } from 'common/types/index.ts';

@Table({
  tableName: 'task_todos',
  timestamps: false,
})
export class TaskTodoEntity extends Model {
  @PrimaryKey
  @Column({
    defaultValue: DataTypes.UUIDV4,
    type: DataTypes.UUID,
    primaryKey: true,
  })
  id!: UUID;

  @Column({
    type: DataTypes.UUID,
  })
  taskID!: UUID;

  @Column({
    type: DataTypes.UUID,
  })
  orgID!: UUID;

  @Column({
    type: DataTypes.BOOLEAN,
  })
  done!: boolean;

  @Column({
    type: DataTypes.TIME,
  })
  timestamp!: Date;
}
