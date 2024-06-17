import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { DataTypes } from 'sequelize';
import { Column, Model, PrimaryKey, Table } from 'sequelize-typescript';
import type { UUID } from 'common/types/index.ts';

const PermissionValues = [
  'thread:read',
  'thread:send-message',
  'thread-participant:read',
  'message:read',
] as const;
export type Permission = (typeof PermissionValues)[number];

@Table({
  tableName: 'permission_rules',
  timestamps: false,
})
export class PermissionRuleEntity extends Model<
  InferAttributes<PermissionRuleEntity>,
  InferCreationAttributes<PermissionRuleEntity>
> {
  @PrimaryKey
  @Column({
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
  })
  id!: CreationOptional<UUID>;

  @Column({ type: DataTypes.UUID, allowNull: false })
  platformApplicationID!: UUID;

  @Column({ type: DataTypes.STRING, allowNull: false })
  resourceSelector!: string; // Actually a jsonpath.

  @Column({ type: DataTypes.STRING, allowNull: false })
  userSelector!: string; // Actually a jsonpath.

  @Column({
    type: DataTypes.ARRAY(DataTypes.ENUM(...PermissionValues)),
    allowNull: false,
  })
  permissions!: Permission[];
}
