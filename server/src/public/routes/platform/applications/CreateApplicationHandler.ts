import type { Request, Response } from 'express';
import {
  ApiCallerError,
  forwardHandlerExceptionsToNext,
} from 'server/src/public/routes/platform/util.ts';
import { validate } from 'server/src/public/routes/platform/validatorFunction.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { emailSettingsToDbData } from 'server/src/public/routes/platform/applications/util.ts';
import { logCustomerActionLimit } from 'server/src/util/selfServe.ts';

async function CreateApplicationHandler(req: Request, res: Response) {
  const customerID = req.customerID;
  if (!customerID) {
    throw new ApiCallerError('invalid_request');
  }

  const {
    name,
    iconURL,
    eventWebhookURL,
    redirectURI,
    emailSettings,
    ...rest
  } = validate.CreateApplicationVariables(req.body);
  // Check that all properties are destructured
  const _: Record<string, never> = rest;

  const application = await ApplicationEntity.create({
    name,
    iconURL,
    customerID,
    eventWebhookURL,
    customEmailTemplate: emailSettings
      ? emailSettingsToDbData(emailSettings, name)
      : undefined,
    enableEmailNotifications: emailSettings?.enableEmailNotifications,
    redirectURI,
  });

  await logCustomerActionLimit({
    customerID,
    action: 'create_application',
  });

  res.status(200).json({
    success: true,
    message: 'Project created',
    applicationID: application.id,
    projectID: application.id,
    secret: application.sharedSecret,
  });
}

export default forwardHandlerExceptionsToNext(CreateApplicationHandler);
