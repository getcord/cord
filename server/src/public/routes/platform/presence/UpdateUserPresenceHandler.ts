import type { Request, Response } from 'express';

import {
  forwardHandlerExceptionsToNext,
  ApiCallerError,
} from 'server/src/public/routes/platform/util.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { Viewer } from 'server/src/auth/index.ts';
import { validateExternalID } from 'server/src/public/routes/platform/types.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import type { UUID } from 'common/types/index.ts';
import { contextWithSession } from 'server/src/RequestContext.ts';
import { setUserPresentContext } from 'server/src/presence/utils.ts';
import { validate } from 'server/src/public/routes/platform/validatorFunction.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import { addGroupIDIfNotExistUpdateUserPresenceHandler } from 'server/src/public/routes/platform/addGroupIDWhereOrgIDExists.ts';

async function updateUserPresenceHanlder(req: Request, res: Response) {
  const platformApplicationID = req.appID;
  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_access_token');
  }

  const externalID = req.params.userID;

  validateExternalID(externalID, 'userID');

  await updateUserPresence(platformApplicationID, externalID, req.body);

  return res.status(200).json({
    success: true,
    message: `✅ You successfully updated user ${externalID} presence`,
  });
}

async function updateUserPresence(
  platformApplicationID: UUID,
  externalUserID: string,
  data: any,
) {
  // This is in place until we remove organizationID
  const reqBodyWithGroupID = addGroupIDIfNotExistUpdateUserPresenceHandler(
    data,
    platformApplicationID,
  );

  const {
    absent,
    durable,
    location: userContext,
    organizationID: _organizationID,
    groupID: externalOrgID,
    exclusiveWithin,
    ...rest
  } = validate.UpdateUserPresenceVariables(reqBodyWithGroupID);
  // Check that all properties are destructured
  const _: Record<string, never> = rest;

  const [user, org] = await Promise.all([
    UserEntity.findOne({
      where: {
        externalID: externalUserID,
        platformApplicationID,
      },
    }),
    OrgEntity.findOne({
      where: {
        externalID: externalOrgID,
        platformApplicationID,
      },
    }),
  ]);

  if (!user) {
    throw new ApiCallerError('user_not_found');
  }

  if (!org) {
    throw new ApiCallerError('organization_not_found');
  }

  // Check to make sure the user is in the org as well
  const orgMember = await OrgMembersEntity.findOne({
    where: {
      userID: user.id,
      orgID: org.id,
    },
  });

  if (!orgMember) {
    throw new ApiCallerError('user_not_in_organization');
  }

  const viewer = await Viewer.createLoggedInPlatformViewer({
    user,
    org,
  });

  const context = await contextWithSession(
    { viewer },
    getSequelize(),
    null,
    null,
  );

  try {
    await setUserPresentContext({
      userContext,
      present: !absent,
      durable: Boolean(durable),
      exclusivityRegion: exclusiveWithin,
      context,
    });
  } catch (e: unknown) {
    if (e instanceof Error) {
      // throwing an API call error here for consistency
      throw new ApiCallerError('invalid_request', { message: e.message });
    }
  }
}

export default forwardHandlerExceptionsToNext(updateUserPresenceHanlder);
