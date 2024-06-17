import type { Request, Response } from 'express';
import type { ApplicationData } from '@cord-sdk/types';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import {
  forwardHandlerExceptionsToNext,
  ApiCallerError,
} from 'server/src/public/routes/platform/util.ts';
import { customEmailTemplateToAPIData } from 'server/src/public/routes/platform/applications/util.ts';

async function ListApplicationsHandler(req: Request, res: Response) {
  const customerID = req.customerID;
  if (!customerID) {
    throw new ApiCallerError('invalid_access_token');
  }
  const apps = await ApplicationEntity.findAll({
    where: {
      customerID,
    },
  });

  const result: ApplicationData[] = apps.map((app) => {
    return {
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
  });

  return res.status(200).json(result);
}

export default forwardHandlerExceptionsToNext(ListApplicationsHandler);
