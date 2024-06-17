import { Counter } from 'server/src/logging/prometheus.ts';
import type { Logger } from 'server/src/logging/Logger.ts';
import { AsyncTierJobDefinition } from 'server/src/asyncTier/jobDefinition.ts';
import { processResponseMessage } from 'server/src/webhook/util.ts';
import submitAsync from 'server/src/asyncTier/submitAsync.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { authenticationHeader } from 'server/src/webhook/webhook.ts';
import type { WebhookTypes } from '@cord-sdk/types';
import { safeFetch } from 'server/src/util/safeFetch.ts';

export default new AsyncTierJobDefinition('notifyWebhook', notifyWebhook);

export type NotifyWebhook = {
  retryCount: number;
  eventType: WebhookTypes;
  appID: string;
  url: string;
  timestamp: string;
  signature: string;
  payload: string;
  event: any;
};

export const NOTIFY_WEBHOOK_JOB = 'notifyWebhook';

const counter = Counter({
  name: 'eventsWebhook',
  help: 'Webhook events sent',
  labelNames: ['appID', 'type', 'success'],
});

// job to send request for webhook notifications
async function notifyWebhook(data: NotifyWebhook, logger: Logger) {
  const { eventType, appID, url } = data;
  let { timestamp, signature, payload } = data;

  //Check if we have the event in the payload, and thus can generate
  // the signature/timestamp as needed for this notification.
  if (data.event) {
    const app = await ApplicationEntity.findOne({
      where: { id: appID },
    });

    if (app !== null) {
      [payload, timestamp, signature] = authenticationHeader(
        eventType,
        app,
        data.event,
      );
    }
  }

  logger.debug('Sending webhook event', {
    appID: appID,
    url,
    eventType,
    payload,
  });

  try {
    const res = await safeFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Cord-Timestamp': timestamp,
        'X-Cord-Signature': signature,
      },
      body: payload,
    });
    if (res.ok) {
      counter.inc({ appID: appID, type: eventType, success: 'true' });
    } else {
      const responseMessage = await res.text();
      logger.warn('Unsuccessful HTTP request when sending webhook', {
        appID: appID,
        url,
        eventType,
        payload,
        status: res.status,
        statusText: res.statusText,
        responseMessage: processResponseMessage(responseMessage),
      });
      counter.inc({ appID: appID, type: eventType, success: 'false' });
      retry(data);
    }
  } catch (e) {
    logger.logException(
      `Error making webhook call to ${url} for application: ${appID}`,
      e,
      undefined,
      undefined,
      'warn',
    );
    counter.inc({ appID: appID, type: eventType, success: 'false' });
    retry(data);
  }
}

const RETRY_MAX_COUNT = 5;
const NUM_SECONDS_WAIT = 5;

function retry(workItemData: NotifyWebhook) {
  if (workItemData.retryCount < RETRY_MAX_COUNT) {
    workItemData.retryCount++;
    void submitAsync('notifyWebhook', workItemData, {
      startAfter:
        NUM_SECONDS_WAIT * workItemData.retryCount * workItemData.retryCount,
    });
  }
}
