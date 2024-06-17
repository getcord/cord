import { Table, Column, Model } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import type { UUID } from 'common/types/index.ts';

@Table({
  tableName: 'slack_messages',
  timestamps: false,
})
export class SlackMessageEntity extends Model {
  @Column({
    type: DataTypes.UUID,
  })
  slackOrgID!: UUID;

  @Column({
    type: DataTypes.TEXT,
    primaryKey: true,
  })
  slackChannelID!: string;

  @Column({
    type: DataTypes.TEXT,
    primaryKey: true,
  })
  slackMessageTimestamp!: string;

  @Column({
    type: DataTypes.UUID,
  })
  messageID!: UUID;

  @Column({
    type: DataTypes.UUID,
  })
  sharerOrgID!: UUID;

  @Column({
    type: DataTypes.UUID,
  })
  sharerUserID!: UUID;

  @Column({
    type: DataTypes.TIME,
  })
  timestamp!: Date;
}
