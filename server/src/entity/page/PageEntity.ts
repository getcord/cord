import { Table, Column, Model } from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes } from 'sequelize';
import { DataTypes } from 'sequelize';

import type { UUID, Location, PageContext } from 'common/types/index.ts';

@Table({
  tableName: 'pages',
  timestamps: false,
})
export class PageEntity extends Model<
  InferAttributes<PageEntity, { omit: 'pageContext' }>,
  InferCreationAttributes<PageEntity, { omit: 'pageContext' }>
> {
  @Column({
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    unique: 'orgID-providerID-contextHash-unique',
  })
  orgID!: UUID;

  @Column({
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    unique: 'orgID-providerID-contextHash-unique',
  })
  contextHash!: UUID;

  @Column({
    type: DataTypes.UUID,
    allowNull: true,
    unique: 'orgID-providerID-contextHash-unique',
  })
  providerID!: UUID | null;

  @Column({
    type: DataTypes.JSONB,
    allowNull: false,
  })
  contextData!: Location;

  get pageContext(): PageContext {
    return {
      data: this.contextData,
      providerID: this.providerID,
    };
  }
}
