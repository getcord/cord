import { Table, Column, Model } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import type {
  UUID,
  JsonObject,
  ProviderRuleTestMatchType,
} from 'common/types/index.ts';

@Table({
  tableName: 'provider_rule_tests',
  timestamps: false,
})
export class ProviderRuleTestEntity extends Model {
  @Column({
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  })
  id!: UUID;

  @Column({
    type: DataTypes.UUID,
  })
  providerID!: UUID;

  @Column({
    type: DataTypes.TEXT,
  })
  url!: string;

  @Column({
    type: DataTypes.TEXT,
  })
  documentHTML!: string | null;

  @Column({
    type: DataTypes.ENUM('allow', 'deny', 'none'),
  })
  expectedMatch!: ProviderRuleTestMatchType;

  @Column({
    type: DataTypes.TEXT,
  })
  expectedName!: string | null;

  @Column({
    type: DataTypes.JSONB,
  })
  expectedContextData!: JsonObject | null;
}
