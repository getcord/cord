import type { Request, Response } from 'express';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import {
  forwardHandlerExceptionsToNext,
  ApiCallerError,
} from 'server/src/public/routes/platform/util.ts';

async function applicationTokenHandler(req: Request, res: Response) {
  const platformApplicationID = req.appID;
  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_access_token');
  }

  const app = await ApplicationEntity.findByPk(platformApplicationID);
  if (!app) {
    throw new ApiCallerError('project_not_found');
  }

  return res.status(200).json({
    success: true,
    application_id: platformApplicationID,
    application_name: app.name,
  });
}

export default forwardHandlerExceptionsToNext(applicationTokenHandler);
