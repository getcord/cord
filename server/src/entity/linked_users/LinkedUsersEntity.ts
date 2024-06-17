import { Table, Column, Model } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import type { UUID } from 'common/types/index.ts';

@Table({
  tableName: 'linked_users',
  timestamps: false,
})
export class LinkedUsersEntity extends Model {
  @Column({
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false,
  })
  sourceUserID!: UUID;

  @Column({
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false,
  })
  sourceOrgID!: UUID;

  @Column({
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false,
  })
  linkedUserID!: UUID;

  @Column({
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false,
  })
  linkedOrgID!: UUID;

  @Column({
    type: DataTypes.TIME,
  })
  linkedTimestamp!: Date;
}
