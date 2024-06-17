import { Table, Column, Model } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import type { UUID } from 'common/types/index.ts';

@Table({
  tableName: 'admin_crt_customer_issue_subscriptions',
  timestamps: false,
})
export class AdminCRTCustomerIssueSubscriptionEntity extends Model {
  @Column({
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false,
  })
  issueID!: UUID;

  @Column({
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false,
  })
  userID!: UUID;
}
