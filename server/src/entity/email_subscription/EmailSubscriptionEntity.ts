import { Table, Column, Model } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import type { UUID } from 'common/types/index.ts';

@Table({
  tableName: 'email_subscription',
  timestamps: false,
})
export class EmailSubscriptionEntity extends Model {
  @Column({
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
  })
  userID!: UUID;

  @Column({
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
  })
  threadID!: UUID;

  @Column({
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  subscribed!: boolean;
}
