import type { Request, Response, NextFunction } from 'express';
import { WebClient } from '@slack/web-api';

import { Viewer } from 'server/src/auth/index.ts';
import env from 'server/src/config/Env.ts';
import { drainHelper } from 'server/src/serverStatus.ts';
import { Logger } from 'server/src/logging/Logger.ts';
import { sendMessageToCord } from 'server/src/slack/util.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';

const { CORD_TIER: tier } = env;

const ALL_CUSTOMERS_IGNORED_CHANNELS = [
  'cord-allcustomers', // The channel we forward messages to
  'cord-updates-test', // The test channel for customer broadcast messages
  'cord-barr-soc2', // Our discussions with our SOC2 auditors
];

/**
 * NB: this function does not verify itself that the request actually came from
 * Slack, but rather relies upon a middleware function to do so.
 *
 * @see verifySlackWebhookMiddleware
 */
export default function SlackInternalEventApiHandler(
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  // For detailed information on what this POST endpoint needs to do,
  // see https://api.slack.com/events-api
  const serviceLogger = new Logger(Viewer.createServiceViewer());

  const slack_message_type = req.body.type;

  if (slack_message_type !== 'event_callback') {
    res.sendStatus(400); // 400 Bad Request
    return;
  }

  // Call `drainHelper.keepAlive`, so server won't get shutdown before we call
  // `release`.
  const release = drainHelper.keepAlive();

  (async () => {
    // We must respond to these incoming requests with a 200 quickly, or else
    // Slack will retry sending us the same events, and eventually disable
    // the Event API for us.
    res.sendStatus(200); // OK

    return await processIncomingSlackEvent(serviceLogger, req.body);
  })()
    .catch(
      serviceLogger.exceptionLogger('SlackInternalEventApiHandler', {
        slackEvent: req.body,
      }),
    )
    .finally(release);
}

const IGNORED_SUBTYPES = ['channel_join', 'channel_leave', 'message_changed'];

async function processIncomingSlackEvent(logger: Logger, body: any) {
  // Since we have sent off the response already, we will simply return
  // from this function in the case of any other errors.

  if (tier !== 'prod') {
    backgroundPromise(
      publishPubSubEvent(
        'incoming-slack-event',
        { tier },
        {
          type: 'internal',
          event: body,
        },
      ),
      logger,
    );
  }

  const { event } = body;

  if (typeof event !== 'object') {
    logger.error('Malformed Slack Event object');
    return;
  }

  if (event.type !== 'message') {
    logger.error(`Unexpected message type: ${event.type}`);
    return;
  }

  if (!env.CORD_ALL_CUSTOMERS_SLACK_CHANNEL_ID) {
    return;
  }

  if (IGNORED_SUBTYPES.includes(event.subtype)) {
    return;
  }

  // Ignore messages sent by our Broadcast Updates bot
  if (event.user === 'U054URCDLM6') {
    return;
  }

  const client = new WebClient(env.SLACK_INTERNAL_BOT_TOKEN);

  const channel_info = await client.conversations.info({
    channel: event.channel,
  });
  if (!channel_info.ok) {
    logger.error(`Error getting channel name: ${channel_info.error}`);
    return;
  }

  const channel_name = channel_info.channel?.name;

  if (
    !channel_name?.startsWith('cord-') ||
    ALL_CUSTOMERS_IGNORED_CHANNELS.includes(channel_name)
  ) {
    // Ignore messages that didn't go to cord-*
    return;
  }

  const permalink = await client.chat.getPermalink({
    channel: event.channel,
    message_ts: event.ts,
  });

  if (!permalink.ok) {
    logger.error(`Error getting message permalink: ${permalink.error}`);
    return;
  }

  await sendMessageToCord(
    `New message in <#${event.channel}>:\n${permalink.permalink}`,
    env.CORD_ALL_CUSTOMERS_SLACK_CHANNEL_ID,
  );

  const slackMessageContent = event.text;

  const user_info = await client.users.info({
    user: event.user,
  });
  if (!user_info.ok || !user_info.user) {
    logger.error(`Error getting user name from slack: ${user_info.error}`);
  }
  const fromUser = user_info.user?.name ?? '';

  await sendMessageToCord(
    `New message in *#${channel_name}* from *${fromUser}*:\n${permalink.permalink}\n\n${slackMessageContent}`,
    undefined,
    'clack-allcustomers',
  );
}
