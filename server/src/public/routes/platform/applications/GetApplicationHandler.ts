import type { Request, Response } from 'express';
import isUUID from 'validator/lib/isUUID.js';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import {
  forwardHandlerExceptionsToNext,
  ApiCallerError,
} from 'server/src/public/routes/platform/util.ts';
import type { ApplicationData } from '@cord-sdk/types';
import { customEmailTemplateToAPIData } from 'server/src/public/routes/platform/applications/util.ts';

async function GetApplicationHandler(req: Request, res: Response) {
  const customerID = req.customerID;
  if (!customerID) {
    throw new ApiCallerError('invalid_access_token');
  }

  const appID = req.params.appID;
  if (!isUUID.default(appID)) {
    throw new ApiCallerError('invalid_request', {
      message: 'Project ID is invalid',
    });
  }

  const app = await ApplicationEntity.findOne({
    where: { id: appID, customerID },
  });
  if (!app) {
    throw new ApiCallerError('project_not_found', {
      message: `Project ${appID} not found.`,
    });
  }

  const result: ApplicationData = {
    id: app.id,
    secret: app.sharedSecret,
    name: app.name,
    iconURL: app.iconURL,
    eventWebhookURL: app.eventWebhookURL,
    redirectURI: app.redirectURI,
    emailSettings: customEmailTemplateToAPIData(
      app.customEmailTemplate,
      app.enableEmailNotifications,
    ),
    createdTimestamp: app.createdTimestamp,
  };

  return res.status(200).json(result);
}

export default forwardHandlerExceptionsToNext(GetApplicationHandler);
