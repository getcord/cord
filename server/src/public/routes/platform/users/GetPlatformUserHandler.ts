import type { Request, Response } from 'express';
import { AuthProviderType } from 'server/src/auth/index.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { isValidExternalID } from 'common/util/externalIDs.ts';
import {
  forwardHandlerExceptionsToNext,
  ApiCallerError,
} from 'server/src/public/routes/platform/util.ts';
import type { ServerGetUser } from '@cord-sdk/types';
import { LinkedUsersEntity } from 'server/src/entity/linked_users/LinkedUsersEntity.ts';

async function findAllOrgMemberships(userID: string) {
  const orgMemberships = await OrgMembersEntity.findAll({
    where: { userID },
  });
  const orgIds = orgMemberships.map((org) => org.orgID);
  return await OrgEntity.findAll({
    where: { id: orgIds, state: 'active' },
  });
}

async function findAllOrgsUserHasLinkedToASlackUser(
  userID: string,
  allUserOrgs: OrgEntity[],
) {
  const externalOrgIDByOrgID: Record<string, string> = {};
  for (const { id, externalID } of allUserOrgs) {
    externalOrgIDByOrgID[id] = externalID;
  }

  const linkedUsers = await LinkedUsersEntity.findAll({
    where: {
      sourceUserID: userID,
      sourceOrgID: Object.keys(externalOrgIDByOrgID),
    },
  });

  return linkedUsers.map((lu) => externalOrgIDByOrgID[lu.sourceOrgID]);
}

async function getPlatformUserHandler(req: Request, res: Response) {
  const platformApplicationID = req.appID;
  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_access_token');
  }

  const externalID = req.params.userID;
  if (!externalID) {
    throw new ApiCallerError('user_not_found');
  }

  if (!isValidExternalID(externalID)) {
    throw new ApiCallerError('invalid_request');
  }

  const user = await UserEntity.findOne({
    where: {
      externalID,
      platformApplicationID,
      externalProvider: AuthProviderType.PLATFORM,
    },
  });

  if (!user) {
    throw new ApiCallerError('user_not_found', { code: 404 });
  }

  const allOrgs = await findAllOrgMemberships(user.id);
  const orgExternalIds = allOrgs.map((org) => org.externalID);
  const connectedSlackOrgIDs = await findAllOrgsUserHasLinkedToASlackUser(
    user.id,
    allOrgs,
  );

  const result: ServerGetUser = {
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
    organizations: orgExternalIds,
    groups: orgExternalIds,
    metadata: user.metadata,
    createdTimestamp: user.createdAt,
    groupIDsWithLinkedSlackProfile: connectedSlackOrgIDs,
  };

  return res.status(200).json(result);
}

export default forwardHandlerExceptionsToNext(getPlatformUserHandler);
