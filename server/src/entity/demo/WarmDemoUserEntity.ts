import { Table, Column, PrimaryKey, Model } from 'sequelize-typescript';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { DataTypes } from 'sequelize';
import type { UUID } from 'common/types/index.ts';

@Table({
  tableName: 'warm_demo_users',
  timestamps: false,
})
export class WarmDemoUserEntity extends Model<
  InferAttributes<WarmDemoUserEntity>,
  InferCreationAttributes<WarmDemoUserEntity>
> {
  @PrimaryKey
  @Column({
    defaultValue: DataTypes.UUIDV4,
    type: DataTypes.UUID,
  })
  id!: CreationOptional<UUID>;

  @Column({
    type: DataTypes.TEXT,
    allowNull: false,
  })
  demoGroup!: string;

  @Column({
    type: DataTypes.INTEGER,
    allowNull: false,
  })
  version!: number;

  @Column({
    type: DataTypes.UUID,
    allowNull: false,
  })
  platformApplicationID!: UUID;

  @Column({
    type: DataTypes.TEXT,
    allowNull: false,
  })
  userID!: string;

  @Column({
    type: DataTypes.TEXT,
    allowNull: false,
  })
  orgID!: string;
}
