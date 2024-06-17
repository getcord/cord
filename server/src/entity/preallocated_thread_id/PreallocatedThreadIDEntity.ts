import { Table, Column, Model } from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes } from 'sequelize';
import { DataTypes } from 'sequelize';

import type { UUID } from 'common/types/index.ts';

@Table({
  tableName: 'preallocated_thread_ids',
  timestamps: false,
})
export class PreallocatedThreadIDEntity extends Model<
  InferAttributes<PreallocatedThreadIDEntity>,
  InferCreationAttributes<PreallocatedThreadIDEntity>
> {
  @Column({
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
  })
  id!: UUID;

  @Column({
    type: DataTypes.TEXT,
    allowNull: false,
  })
  externalID!: string;

  @Column({
    type: DataTypes.UUID,
    allowNull: false,
  })
  platformApplicationID!: UUID;
}
