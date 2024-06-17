import { Table, Column, Model } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import type { UUID } from 'common/types/index.ts';

@Table({
  tableName: 'slack_channels',
  timestamps: false,
})
export class SlackChannelEntity extends Model {
  @Column({
    type: DataTypes.UUID,
    primaryKey: true,
  })
  orgID!: UUID;

  @Column({
    type: DataTypes.TEXT,
    primaryKey: true,
  })
  slackID!: string;

  @Column({
    type: DataTypes.TEXT,
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataTypes.BOOLEAN,
  })
  added!: boolean;

  @Column({
    type: DataTypes.BOOLEAN,
  })
  archived!: boolean;

  @Column({
    type: DataTypes.NUMBER,
    allowNull: false,
  })
  users!: number;
}
