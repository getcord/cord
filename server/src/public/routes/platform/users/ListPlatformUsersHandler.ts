import type { Request, Response } from 'express';
import type { WhereOptions } from 'sequelize';
import { Op } from 'sequelize';
import { AuthProviderType } from 'server/src/auth/index.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import {
  forwardHandlerExceptionsToNext,
  ApiCallerError,
} from 'server/src/public/routes/platform/util.ts';
import {
  validateFilter,
  validateLimit,
  validatePaginationToken,
} from 'server/src/public/routes/platform/validateQuery.ts';
import type { ServerListUser, ServerListUsers } from '@cord-sdk/types';

const DEFAULT_LIMIT = 1000;
interface PaginationToken {
  externalID: string;
}

function encodeToken(token: PaginationToken): string {
  return btoa(JSON.stringify(token));
}

async function listPlatformUsersHandler(req: Request, res: Response) {
  const platformApplicationID = req.appID;
  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_access_token');
  }

  const { metadata } = validateFilter(req.query, {
    location: false,
    metadata: true,
    firstMessageTimestamp: false,
    mostRecentMessageTimestamp: false,
    groupID: false,
    authorID: false,
    resolvedStatus: false,
    viewer: false,
  });

  const where: WhereOptions<UserEntity> = {
    platformApplicationID,
    externalProvider: AuthProviderType.PLATFORM,
    ...(metadata && {
      metadata: {
        [Op.contains]: metadata,
      },
    }),
  };

  const { token, limit } = req.query;

  const decodedToken: PaginationToken | undefined = validatePaginationToken({
    token,
    endpoint: 'users',
  });

  const parsedLimit = validateLimit(limit, DEFAULT_LIMIT);

  const whereWithPagination: WhereOptions<UserEntity> = {
    ...where,
    ...(decodedToken && { externalID: { [Op.gt]: decodedToken.externalID } }),
  };

  const [users, usersCount, usersRemainingCount] = await Promise.all([
    UserEntity.findAll({
      where: whereWithPagination,
      order: [['externalID', 'ASC']],
      limit: parsedLimit,
    }),
    UserEntity.count({
      where,
    }),
    UserEntity.count({
      where: whereWithPagination,
    }),
  ]);

  const lastUser = users.length === 0 ? null : users[users.length - 1];
  const remaining = Math.max(usersRemainingCount - users.length, 0);

  const returnToken =
    remaining > 0 && lastUser
      ? encodeToken({
          externalID: lastUser.externalID,
        })
      : null;

  const result: ServerListUsers = {
    users: users.map(
      (user): ServerListUser => ({
        id: user.externalID,
        email: user.email,
        status: user.state,
        name: user.name,
        shortName: user.screenName,
        short_name: user.screenName,
        first_name: null,
        last_name: null,
        profilePictureURL: user.profilePictureURL,
        profile_picture_url: user.profilePictureURL,
        metadata: user.metadata,
        createdTimestamp: user.createdTimestamp,
      }),
    ),
    pagination: {
      token: returnToken,
      total: usersCount,
    },
  };

  return res.status(200).json(result);
}

export default forwardHandlerExceptionsToNext(listPlatformUsersHandler);
