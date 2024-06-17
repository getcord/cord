import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { safeFetch } from 'server/src/util/safeFetch.ts';
import {
  authenticationHeader,
  handleVerifyWebhookURL,
} from 'server/src/webhook/webhook.ts';

export async function verifyWebhookURL(app: ApplicationEntity, url: string) {
  const [payloadString, timestamp, signature] = authenticationHeader(
    'url-verification',
    app,
    await handleVerifyWebhookURL({ type: 'url-verification' }),
  );

  const timeLimit = 3000; //expect response within 3 seconds

  return await new Promise((resolve, reject) => {
    void (async () => {
      const controller = new AbortController();

      const timeout = setTimeout(() => {
        controller.abort();
      }, timeLimit);

      try {
        const response = await safeFetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Cord-Timestamp': timestamp,
            'X-Cord-Signature': signature,
          },
          body: payloadString,
          signal: controller.signal,
        });
        if (response.status === 200) {
          clearTimeout(timeout);
          resolve({ verified: true, message: null });
        } else {
          clearTimeout(timeout);
          reject({
            verified: false,
            code: response.status,
            message: `Request to '${url}' failed with status ${response.status} but status 200 expected.`,
          });
        }
      } catch (error: any) {
        clearTimeout(timeout);
        if (error.name === 'AbortError') {
          reject({
            verified: false,
            code: 408,
            message: `URL verification aborted: no response from '${url}' within 3 seconds.`,
          });
        } else {
          reject({
            verified: false,
            code: 404,
            message: `Cannot verify webhook URL '${url}'.`,
          });
        }
      }
    })();
  });
}
