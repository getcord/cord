import { Table, Column, Model } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import type { PreferencesValueType, UUID } from 'common/types/index.ts';

@Table({
  tableName: 'user_preferences',
  timestamps: false,
})
export class UserPreferenceEntity extends Model {
  @Column({
    type: DataTypes.UUID,
    primaryKey: true,
  })
  userID!: UUID;

  @Column({
    type: DataTypes.TEXT,
    primaryKey: true,
  })
  key!: string;

  @Column({
    type: DataTypes.JSONB,
  })
  value!: PreferencesValueType;
}
