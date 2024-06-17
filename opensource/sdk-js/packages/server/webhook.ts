import { createHmac } from 'crypto';
import type { WebhookWrapperProperties, WebhookTypes } from '@cord-sdk/types';

type ValidateWebhookOptions = {
  /**
   * The maximum age of a webhook request (as determined by the timestamp
   * encoded in it) to accept.  By default, this is set to 5 minutes.
   */
  acceptAgeSeconds?: number;
};

/**
 * Will validate the signature of the webhook request to ensure the source of
 * the request is Cord and can be trusted.  Will throw an exception if there are
 * any problems with the request validation.
 * @param body The raw request body.  This must be exactly the bytes sent in the
 * body of the request, without JSON deserialization or any other modification.
 * For example, use the `raw` middleware from the `body-parser` library for
 * Express or the `request.text()` function in NextJS.
 * @param cordTimestamp The contents of the `X-Cord-Timestamp` header from the
 * request.
 * @param cordSignature The contents of the `X-Cord-Signature` header from the
 * request.
 * @param projectSecret The project secret.  This is used to validate the
 * request body using the Cord signature proof.  Details can be found here:
 * https://docs.cord.com/reference/events-webhook
 * @param options Options to customize how the validity checking is done.  By
 * default, the maximum accepted age is 5 minutes.
 */
export function validateWebhookSignature(
  body: string,
  cordTimestamp: string | null | undefined,
  cordSignature: string | null | undefined,
  projectSecret: string,
  options: ValidateWebhookOptions = {},
) {
  if (!cordSignature) {
    throw new Error('Webhook signature is missing');
  }
  if (!cordTimestamp) {
    throw new Error('Webhook signature timestamp is missing');
  }
  const acceptAgeSeconds = options.acceptAgeSeconds ?? 60 * 5;
  if (
    Number.isNaN(Number(cordTimestamp)) ||
    Math.abs(Date.now() - Number(cordTimestamp)) > 1000 * acceptAgeSeconds
  ) {
    throw new Error('Webhook signature timestamp invalid or too old.');
  }
  const verifyStr = cordTimestamp + ':' + body;
  const hmac = createHmac('sha256', projectSecret);
  hmac.update(verifyStr);
  const incomingSignature = hmac.digest('base64');

  if (cordSignature !== incomingSignature) {
    throw new Error('Unable to verify webhook signature');
  }
}

/**
 * Will validate the signature of the webhook request to ensure the source of
 * the request is Cord, and can be trusted.  Will return false if there are any
 * problems with the request validation.
 * @param body The raw request body.  This must be exactly the bytes sent in the
 * body of the request, without JSON deserialization or any other modification.
 * For example, use the `raw` middleware from the `body-parser` library for
 * Express or the `request.text()` function in NextJS.
 * @param cordTimestamp The contents of the `X-Cord-Timestamp` header from the
 * request.
 * @param cordSignature The contents of the `X-Cord-Signature` header from the
 * request.
 * @param projectSecret The project secret.  This is used to validate the
 * request body using the cord signature proof.  Details can be found here:
 * https://docs.cord.com/reference/events-webhook
 */
export function tryValidateWebhookSignature(
  body: string,
  timestamp: string | null | undefined,
  signature: string | null | undefined,
  clientSecret: string,
) {
  try {
    validateWebhookSignature(body, timestamp, signature, clientSecret);
  } catch (e) {
    return false;
  }

  return true;
}

/**
 * Takes a raw request body, and returns a typed object for handling
 * Cord webhook events.
 * @param body The raw request body.  This must be exactly the bytes sent in the
 * body of the request, without JSON deserialization or any other modification.
 * For example, use the `raw` middleware from the `body-parser` library for
 * Express or the `request.text()` function in NextJS.
 * @returns A typed object to support handling webhook events. See:
 * https://docs.cord.com/reference/events-webhook
 */
export function parseWebhookBody<T extends WebhookTypes>(
  body: string,
): WebhookWrapperProperties<T> {
  const payload: WebhookWrapperProperties<T> = JSON.parse(body);
  switch (payload.type) {
    case 'thread-message-added':
      return payload;
    case 'notification-created':
      return payload;
    case 'url-verification':
      return payload;
    default:
      throw new Error('Unknown webhook request type.');
  }
}
