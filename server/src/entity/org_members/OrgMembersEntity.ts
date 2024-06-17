import { Table, Column, Model } from 'sequelize-typescript';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { DataTypes } from 'sequelize';
import type { UUID } from 'common/types/index.ts';

@Table({
  tableName: 'org_members',
  timestamps: false,
})
export class OrgMembersEntity extends Model<
  InferAttributes<OrgMembersEntity>,
  InferCreationAttributes<OrgMembersEntity>
> {
  @Column({
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false,
  })
  userID!: UUID;

  @Column({
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false,
  })
  orgID!: UUID;

  @Column({
    type: DataTypes.UUID,
    allowNull: true,
  })
  platformApplicationID!: UUID | null;

  @Column({
    type: DataTypes.TIME,
  })
  createdTimestamp!: CreationOptional<Date>;
}
