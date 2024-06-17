import type { Request, Response } from 'express';
import type { WhereOptions } from 'sequelize';
import { Op } from 'sequelize';
import type {
  ServerListGroupMember,
  ServerListGroupMembers,
} from '@cord-sdk/types';
import { AuthProviderType } from 'server/src/auth/index.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import {
  ApiCallerError,
  forwardHandlerExceptionsToNext,
} from 'server/src/public/routes/platform/util.ts';
import { isValidExternalID } from 'common/util/externalIDs.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import {
  validateLimit,
  validatePaginationToken,
} from 'server/src/public/routes/platform/validateQuery.ts';

const DEFAULT_LIMIT = 1000;

interface PaginationToken {
  userID: string;
  externalID: string;
}

function encodeToken(token: PaginationToken): string {
  return btoa(JSON.stringify(token));
}

async function listOrganizationMembersHandler(req: Request, res: Response) {
  const platformApplicationID = req.appID;
  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_access_token');
  }

  const externalID = req.params.orgID;
  if (!externalID) {
    throw new ApiCallerError('group_not_found');
  }

  if (!isValidExternalID(externalID)) {
    throw new ApiCallerError('invalid_request');
  }

  const org = await OrgEntity.findOne({
    where: {
      externalID,
      externalProvider: AuthProviderType.PLATFORM,
      platformApplicationID,
    },
  });

  if (!org) {
    throw new ApiCallerError('group_not_found', { code: 404 });
  }

  const where: WhereOptions<OrgMembersEntity> = {
    orgID: org.id,
  };

  const { token, limit } = req.query;

  const decodedToken: PaginationToken | undefined = validatePaginationToken({
    token,
    endpoint: 'org-members',
  });
  const parsedLimit = validateLimit(limit, DEFAULT_LIMIT);

  const whereWithPagination: WhereOptions<OrgMembersEntity> = {
    ...where,
    ...(decodedToken && { userID: { [Op.gt]: decodedToken.userID } }),
  };

  const [members, membersCount, membersRemainingCount] = await Promise.all([
    OrgMembersEntity.findAll({
      where: whereWithPagination,
      order: [['userID', 'ASC']],
      limit: parsedLimit,
    }),
    OrgMembersEntity.count({
      where,
    }),
    OrgMembersEntity.count({
      where: whereWithPagination,
    }),
  ]);

  const remaining = Math.max(membersRemainingCount - members.length, 0);

  const memberUserIDs = members.map((member) => member.userID);

  const users = await UserEntity.findAll({
    where: {
      id: memberUserIDs,
      platformApplicationID,
    },
    order: [['id', 'ASC']],
  });

  if (members.length > users.length) {
    // This should never happen
    throw new ApiCallerError('group_members_missing');
  }

  const lastMember = users.length === 0 ? null : users[users.length - 1];

  const returnToken =
    remaining > 0 && lastMember
      ? encodeToken({
          userID: lastMember.id,
          // Adding the externalID is purely to get over the validating pagination token
          externalID: lastMember.externalID,
        })
      : null;

  const result: ServerListGroupMembers = {
    users: users.map(
      (user): ServerListGroupMember => ({
        id: user.externalID,
        email: user.email,
        status: user.state,
        name: user.name,
        shortName: user.screenName,
        profilePictureURL: user.profilePictureURL,
        metadata: user.metadata,
        createdTimestamp: user.createdTimestamp,
      }),
    ),
    pagination: {
      token: returnToken,
      total: membersCount,
    },
  };

  return res.status(200).json(result);
}

export default forwardHandlerExceptionsToNext(listOrganizationMembersHandler);
