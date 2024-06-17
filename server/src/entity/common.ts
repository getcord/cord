import { DataTypes, Sequelize } from 'sequelize';
import type { UUID } from 'common/types/index.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { assertUUID } from 'common/util/index.ts';

// TODO: shouldn't this somehow reference the third_party_connection ENUM type we created in postgres?
export const ThirdPartyConnectionDataType = DataTypes.ENUM(
  'asana',
  'jira',
  'linear',
);

export const MAX_IDS_PER_QUERY = 1000;

export type UserOrgID = {
  userID: UUID;
  orgID: UUID;
};

export function keyFor(userOrgID: UserOrgID): string {
  return `${userOrgID.userID}/${userOrgID.orgID}`;
}

export type PlatformID = {
  platformApplicationID: UUID;
  externalID: string;
};

export function keyForPlatformID(platformID: PlatformID): string {
  return `${platformID.platformApplicationID}/${platformID.externalID}`;
}

// there doesn't seem to be any sequelize-specific way to construct such a subquery
// https://github.com/sequelize/sequelize/issues/2325
// so I'm doing the best I can to not hardcode table and column names in here and to
// ensure we're safe from SQL injection
export const timestampSubquery = (id: UUID) =>
  Sequelize.literal(
    `(
      SELECT "timestamp"
      FROM "${MessageEntity.tableName}"
      WHERE "id" = '${assertUUID(id)}'
    )`,
  );
