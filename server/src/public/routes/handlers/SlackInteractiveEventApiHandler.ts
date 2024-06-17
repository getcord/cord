import type { Request, Response, NextFunction } from 'express';

import { publishPubSubEvent } from 'server/src/pubsub/index.ts';
import { Counter } from 'server/src/logging/prometheus.ts';
import env from 'server/src/config/Env.ts';
import { drainHelper } from 'server/src/serverStatus.ts';
import { handleSupportThreadStatusChange } from 'server/src/slack/interactionHandlers/blockActions.ts';
import { OrgLoader } from 'server/src/entity/org/OrgLoader.ts';
import { Viewer } from 'server/src/auth/index.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { anonymousLogger, Logger } from 'server/src/logging/Logger.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';

const counter = Counter({
  name: 'SlackInteractiveEventApiHandler',
  help: 'Interactive events received from Slack',
  labelNames: ['type'],
});

const { CORD_TIER: tier } = env;

/**
 * NB: this function does not verify itself that the request actually came from
 * Slack, but rather relies upon a middleware function to do so.
 *
 * @see verifySlackWebhookMiddleware
 */
export default function SlackInteractiveEventApiHandler(
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  const anonLogger = anonymousLogger();
  anonLogger.debug('SlackInteractiveEventApiHandler', {
    slackEvent: req.body,
  });

  // The body of interaction events (e.g. user clicks on button in slack message) is
  // annoyingly structured differently to other events (user_change, message etc)
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
    if (tier !== 'prod') {
      backgroundPromise(
        publishPubSubEvent(
          'incoming-slack-event',
          { tier },
          {
            type: 'interactive',
            event: req.body,
          },
        ),
        anonLogger,
      );
    }
    return await processIncomingSlackInteractionEvent(payload);
  })()
    .catch(
      anonLogger.exceptionLogger('SlackInteractiveEventApiHandler', {
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
    user: { team_id: teamID },
    api_app_id,
  } = event;

  const orgLoader = new OrgLoader(Viewer.createServiceViewer());
  const logger = new Logger(Viewer.createServiceViewer());
  const org = await orgLoader.loadSlackOrg(teamID, api_app_id);

  if (org === null) {
    logger.info(
      `Received interactive Slack event from unknown Slack team: ${teamID}`,
    );
  }

  if (!org?.externalAuthData) {
    logger.warn(
      'Received interactive Slack event from org with no externalAuthData',
      {
        teamID,
        orgID: org?.id,
        eventName: event.type,
      },
    );
    return;
  }

  counter.inc({ type });

  if (!(type in interactionEventHandlers)) {
    // We received a Slack event for which we have no handler function
    // We do not expect Slack to send us this event type. Log a warning!
    logger.warn('Unhandled Slack Interaction Event API event type', {
      event_type: type,
    });
    return;
  }

  const eventHandler =
    interactionEventHandlers[type as keyof typeof interactionEventHandlers];

  await eventHandler(event, org).catch(
    logger.exceptionLogger('SlackInteractiveEventApiHandler', { event }),
  );
}

const interactionEventHandlers = {
  async block_actions(event: any, org: OrgEntity) {
    if (
      event?.actions[0]?.action_id === 'support_close_thread' ||
      event?.actions[0]?.action_id === 'support_open_thread'
    ) {
      return await handleSupportThreadStatusChange(event, org);
    }
  },
};
