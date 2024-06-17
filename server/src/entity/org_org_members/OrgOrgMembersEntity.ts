import { Table, Column, Model } from 'sequelize-typescript';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { DataTypes } from 'sequelize';
import type { UUID } from 'common/types/index.ts';

@Table({
  tableName: 'org_org_members',
  timestamps: false,
})
export class OrgOrgMembersEntity extends Model<
  InferAttributes<OrgOrgMembersEntity>,
  InferCreationAttributes<OrgOrgMembersEntity>
> {
  @Column({
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false,
  })
  childOrgID!: UUID;

  @Column({
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false,
  })
  parentOrgID!: UUID;

  @Column({
    type: DataTypes.UUID,
    allowNull: false,
  })
  platformApplicationID!: UUID;

  @Column({
    type: DataTypes.TIME,
  })
  createdTimestamp!: CreationOptional<Date>;
}
