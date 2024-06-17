import { Table, Column, Model } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';

import type { UUID } from 'common/types/index.ts';

@Table({
  tableName: 'application_usage_metrics',
  timestamps: false,
})
export class ApplicationUsageMetricEntity extends Model {
  @Column({
    type: DataTypes.UUID,
    primaryKey: true,
  })
  applicationID!: UUID;

  @Column({
    type: DataTypes.UUID,
    primaryKey: true,
  })
  metricID!: UUID;

  @Column({
    type: DataTypes.DATE,
    primaryKey: true,
  })
  date!: string;

  @Column({
    type: DataTypes.INTEGER,
    allowNull: false,
  })
  value!: number;
}
