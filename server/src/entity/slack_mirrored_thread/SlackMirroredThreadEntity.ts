import { Table, Column, Model } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import type { UUID } from 'common/types/index.ts';

@Table({
  tableName: 'slack_mirrored_threads',
  timestamps: false,
})
export class SlackMirroredThreadEntity extends Model {
  @Column({
    type: DataTypes.UUID,
    primaryKey: true,
  })
  threadID!: UUID;

  @Column({
    type: DataTypes.UUID,
  })
  threadOrgID!: UUID;

  @Column({
    type: DataTypes.UUID,
  })
  slackOrgID!: UUID;

  @Column({
    type: DataTypes.TEXT,
  })
  slackChannelID!: string;

  @Column({
    type: DataTypes.TEXT,
  })
  slackMessageTimestamp!: string;

  @Column({
    type: DataTypes.TIME,
  })
  timestamp!: Date;
}
