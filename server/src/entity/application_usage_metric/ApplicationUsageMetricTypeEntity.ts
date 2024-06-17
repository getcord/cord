import { Table, Column, Model } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';

import type { UUID } from 'common/types/index.ts';
@Table({
  tableName: 'application_usage_metric_types',
  timestamps: false,
})
export class ApplicationUsageMetricTypeEntity extends Model {
  @Column({
    type: DataTypes.UUID,
    primaryKey: true,
  })
  id!: UUID;

  @Column({
    type: DataTypes.TEXT,
    allowNull: false,
  })
  metric!: string;
}
