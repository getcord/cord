import { Table, Column, Model } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import type { UUID } from 'common/types/index.ts';
import { ThirdPartyConnectionDataType } from 'server/src/entity/common.ts';
import type { ThirdPartyConnectionType } from 'server/src/schema/resolverTypes.ts';

export type MondaySubscriptionDetails = {
  boardID: string;
  webhookID: string;
};

@Table({
  tableName: 'task_third_party_subscriptions',
  timestamps: false,
})
export class TaskThirdPartySubscriptionEntity extends Model {
  @Column({ type: DataTypes.UUID, primaryKey: true })
  id!: UUID;

  @Column({ type: DataTypes.UUID })
  userID!: UUID;

  @Column({ type: DataTypes.UUID })
  orgID!: UUID;

  @Column({ type: ThirdPartyConnectionDataType })
  externalConnectionType!: ThirdPartyConnectionType;

  @Column({ type: DataTypes.JSONB })
  subscriptionDetails!: MondaySubscriptionDetails;

  @Column({ type: DataTypes.TIME })
  createdTimestamp!: Date;
}
