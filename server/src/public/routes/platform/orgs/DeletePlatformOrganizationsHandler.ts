import type { Request, Response } from 'express';

import {
  forwardHandlerExceptionsToNext,
  ApiCallerError,
} from 'server/src/public/routes/platform/util.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { AuthProviderType } from 'server/src/auth/index.ts';
import { validateExternalID } from 'server/src/public/routes/platform/types.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';

async function deleteOrganizationHandler(req: Request, res: Response) {
  const platformApplicationID = req.appID;
  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_access_token');
  }

  const externalID = req.params.orgID;
  validateExternalID(externalID, 'orgID');

  await getSequelize().transaction(async (transaction) => {
    const org = await OrgEntity.findOne({
      where: {
        externalID,
        externalProvider: AuthProviderType.PLATFORM,
        platformApplicationID,
      },
      transaction,
    });
    if (!org) {
      throw new ApiCallerError('group_not_found');
    }

    await org.destroy();
  });

  return res.status(200).json({
    success: true,
    message: `✅ You successfully deleted group ${externalID}`,
  });
}

export default forwardHandlerExceptionsToNext(deleteOrganizationHandler);
