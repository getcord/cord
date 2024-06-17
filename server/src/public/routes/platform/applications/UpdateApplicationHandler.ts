import type { Request, Response } from 'express';
import isUUID from 'validator/lib/isUUID.js';

import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import {
  ApiCallerError,
  forwardHandlerExceptionsToNext,
} from 'server/src/public/routes/platform/util.ts';
import { validate } from 'server/src/public/routes/platform/validatorFunction.ts';
import { verifyWebhookURL } from 'server/src/webhook/verifyWebhookURL.ts';
import { emailSettingsToDbData } from 'server/src/public/routes/platform/applications/util.ts';

async function UpdateApplicationHandler(req: Request, res: Response) {
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

  const {
    name,
    iconURL,
    eventWebhookURL,
    redirectURI,
    emailSettings,
    ...rest
  } = validate.UpdateApplicationVariables(req.body);
  // Check that all properties are destructured
  const _: Record<string, never> = rest;

  // If eventWebhookURL is not null and is different to the URL on the database, then verify URL
  if (eventWebhookURL && eventWebhookURL !== app.eventWebhookURL) {
    try {
      await verifyWebhookURL(app, eventWebhookURL);
    } catch (e: any) {
      throw new ApiCallerError('webhook_url_not_verified', {
        message: `${e.message} For more information see: https://docs.cord.com/reference/events-webhook/events/url-verification`,
      });
    }
  }

  let updatedCustomEmailTemplate;
  if (emailSettings) {
    updatedCustomEmailTemplate = emailSettingsToDbData(
      emailSettings,
      app.name,
      app.customEmailTemplate,
    );
  }

  await app.update({
    name,
    iconURL,
    eventWebhookURL,
    redirectURI,
    customEmailTemplate: updatedCustomEmailTemplate,
    enableEmailNotifications:
      emailSettings?.enableEmailNotifications ?? app.enableEmailNotifications,
  });

  return res.status(200).json({
    success: true,
    message: `✅ You successfully updated project ${appID}`,
  });
}

export default forwardHandlerExceptionsToNext(UpdateApplicationHandler);
