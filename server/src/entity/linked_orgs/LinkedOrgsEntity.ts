import { Table, Column, Model } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import type { UUID } from 'common/types/index.ts';
import type { AuthProviderType } from 'server/src/auth/index.ts';

@Table({
  tableName: 'linked_orgs',
  timestamps: false,
})
export class LinkedOrgsEntity extends Model {
  @Column({
    type: DataTypes.UUID,
    primaryKey: true,
    unique: true,
  })
  sourceOrgID!: UUID;

  @Column({
    type: DataTypes.ENUM('slack', 'platform'),
  })
  sourceExternalProvider!: AuthProviderType;

  @Column({
    type: DataTypes.UUID,
    primaryKey: true,
  })
  linkedOrgID!: UUID;

  @Column({
    type: DataTypes.ENUM('slack', 'platform'),
  })
  linkedExternalProvider!: AuthProviderType;

  @Column({
    type: DataTypes.UUID,
  })
  mergerUserID!: UUID;

  @Column({
    type: DataTypes.TIME,
  })
  linkedTimestamp!: Date;
}
