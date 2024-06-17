import { Table, Column, Model } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import type {
  UUID,
  ProviderRuleMatchPatterns,
  PageContextTransformation,
  ProviderRuleType,
} from 'common/types/index.ts';

@Table({
  tableName: 'provider_rules',
  timestamps: false,
})
export class ProviderRuleEntity extends Model {
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
    type: DataTypes.ENUM('deny', 'allow'),
    defaultValue: 'allow',
  })
  type!: ProviderRuleType;

  @Column({ type: DataTypes.SMALLINT })
  order!: number;

  @Column({
    type: DataTypes.JSONB,
    defaultValue: {},
  })
  matchPatterns!: ProviderRuleMatchPatterns;

  @Column({
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  })
  observeDOMMutations!: boolean;

  @Column({
    type: DataTypes.TEXT,
  })
  nameTemplate!: string | null;

  @Column({
    type: DataTypes.JSONB,
  })
  contextTransformation!: PageContextTransformation;
}
