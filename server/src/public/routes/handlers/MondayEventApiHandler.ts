import type { Request, Response } from 'express';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import { TaskThirdPartySubscriptionEntity } from 'server/src/entity/task_third_party_subscription/TaskThirdPartySubscriptionEntity.ts';
import type { MondayWebhookEvent } from 'server/src/third_party_tasks/monday/actions.ts';
import {
  webhookUpdateStatus,
  webhookUpdateAssignee,
} from 'server/src/third_party_tasks/monday/actions.ts';

export default async function MondayEventApiHandler(
  req: Request,
  res: Response,
) {
  const payload = req.body;
  anonymousLogger().debug('MondayEventApiHandler', { mondayEvent: payload });

  // Monday sends a challenge on webhook creation to confirm our handler is
  // functioning properly, see
  // https://support.monday.com/hc/en-us/articles/360003540679-Webhook-Integration-
  if (payload.challenge) {
    res.status(200).json({
      challenge: payload.challenge,
    });
    return;
  }
  // Confirm that this webhook request is actually from a real webhook we
  // submitted
  const subscription = await TaskThirdPartySubscriptionEntity.findByPk(
    req.params.subscriptionId,
  );
  if (!subscription) {
    res.sendStatus(404);
    return;
  }

  res.sendStatus(200);
  await handleMondayEvent(payload.event);
}

async function handleMondayEvent(event: MondayWebhookEvent) {
  const { pulseId: itemID, type, columnType } = event;

  if (type !== 'update_column_value') {
    return;
  }

  if (columnType === 'multiple-person') {
    await webhookUpdateAssignee(itemID.toString(), event);
  } else if (columnType === 'color') {
    await webhookUpdateStatus(itemID.toString(), event);
  }
}
