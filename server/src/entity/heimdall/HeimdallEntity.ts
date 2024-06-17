import { Table, Column, Model } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import type { Tier } from 'common/types/index.ts';

@Table({
  tableName: 'heimdall',
  timestamps: false,
})
export class HeimdallEntity extends Model {
  @Column({
    type: DataTypes.ENUM('prod', 'staging', 'test', 'dev'),
    allowNull: false,
    primaryKey: true,
  })
  tier!: Tier;

  @Column({
    type: DataTypes.TEXT,
    allowNull: false,
    primaryKey: true,
  })
  key!: string;

  @Column({
    type: DataTypes.BOOLEAN,
    allowNull: false,
  })
  value!: boolean; // boolean is the only value supported for now.

  isOn(): boolean {
    return this.value;
  }
}
