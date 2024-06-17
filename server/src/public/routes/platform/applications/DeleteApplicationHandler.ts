import type { Request, Response } from 'express';
import isUUID from 'validator/lib/isUUID.js';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import {
  ApiCallerError,
  forwardHandlerExceptionsToNext,
} from 'server/src/public/routes/platform/util.ts';
import { validate } from 'server/src/public/routes/platform/validatorFunction.ts';

async function DeleteApplicationHandler(req: Request, res: Response) {
  const customerID = req.customerID;
  if (!customerID) {
    throw new ApiCallerError('invalid_access_token');
  }

  const { secret, ...rest } = validate.DeleteApplicationVariables(req.body);
  // Check that all properties are destructured
  const _: Record<string, never> = rest;

  const appID = req.params.appID;
  if (!isUUID.default(appID)) {
    throw new ApiCallerError('invalid_request', {
      message: 'Project ID is invalid',
    });
  }
  const app = await ApplicationEntity.findOne({
    where: { id: appID, customerID, sharedSecret: secret },
  });

  if (!app) {
    throw new ApiCallerError('project_not_found', {
      message: `Project ${appID} not found.`,
    });
  }

  await app.destroy();

  return res.status(200).json({
    success: true,
    message: `💀 You successfully deleted project ${req.params.appID}`,
  });
}

export default forwardHandlerExceptionsToNext(DeleteApplicationHandler);
