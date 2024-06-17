import { Table, Column, Model } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import type { UUID } from 'common/types/index.ts';

@Table({
  tableName: 'email_notifications',
  timestamps: false,
})
export class EmailOutboundNotificationEntity extends Model {
  @Column({
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  })
  id!: UUID;

  @Column({
    type: DataTypes.UUID,
    allowNull: false,
  })
  userID!: UUID;

  @Column({
    type: DataTypes.UUID,
    allowNull: false,
  })
  orgID!: UUID;

  @Column({
    type: DataTypes.UUID,
    allowNull: false,
  })
  threadOrgID!: UUID;

  @Column({
    type: DataTypes.UUID,
    allowNull: false,
  })
  threadID!: UUID;

  @Column({
    type: DataTypes.TEXT,
    allowNull: false,
  })
  email!: string;
}
