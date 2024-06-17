import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { DataTypes, Sequelize } from 'sequelize';
import type {
  Location,
  OutboundNotificationMetadata,
  OutboundNotificationType,
  UUID,
} from 'common/types/index.ts';

@Table({
  tableName: 'message_notifications',
  timestamps: false,
})
export class MessageOutboundNotificationEntity extends Model {
  @Column({
    type: DataTypes.TEXT,
    primaryKey: true,
  })
  id!: string; // using a nano ID rather than a UUID

  @Column({
    type: DataTypes.UUID,
  })
  messageID!: UUID;

  @Column({
    type: DataTypes.ENUM(
      'slack',
      'email',
      'slackEmailMatched',
      'sharedToSlackChannel',
      'sharedToEmail',
    ),
  })
  type!: OutboundNotificationType;

  @Column({
    type: DataTypes.TEXT,
  })
  url!: string;

  @Column({
    type: DataTypes.UUID,
  })
  targetUserID!: UUID | null;
  @Column({
    type: DataTypes.UUID,
  })
  targetOrgID!: UUID;
  @Column({
    type: DataType.TIME,
    allowNull: false,
    defaultValue: Sequelize.literal('NOW()'),
  })
  timestamp!: Date;
  @Column({
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  metadata!: OutboundNotificationMetadata;

  @Column({
    type: DataTypes.UUID,
    allowNull: true,
  })
  sharerUserID!: UUID | null;

  @Column({
    type: DataTypes.UUID,
    allowNull: true,
  })
  sharerOrgID!: UUID | null;

  @Column({
    type: DataTypes.JSONB,
  })
  location!: Location | null;
}
