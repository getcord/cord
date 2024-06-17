import { verifyRequestSignature } from '@slack/events-api';
import type { Request, Response, NextFunction } from 'express';
import env from 'server/src/config/Env.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import type { JsonObject } from 'common/types/index.ts';
import type { RequestWithRawBody } from 'server/src/middleware/encoding.ts';
import {
  SLACK_APP_ID,
  SLACK_DEV_APP_ID,
  SLACK_INTERNAL_TOOLS_APP_ID,
} from 'common/const/Ids.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';

// verify that webhook request comes truly from Slack
// https://api.slack.com/authentication/verifying-requests-from-slack
export function verifySlackWebhookMiddleware() {
  return async function (req: Request, res: Response, next: NextFunction) {
    if (process.env.NODE_ENV === 'development') {
      anonymousLogger().warn(
        'Received Slack webhook in development, skipping signature check!',
      );
    } else {
      const requestSignature = req.header('x-slack-signature');
      const requestTimestamp = req.header('x-slack-request-timestamp');

      if (requestSignature === undefined) {
        anonymousLogger().warn('expecting x-slack-signature header', {
          requestSignature,
        });
        res.status(403);
        res.send('expecting x-slack-signature header');
        res.end();
        return;
      }

      if (requestTimestamp === undefined) {
        anonymousLogger().warn('expecting x-slack-request-timestamp header', {
          requestTimestamp,
        });
        res.status(403);
        res.send('expecting x-slack-request-signature header');
        res.end();
        return;
      }

      const requestTimestampNum = parseInt(requestTimestamp, 10);
      if (isNaN(requestTimestampNum)) {
        anonymousLogger().warn(
          'expecting a numeric string in x-slack-request-signature header',
          {
            requestTimestamp,
          },
        );
        res.status(403);
        res.send(
          'expecting a numeric string in x-slack-request-signature header',
        );
        res.end();
        return;
      }

      // Exception: we respond to the url_verification event without verifying
      // the signature first.  This is because we need the app id, which is present
      // on all other types of events but not url_verification events, to know
      // which signing secret to use since we opened up our Slack app integration
      // to custom apps.  This doesn't present a security risk - all a malicious
      // request would get is the challenge parameter back, but any other requests
      // would fail.

      const slack_message_type = req.body.type;

      if (slack_message_type === 'url_verification') {
        // Slack sends messages with this type to verify that this is in fact an
        // Event API endpoint.
        // https://api.slack.com/events-api#the-events-api__subscribing-to-event-types__events-api-request-urls__request-url-configuration--verification
        const challenge = req.body.challenge;
        const token = req.body.token;

        if (typeof challenge === 'string' && typeof token === 'string') {
          res.json({ challenge });
        } else {
          res.sendStatus(400); // 400 Bad Request
        }
        return;
      }

      const slackAppID = req.body.api_app_id;
      if (typeof slackAppID !== 'string') {
        anonymousLogger().warn('expecting string in api_app_id body field', {
          slackAppID,
        });
        res.status(403);
        res.send('expecting x-slack-request-signature header');
        res.end();
        return;
      }

      const signingSecret = await getSigningSecret(slackAppID);
      if (!signingSecret) {
        anonymousLogger().error('Signing secret not found');
        res.status(500);
        res.send('Something went wrong!');
        res.end();
        return;
      }

      try {
        if (!('rawBody' in req)) {
          throw new Error('Unexpected: missing rawBody in request');
        }
        const bodyText = (req as RequestWithRawBody).rawBody.toString();
        if (
          !verifyRequestSignature({
            signingSecret,
            requestSignature,
            requestTimestamp: requestTimestampNum,
            body: bodyText,
          })
        ) {
          // this should not happen because verifyRequestSignature
          // should either return true or throw, but just in case the
          // library gets updated and starts returning false
          throw new Error('signature invalid');
        }
      } catch (e) {
        console.log(e);
        anonymousLogger().warn(
          'invalid webhook slack signature',
          e as JsonObject,
        );
        res.status(403);
        res.send('invalid signature');
        res.end();
        return;
      }
    }

    // This is a valid non-challenge Slack event, send it to the next handler

    next();
  };
}

async function getSigningSecret(appID: string) {
  if (appID === SLACK_APP_ID || appID === SLACK_DEV_APP_ID) {
    // the value of this env variable changes depending which tier we're in:
    // it's the one that corresponds to the SLACK_APP_ID in prod and the
    // SLACK_DEV_APP_ID in staging
    return env.SLACK_SIGNING_SECRET;
  }

  // Cord Internal tools - e.g. for collecting customer messages in #all-customers
  if (appID === SLACK_INTERNAL_TOOLS_APP_ID) {
    return env.SLACK_INTERNAL_SIGNING_SECRET;
  }

  const platformApplication = await ApplicationEntity.findOne({
    where: {
      customSlackAppID: appID,
    },
  });

  return platformApplication?.customSlackAppDetails?.signingSecret;
}
