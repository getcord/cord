import { Table, Column, Model } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import type { UUID } from 'common/types/index.ts';
import { ThirdPartyConnectionDataType } from 'server/src/entity/common.ts';
import type { ThirdPartyConnectionType } from 'server/src/schema/resolverTypes.ts';

export type JiraAuthData = {
  cloudID: string;
  refreshToken: string;
};

export type AsanaAuthData = {
  workspace: string;
  refreshToken: string;
};

export type LinearAuthData = {
  // An access token is used instead of a refresh token because
  // Linear provides access tokens that last 10 years instead of
  // using refresh tokens.
  // A user can have a max of 10 tokens per application and scope
  // configuration. If the 11th token is requested then the oldest
  // token is automatically revoked.
  accessToken: string;
};

export type TrelloAuthData = {
  // An access token is given by trello which never expires
  accessToken: string;
  accessTokenSecret: string;
};

export type MondayAuthData = {
  // Monday supplies access tokens that don't expire
  accessToken: string;
};

@Table({
  tableName: 'third_party_connections',
  timestamps: false,
})
export class ThirdPartyConnectionEntity extends Model {
  @Column({ type: DataTypes.UUID, primaryKey: true })
  userID!: UUID;

  @Column({ type: DataTypes.UUID, primaryKey: true })
  orgID!: UUID;

  @Column({ type: ThirdPartyConnectionDataType, primaryKey: true })
  type!: ThirdPartyConnectionType;

  @Column({ type: DataTypes.TEXT })
  externalID!: string;

  @Column({ type: DataTypes.TEXT })
  externalEmail!: string;

  @Column({ type: DataTypes.JSONB })
  externalAuthData!:
    | JiraAuthData
    | AsanaAuthData
    | LinearAuthData
    | TrelloAuthData
    | MondayAuthData
    | null;

  @Column({ type: DataTypes.TIME })
  connectedTimestamp!: Date;
}
