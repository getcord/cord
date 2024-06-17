import { Table, Column, PrimaryKey, Model } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import type {
  AdminCRTComingFrom,
  AdminCRTCommunicationStatus,
  AdminCRTDecision,
  AdminCRTIssueType,
  AdminCRTPriority,
  UUID,
} from 'common/types/index.ts';

@Table({
  tableName: 'admin_crt_customer_issues',
  timestamps: false,
})
export class AdminCRTCustomerIssueEntity extends Model {
  @PrimaryKey
  @Column({
    defaultValue: DataTypes.UUIDV4,
    type: DataTypes.UUID,
  })
  id!: UUID;

  @Column({
    type: DataTypes.UUID,
  })
  customerID!: UUID;

  @Column({
    type: DataTypes.TEXT,
  })
  title!: string;

  @Column({
    type: DataTypes.TEXT,
  })
  body!: string;

  @Column({
    type: DataTypes.ENUM('them', 'us'),
  })
  comingFrom!: AdminCRTComingFrom;

  @Column({
    type: DataTypes.ENUM('done', 'pending', 'accepted', 'rejected'),
  })
  decision!: AdminCRTDecision;

  @Column({
    type: DataTypes.ENUM(
      'none',
      'request_acked',
      'decision_sent',
      'decision_acked',
    ),
  })
  communicationStatus!: AdminCRTCommunicationStatus;

  @Column({
    type: DataTypes.TIME,
    allowNull: true,
  })
  lastTouch!: Date | null;

  @Column({
    type: DataTypes.ENUM('request', 'bug', 'onboarding_step'),
    allowNull: true,
  })
  type!: AdminCRTIssueType;

  @Column({
    type: DataTypes.ENUM('blocker', 'high', 'low'),
    allowNull: true,
  })
  priority!: AdminCRTPriority;

  @Column({
    type: DataTypes.UUID,
    allowNull: true,
  })
  assignee!: UUID | null;

  @Column({
    type: DataTypes.TIME,
  })
  createdTimestamp!: Date;

  @Column({
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  })
  externallyVisible!: boolean;
}
