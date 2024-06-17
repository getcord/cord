import { Table, Column, Model } from 'sequelize-typescript';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { DataTypes, Sequelize } from 'sequelize';

import type {
  EntityMetadata,
  ThreadSupportStatusType,
  UUID,
} from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { assertViewerHasIdentity } from 'server/src/auth/index.ts';
import { OrgMembersLoader } from 'server/src/entity/org_members/OrgMembersLoader.ts';

@Table({
  tableName: 'threads',
  timestamps: false,
})
export class ThreadEntity extends Model<
  InferAttributes<ThreadEntity>,
  InferCreationAttributes<ThreadEntity>
> {
  @Column({
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
  })
  id!: UUID;

  @Column({
    type: DataTypes.UUID,
    allowNull: false,
  })
  orgID!: UUID;

  @Column({
    type: DataTypes.TEXT,
  })
  name!: string;

  @Column({
    type: DataTypes.TIME,
  })
  resolvedTimestamp!: Date | null;

  @Column({
    type: DataTypes.UUID,
  })
  resolverUserID!: UUID | null;

  @Column({
    type: DataTypes.TEXT,
    allowNull: false,
  })
  url!: string;

  @Column({
    type: DataTypes.ENUM('open', 'closed'),
    defaultValue: null,
  })
  supportStatus!: ThreadSupportStatusType | null;

  @Column({
    type: DataTypes.TEXT,
  })
  externalID!: CreationOptional<string>;

  @Column({
    type: DataTypes.UUID,
    allowNull: false,
  })
  platformApplicationID!: UUID;

  @Column({
    type: DataTypes.UUID,
    allowNull: false,
  })
  pageContextHash!: UUID;

  @Column({
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: Sequelize.literal('NOW()'),
  })
  createdTimestamp!: CreationOptional<Date>;

  @Column({
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  metadata!: CreationOptional<EntityMetadata>;

  @Column({
    type: DataTypes.TEXT,
  })
  extraClassnames!: string | null;

  public async belongsToViewerOrgs(viewer: Viewer): Promise<boolean> {
    const { orgID } = assertViewerHasIdentity(viewer);

    if (this.orgID === orgID) {
      return true;
    }

    // In some cases (e.g. unified inbox) we may be looking for a thread from an
    // org the user is a member of, but not currently logged in as
    const orgMembersLoader = new OrgMembersLoader(viewer);

    return await orgMembersLoader.viewerCanAccessOrg(this.orgID);
  }
}
