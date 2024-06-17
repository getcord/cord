import { Table, Column, PrimaryKey, Model } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import type { JsonValue, UUID } from 'common/types/index.ts';

export type AdminCRTIssueChangeDetail = {
  created?: boolean;
  updated?: Array<{
    field: string;
    oldValue: JsonValue;
    newValue: JsonValue;
  }>;
};

@Table({
  tableName: 'admin_crt_customer_issue_changes',
  timestamps: false,
})
export class AdminCRTCustomerIssueChangeEntity extends Model {
  @PrimaryKey
  @Column({
    defaultValue: DataTypes.UUIDV4,
    type: DataTypes.UUID,
  })
  id!: UUID;

  @Column({
    type: DataTypes.UUID,
  })
  issueID!: UUID;

  @Column({
    type: DataTypes.UUID,
  })
  userID!: UUID;

  @Column({
    type: DataTypes.JSONB,
  })
  changeDetail!: AdminCRTIssueChangeDetail;

  @Column({
    type: DataTypes.TIME,
  })
  timestamp!: Date;
}
