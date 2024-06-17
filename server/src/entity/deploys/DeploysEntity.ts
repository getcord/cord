import { Table, Column, PrimaryKey, Model } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import type { Tier, UUID } from 'common/types/index.ts';

@Table({
  tableName: 'deploys',
  timestamps: false,
})
export class DeploysEntity extends Model {
  @PrimaryKey
  @Column({
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
  })
  id!: UUID;

  @Column({
    type: DataTypes.ENUM('prod', 'staging', 'test', 'dev'),
  })
  tier!: Tier;

  @Column({
    type: DataTypes.DATE,
  })
  deployStartTime!: Date;

  @Column({
    type: DataTypes.TIME,
  })
  deployFinishTime!: Date | null;

  @Column({
    type: DataTypes.BOOLEAN,
  })
  success!: boolean | null;

  @Column({
    type: DataTypes.TEXT,
  })
  error!: string | null;

  @Column({
    type: DataTypes.TEXT,
  })
  gitCommitHash!: string | null;

  @Column({
    type: DataTypes.TEXT,
  })
  dockerImage!: string;

  @Column({
    type: DataTypes.TEXT,
  })
  packageVersion!: string | null;
}
