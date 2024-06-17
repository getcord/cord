import { Table, Column, Model } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import type { UUID } from 'common/types/index.ts';

@Table({
  tableName: 'page_visitors',
  timestamps: false,
})
export class PageVisitorEntity extends Model {
  @Column({
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
  })
  pageContextHash!: UUID;

  @Column({
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
  })
  userID!: UUID;

  @Column({
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
  })
  orgID!: UUID;

  @Column({
    type: DataTypes.TIME,
  })
  lastPresentTimestamp!: Date;
}
