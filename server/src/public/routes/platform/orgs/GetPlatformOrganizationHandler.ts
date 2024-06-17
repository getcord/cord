import type { Request, Response } from 'express';
import { isNotNull } from 'common/util/index.ts';
import { AuthProviderType } from 'server/src/auth/index.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import { isValidExternalID } from 'common/util/externalIDs.ts';
import {
  forwardHandlerExceptionsToNext,
  ApiCallerError,
} from 'server/src/public/routes/platform/util.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import type { ServerGetOrganization } from '@cord-sdk/types';
import { LinkedOrgsEntity } from 'server/src/entity/linked_orgs/LinkedOrgsEntity.ts';

async function getPlatformOrganizationHandler(req: Request, res: Response) {
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

  const linkedOrg = await LinkedOrgsEntity.findOne({
    where: { sourceOrgID: org.id },
  });

  const members = await OrgMembersEntity.findAll({
    where: {
      orgID: org.id,
    },
  });

  const users = await UserEntity.findAll({
    where: {
      id: members.map((m) => m.userID),
      externalProvider: AuthProviderType.PLATFORM,
      platformApplicationID,
    },
  });

  const userExternalIDs = new Set(
    users.map((u) => u.externalID).filter(isNotNull),
  );

  const response: ServerGetOrganization = {
    id: org.externalID,
    name: org.name,
    status: org.state === 'inactive' ? 'deleted' : 'active',
    members: [...userExternalIDs],
    connectedToSlack: Boolean(linkedOrg),
    metadata: org.metadata,
  };
  return res.status(200).json(response);
}

export default forwardHandlerExceptionsToNext(getPlatformOrganizationHandler);
