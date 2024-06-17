import { Table, Column, Model } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import type { UUID } from 'common/types/index.ts';

@Table({
  tableName: 'admin_go_redirects',
  timestamps: false,
})
export class AdminGoRedirectEntity extends Model {
  @Column({
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  })
  id!: UUID;

  @Column({
    type: DataTypes.TEXT,
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataTypes.TEXT,
    allowNull: false,
  })
  url!: string;

  @Column({
    type: DataTypes.UUID,
    allowNull: false,
  })
  creatorUserID!: UUID;

  @Column({
    type: DataTypes.UUID,
    allowNull: false,
  })
  updaterUserID!: UUID;

  @Column({
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  redirectCount!: number;
}

const RESERVED_NAMES = ['name', 'edit'];
const MAX_REDIRECT_NAME_LENGTH = 40;

export function isValidRedirectName(name: string): boolean {
  return (
    !RESERVED_NAMES.includes(name) &&
    !!name.match(/^[a-z0-9_-]+$/) &&
    name.length <= MAX_REDIRECT_NAME_LENGTH
  );
}

export function canonicalizeRedirectName(name: string): string {
  return name.toLowerCase();
}
