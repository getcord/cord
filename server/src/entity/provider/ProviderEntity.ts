import { Table, Column, Model } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import type { UUID } from 'common/types/index.ts';

@Table({
  tableName: 'providers',
  timestamps: false,
})
export class ProviderEntity extends Model {
  @Column({
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  })
  id!: UUID;

  @Column({ type: DataTypes.STRING })
  name!: string;

  @Column({
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  })
  domains!: string[];

  @Column({
    type: DataTypes.STRING,
  })
  iconURL!: string;

  @Column({
    type: DataTypes.STRING,
  })
  nuxText!: string;

  @Column({
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  })
  mergeHashWithLocation!: boolean;

  @Column({
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  })
  disableAnnotations!: boolean;

  @Column({
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  })
  visibleInDiscoverToolsSection!: boolean;

  @Column({
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  })
  dirty!: boolean;

  async setDirty(dirty: boolean) {
    await this.update({ dirty });
  }

  @Column({
    type: DataTypes.UUID,
    defaultValue: null,
  })
  claimingApplication!: UUID | null; // the application that claimed this provider
}
