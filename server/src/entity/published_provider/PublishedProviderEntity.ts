import { Table, Column, Model } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import type { RuleProvider, UUID } from 'common/types/index.ts';

@Table({
  tableName: 'published_providers',
  timestamps: false,
})
export class PublishedProviderEntity extends Model {
  @Column({
    type: DataTypes.UUID,
    primaryKey: true,
  })
  providerID!: UUID;

  @Column({
    type: DataTypes.TIME,
  })
  lastPublishedTimestamp!: Date;

  @Column({
    type: DataTypes.JSONB,
  })
  ruleProvider!: RuleProvider;
}
