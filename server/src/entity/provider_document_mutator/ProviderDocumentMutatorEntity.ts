import { Table, Column, Model } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import type {
  CSSMutatorConfig,
  UUID,
  ProviderDocumentMutatorType,
} from 'common/types/index.ts';
import { DEFAULT_CSS_MUTATOR_CONFIG } from 'common/const/Styles.ts';

@Table({
  tableName: 'provider_document_mutators',
  timestamps: false,
})
export class ProviderDocumentMutatorEntity extends Model {
  @Column({
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  })
  id!: UUID;

  @Column({ type: DataTypes.UUID })
  providerID!: UUID;

  @Column({
    type: DataTypes.ENUM('custom_css', 'fixed_elements', 'default_css'),
  })
  type!: ProviderDocumentMutatorType;

  @Column({ type: DataTypes.JSONB })
  config!: CSSMutatorConfig | null;

  populateDefaultCSS() {
    if (this.type === 'default_css') {
      this.config = DEFAULT_CSS_MUTATOR_CONFIG;
    }
  }
}
