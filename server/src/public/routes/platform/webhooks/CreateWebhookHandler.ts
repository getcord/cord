import type { Request, Response } from 'express';
import { externalizeID } from 'common/util/externalIDs.ts';
import {
  forwardHandlerExceptionsToNext,
  ApiCallerError,
} from 'server/src/public/routes/platform/util.ts';
import { validate } from 'server/src/public/routes/platform/validatorFunction.ts';
import { ApplicationWebhookEntity } from 'server/src/entity/application_webhook/ApplicationWebhookEntity.ts';

async function createWebhookHandler(req: Request, res: Response) {
  const platformApplicationID = req.appID;
  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_access_token');
  }

  const {
    url: eventWebhookURL,
    events: eventWebhookSubscriptions,
    ...rest
  } = validate.CreateWebhookVariables(req.body);
  // Check that all properties are destructured
  const _: Record<string, never> = rest;

  // Upsert since they may just be updating the existing set of events
  await ApplicationWebhookEntity.upsert({
    platformApplicationID,
    eventWebhookURL,
    eventWebhookSubscriptions,
  });

  const webhookEntity = await ApplicationWebhookEntity.findOne({
    where: { platformApplicationID, eventWebhookURL },
  });
  if (!webhookEntity) {
    // Something has gone wrong since we just created this entity
    // This should not happen
    throw new ApiCallerError('invalid_request');
  }
  const webhookID = externalizeID(webhookEntity.id);

  // Explicitly pass a 201 here since that is what Zapier expects
  return res.status(201).json({
    success: true,
    message: `Successfully created webhook with id: ${webhookID}`,
    webhookID,
  });
}

export default forwardHandlerExceptionsToNext(createWebhookHandler);
