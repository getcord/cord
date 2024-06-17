import { Table, Column, Model } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import type { UUID } from 'common/types/index.ts';

@Table({
  tableName: 'user_hidden_annotations',
  timestamps: false,
})
export class UserHiddenAnnotationsEntity extends Model {
  @Column({
    type: DataTypes.UUID,
    primaryKey: true,
  })
  userID!: UUID;

  @Column({
    type: DataTypes.UUID,
    primaryKey: true,
  })
  annotationID!: UUID;

  @Column({
    type: DataTypes.UUID,
  })
  pageContextHash!: UUID;

  @Column({
    type: DataTypes.UUID,
  })
  orgID!: UUID;
}
