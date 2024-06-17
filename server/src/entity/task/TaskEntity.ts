import { Table, Column, Model, PrimaryKey } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import type { UUID } from 'common/types/index.ts';

@Table({
  tableName: 'tasks',
  timestamps: false,
})
export class TaskEntity extends Model {
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
  messageID!: UUID;

  @Column({
    type: DataTypes.UUID,
  })
  orgID!: UUID;

  @Column({
    type: DataTypes.BOOLEAN,
  })
  done!: boolean;

  @Column({
    type: DataTypes.UUID,
  })
  doneStatusLastUpdatedBy!: UUID | null;

  @Column({
    type: DataTypes.TIME,
  })
  timestamp!: Date;
}
