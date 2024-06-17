import type { Request, Response } from 'express';
import type { ServerListOrganization } from '@cord-sdk/types';

import { AuthProviderType } from 'server/src/auth/index.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import {
  forwardHandlerExceptionsToNext,
  ApiCallerError,
} from 'server/src/public/routes/platform/util.ts';
import { LinkedOrgsEntity } from 'server/src/entity/linked_orgs/LinkedOrgsEntity.ts';

async function listPlatformOrganizationsHandler(req: Request, res: Response) {
  const platformApplicationID = req.appID;
  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_access_token');
  }
  const orgs = await OrgEntity.findAll({
    where: {
      externalProvider: AuthProviderType.PLATFORM,
      platformApplicationID,
    },
  });

  const orgsConnectedToSlack = await LinkedOrgsEntity.findAll({
    where: {
      sourceOrgID: orgs.map((org) => org.id),
    },
  });

  const orgsConnectedToSlackSet = new Set(
    orgsConnectedToSlack.map((org) => org.sourceOrgID),
  );

  const orgsData: ServerListOrganization[] = orgs.map((org) => ({
    id: org.externalID,
    name: org.name,
    status: org.state === 'inactive' ? 'deleted' : 'active',
    connectedToSlack: orgsConnectedToSlackSet.has(org.id),
    metadata: org.metadata,
  }));

  return res.status(200).json(orgsData);
}

export default forwardHandlerExceptionsToNext(listPlatformOrganizationsHandler);
