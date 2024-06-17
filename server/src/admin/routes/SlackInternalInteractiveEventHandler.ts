import type { Request, Response, NextFunction } from 'express';
import { v4 as uuid } from 'uuid';

import { WebClient } from '@slack/web-api';
import { Viewer } from 'server/src/auth/index.ts';
import env from 'server/src/config/Env.ts';
import { drainHelper } from 'server/src/serverStatus.ts';
import { anonymousLogger, Logger } from 'server/src/logging/Logger.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';
import { CustomerEntity } from 'server/src/entity/customer/CustomerEntity.ts';
import { AdminCRTCustomerIssueEntity } from 'server/src/entity/admin_crt/AdminCRTCustomerIssueEntity.ts';
import { AdminCRTCustomerIssueChangeEntity } from 'server/src/entity/admin_crt/AdminCRTCustomerIssueChangeEntity.ts';
import { UserLoader } from 'server/src/entity/user/UserLoader.ts';
import { OrgLoader } from 'server/src/entity/org/OrgLoader.ts';
import { escapeForSlack } from 'server/src/slack/message.ts';
import { sendMessageToCord } from 'server/src/slack/util.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';
import { CordError } from 'server/src/util/CordError.ts';

/**
 * NB: this function does not verify itself that the request actually came from
 * Slack, but rather relies upon a middleware function to do so.
 *
 * @see verifySlackWebhookMiddleware
 */
export default function SlackInternalInteractiveEventHandler(
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  // For detailed information on what this POST endpoint needs to do,
  // see https://api.slack.com/interactivity/shortcuts
  const payload = req.body?.payload && JSON.parse(req.body.payload);
  const interactive_message_type = payload.type;

  if (!interactive_message_type || !payload) {
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

    // If not running in prod, publish all incoming Slack events to our pubsub
    // system. This is used so we can subscribe to these and forward them to our
    // local development servers. This is incredibly useful for developing
    // anything that involves incoming Slack events.
    // It's enough that we can forward these events from staging, no need to do
    // this in prod. (The number of incoming Slack events in prod can be really
    // high.)
    if (env.CORD_TIER !== 'prod') {
      backgroundPromise(
        publishPubSubEvent(
          'incoming-slack-event',
          { tier: env.CORD_TIER },
          {
            type: 'internal-interactive',
            event: req.body,
          },
        ),
      );
    }
    return await processIncomingSlackInteractionEvent(payload);
  })()
    .catch(
      anonymousLogger().exceptionLogger('SlackInteractiveEventApiHandler', {
        slackEvent: req.body,
      }),
    )
    .finally(release);
}

async function processIncomingSlackInteractionEvent(event: any) {
  // Since we have send off the response already, we will simply return
  // from this function in the case of any other errors.

  // The resulting object can have different structures depending on the source.
  // All those structures will have a type field that indicates the source of the interaction.
  // Possible types:
  // block_actions, shortcut, message_actions, view_submission, view_closed
  const {
    type,
    callback_id,
    response_url,
    user: { id: slackUserID, team_id },
    channel: { id: channel_id, name: channel_name },
    message: { text, ts },
    api_app_id,
  } = event;

  const logger = new Logger(Viewer.createServiceViewer());

  if (type === 'message_action' && callback_id === 'new_issue') {
    const org = await new OrgLoader(Viewer.createServiceViewer()).loadSlackOrg(
      team_id,
      api_app_id,
    );
    if (!org) {
      await sendMessage(response_url, 'Could not load team');
      return;
    }
    const user = await new UserLoader(
      Viewer.createOrgViewer(org.id),
      () => null,
    ).loadUserForSlackUserWithinViewerOrg(slackUserID);
    if (!user) {
      await sendMessage(response_url, 'Could not load Cord user');
      return;
    }
    const customer = await CustomerEntity.findOne({
      where: { slackChannel: channel_name },
    });
    if (!customer) {
      await sendMessage(
        response_url,
        `<#${channel_id}> isn't a customer channel, you'll need to file this issue in the <https://${env.ADMIN_SERVER_HOST}/issues|Admin tool>`,
      );
      return;
    }
    const client = new WebClient(env.SLACK_INTERNAL_BOT_TOKEN);
    const permalink = await client.chat.getPermalink({
      channel: channel_id,
      message_ts: ts,
    });

    if (!permalink.ok) {
      throw new CordError('Error getting message permalink', {
        error: permalink.error,
      });
    }
    const issue = await AdminCRTCustomerIssueEntity.create({
      id: uuid(),
      customerID: customer.id,
      title: titleText(text),
      body: text + '\n\n' + permalink.permalink,
      comingFrom: 'them',
      decision: 'pending',
      communicationStatus: 'none',
    });
    await AdminCRTCustomerIssueChangeEntity.create({
      id: uuid(),
      userID: user.id,
      issueID: issue.id,
      changeDetail: { created: true },
    });
    await sendMessage(
      response_url,
      `Created issue <https://${env.ADMIN_SERVER_HOST}/issues/${
        issue.id
      }|${escapeForSlack(issue.title)}>`,
    );
    if (env.CORD_CLIENT_REQUESTS_SLACK_CHANNEL_ID) {
      await sendMessageToCord(
        `<@${slackUserID}> created a new customer issue: <https://${
          env.ADMIN_SERVER_HOST
        }/issues/${issue.id}|${escapeForSlack(issue.title)}>`,
        env.CORD_CLIENT_REQUESTS_SLACK_CHANNEL_ID,
        'client-requests',
      );
    }
  } else {
    logger.error('Unhandled internal Slack event type', {
      event_type: type,
    });
  }
}

async function sendMessage(response_url: string, text: string) {
  const body = {
    text,
  };
  const response = await fetch(response_url, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (response.status !== 200) {
    throw new CordError('Error response from Slack', {
      status: response.status,
      statusText: response.statusText,
    });
  }
}

const APPROX_MAX_TITLE_LEN = 100;

function titleText(text: string): string {
  text = text.split('\n', 1)[0].trim();
  while (text.startsWith('<')) {
    text = text.substring(text.indexOf('>') + 1).trim();
  }
  const puncIndex = text.search(/[.?!]/);
  if (puncIndex !== -1) {
    // Strip off periods but not question marks or exclamation points
    if (text[puncIndex] === '.') {
      text = text.substring(0, puncIndex);
    } else {
      text = text.substring(0, puncIndex + 1);
    }
  }
  if (text.length > APPROX_MAX_TITLE_LEN) {
    const spaceIndex = text.indexOf(' ', APPROX_MAX_TITLE_LEN);
    return (
      text.substring(0, spaceIndex === -1 ? APPROX_MAX_TITLE_LEN : spaceIndex) +
      '...'
    );
  }
  return text;
}
