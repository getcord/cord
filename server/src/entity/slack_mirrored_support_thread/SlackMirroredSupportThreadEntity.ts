import { Column, Table, Model } from 'sequelize-typescript';
import { DataTypes, Sequelize } from 'sequelize';

import type { UUID } from 'common/types/index.ts';

@Table({
  tableName: 'slack_mirrored_support_threads',
  timestamps: false,
})
export class SlackMirroredSupportThreadEntity extends Model {
  @Column({
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false,
  })
  threadID!: UUID;

  @Column({
    type: DataTypes.UUID,
    allowNull: false,
  })
  threadOrgID!: UUID;

  @Column({
    type: DataTypes.UUID,
    allowNull: false,
  })
  slackOrgID!: UUID;

  @Column({
    type: DataTypes.TEXT,
    allowNull: false,
  })
  slackChannelID!: string;

  @Column({
    type: DataTypes.TEXT,
    allowNull: false,
  })
  slackMessageTimestamp!: string;

  @Column({
    type: DataTypes.TIME,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
  })
  timestamp!: Date;
}
