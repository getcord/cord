import type { Request, Response } from 'express';
import { extractInternalID } from 'common/util/externalIDs.ts';
import { ApplicationWebhookEntity } from 'server/src/entity/application_webhook/ApplicationWebhookEntity.ts';
import {
  forwardHandlerExceptionsToNext,
  ApiCallerError,
} from 'server/src/public/routes/platform/util.ts';

async function deleteWebhookHandler(req: Request, res: Response) {
  const platformApplicationID = req.appID;
  if (!platformApplicationID) {
    throw new ApiCallerError('invalid_access_token');
  }

  const webhookID = req.params.webhookID;
  const id = extractInternalID(webhookID);
  if (!id) {
    throw new ApiCallerError('invalid_request');
  }

  const webhookEntity = await ApplicationWebhookEntity.findByPk(id);
  await webhookEntity?.destroy();

  return res.status(200).json({
    success: true,
    message: `💀 You have successfully deleted webhook: ${webhookID}`,
    deleted: webhookID,
  });
}

export default forwardHandlerExceptionsToNext(deleteWebhookHandler);
