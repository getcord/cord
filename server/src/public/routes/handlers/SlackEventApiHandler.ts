import type { Request, Response, NextFunction } from 'express';
import { WebClient } from '@slack/web-api';

import { Viewer } from 'server/src/auth/index.ts';
import { OrgLoader } from 'server/src/entity/org/OrgLoader.ts';
import {
  allowImportUser,
  addMessageToCorrectCordThread,
  updateOrCreateSlackUserProfile,
  sendReplyHelpMessage,
  sendWelcomeHelpMessage,
  unlinkThreadOnSlackMessageDelete,
} from 'server/src/slack/util.ts';
import type { SlackUser } from 'server/src/slack/api.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import type {
  ChannelArchiveEvent,
  ChannelUnarchiveEvent,
} from 'server/src/slack/types.ts';
import {
  SlackChannelType,
  SlackMessageChannelType,
} from 'server/src/slack/types.ts';
import { SlackChannelMutator } from 'server/src/entity/slack_channel/SlackChannelMutator.ts';
import { isHelpMessage } from 'server/src/util/isHelpMessage.ts';
import { Counter } from 'server/src/logging/prometheus.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';
import env from 'server/src/config/Env.ts';
import { drainHelper } from 'server/src/serverStatus.ts';
import { Logger } from 'server/src/logging/Logger.ts';
import { isInternalSlackOrg } from 'common/util/index.ts';
import { UserLoader } from 'server/src/entity/user/UserLoader.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';

const counter = Counter({
  name: 'SlackEventApiHandler',
  help: 'Events received from Slack',
  labelNames: ['type'],
});

const { CORD_TIER: tier } = env;

/**
 * NB: this function does not verify itself that the request actually came from
 * Slack, but rather relies upon a middleware function to do so.
 *
 * @see verifySlackWebhookMiddleware
 */
export default function SlackEventApiHandler(
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  // For detailed information on what this POST endpoint needs to do,
  // see https://api.slack.com/events-api
  const serviceLogger = new Logger(Viewer.createServiceViewer());

  // For 'message' events which are not from our own Slack orgs, don't log the
  // underlying event info to avoid logging message content. Do log full messages
  // from our own orgs, since they can be useful for development
  if (
    req.body?.event?.type !== 'message' ||
    isInternalSlackOrg(req.body?.team_id)
  ) {
    serviceLogger.debug('SlackEventApiHandler', { slackEvent: req.body });
  } else {
    const { event: _event, ...redactedSlackEvent } = req.body;

    serviceLogger.debug('SlackEventApiHandler', {
      slackEvent: redactedSlackEvent,
      isRedacted: true,
    });
  }

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
      serviceLogger.exceptionLogger('SlackEventApiHandler', {
        slackEvent: req.body,
      }),
    )
    .finally(release);
}

async function processIncomingSlackEvent(logger: Logger, body: any) {
  // Since we have send off the response already, we will simply return
  // from this function in the case of any other errors.

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
          type: 'standard',
          event: body,
        },
      ),
      logger,
    );
  }

  const { team_id: teamId, event, authorizations, api_app_id } = body;

  if (
    typeof teamId !== 'string' ||
    typeof event !== 'object' ||
    typeof api_app_id !== 'string'
  ) {
    logger.info('Malformed Slack Event object');
    return;
  }

  counter.inc({ type: event.type });

  if (!(event.type in eventHandlers)) {
    // We received a Slack event for which we have no handler function

    if (IGNORED_SLACK_EVENT_TYPES.has(event.type)) {
      // Our Slack app is configured to subscribe to some event types that we
      // currently do not make use of.
      return;
    } else {
      // We do not expect Slack to send us this event type. Log a warning!
      logger.warn('Unhandled Slack Event API event type', {
        event_type: event.type,
      });
      return;
    }
  }

  const eventHandler = eventHandlers[event.type as keyof typeof eventHandlers];

  const orgLoader = new OrgLoader(Viewer.createServiceViewer());
  const org = await orgLoader.loadSlackOrg(teamId, api_app_id);

  if (org === null) {
    logger.info(`Received user update for unknown Slack team: ${teamId}`);
    return;
  }

  if (!org.externalAuthData) {
    logger.warn('Received slack update for org with no externalAuthData', {
      teamId,
      orgId: org.id,
      eventName: event.type,
    });
    return;
  }

  await eventHandler(event, org, authorizations).catch(
    logger.exceptionLogger('SlackEventApiHandler', { event }),
  );
}

const IGNORED_SLACK_EVENT_TYPES = new Set([
  'channel_deleted',
  'channel_left',
  'team_join',
]);

const eventHandlers = {
  async user_change(event: any, org: OrgEntity) {
    const user = event.user as SlackUser;
    if (allowImportUser(user) && user.team_id === org.externalID) {
      // The user of the importable kind (it's not a bot - for details, see
      // `allowImportUser`). Also, the user belongs to the Slack org for
      // which we received this event.
      await updateOrCreateSlackUserProfile(org, user);
    }
  },
  async member_joined_channel(event: any, org: OrgEntity) {
    const viewer = Viewer.createOrgViewer(org.id);
    const logger = new Logger(viewer, { event });
    const slackBotCredentials = await org.getSlackBotCredentials();
    if (
      event.channel_type === SlackChannelType.PUBLIC &&
      slackBotCredentials &&
      event.user === slackBotCredentials.bot_user_id
    ) {
      const { channel } = event;
      // Our bot user has joined a public channel!

      // Update SlackChannel entity
      const slackChannelMutator = new SlackChannelMutator(viewer);

      if (!(await slackChannelMutator.setAdded(channel, true))) {
        // No row was updated, so we have to create a new one.
        let name = '[unknown channel]';
        let users = 0;

        try {
          const { bot_access_token } = slackBotCredentials;
          const slackClient = new WebClient(bot_access_token);

          const info: any = await slackClient.conversations.info({
            channel,
            include_num_members: true,
          });
          if (typeof info.channel?.name === 'string') {
            name = info.channel.name;
          }
          if (typeof info.channel?.num_members === 'number') {
            users = info.channel.num_members;
          }
        } catch (err) {
          logger.logException('Error looking up Slack channel name', err);
        }

        await slackChannelMutator.createOne(
          channel,
          name,
          /* added */ true,
          /* archived */ false,
          users,
        );
      }
    }
  },
  async member_left_channel(event: any, org: OrgEntity) {
    const slackBotCredentials = await org.getSlackBotCredentials();
    const viewer = Viewer.createOrgViewer(org.id);
    if (
      event.channel_type === SlackChannelType.PUBLIC &&
      slackBotCredentials &&
      event.user === slackBotCredentials.bot_user_id
    ) {
      const { channel } = event;
      // Update SlackChannel entity
      const slackChannelMutator = new SlackChannelMutator(viewer);

      await slackChannelMutator.setAdded(channel, false);
    }
  },
  async message(event: any, org: OrgEntity) {
    await unlinkThreadOnSlackMessageDelete(event, org);

    // Event subtypes are for special types message that we do not need to process
    // except for 'file_share', which is for when a message has an attachment
    if (event.subtype && event.subtype !== 'file_share') {
      return;
    }

    const userLoader = new UserLoader(
      Viewer.createOrgViewer(org.id),
      () => null,
    );
    const messageAuthorUser =
      await userLoader.loadUserForSlackUserWithinViewerOrg(event.user);
    if (messageAuthorUser === null) {
      return;
    }

    const viewer: Viewer = Viewer.createLoggedInViewer(
      messageAuthorUser.id,
      org.id,
    );
    const logger = new Logger(viewer, { event });

    const { thread_ts } = event;
    // event.thread_ts is the original message timestamp
    // Therefore, thread_ts is only present when a message is a reply to a thread

    const slackBotCredentials = await org.getSlackBotCredentials();
    if (!slackBotCredentials) {
      throw new Error(
        `SlackEventApiHandler message handler: no Slack bot credentials`,
      );
    }
    const { bot_access_token, bot_user_id } = slackBotCredentials;

    if (event.channel_type === SlackMessageChannelType.PUBLIC) {
      // This is a message in a public channel

      if (thread_ts) {
        // This message is a reply
        await addMessageToCorrectCordThread(
          logger,
          bot_access_token,
          event,
          viewer,
        );
      }
    } else if (event.channel_type === SlackMessageChannelType.IM) {
      // This is a private message, in a one-to-one chat

      // If the message was not written by our app, then it was written by the user.
      // If it is a reply in thread, add the message to cord in correct channel
      // If it says "help" (ignoring any non-alphanumeric characters at beginning and end)
      // then we must send back the welcome message.
      // Otherwise send reply help message
      if (
        event.user !== bot_user_id &&
        typeof event.user === 'string' &&
        typeof event.text === 'string'
      ) {
        if (thread_ts) {
          // The user replied in thread, add the message to cord
          await addMessageToCorrectCordThread(
            logger,
            bot_access_token,
            event,
            viewer,
          );
          return;
        }

        if (isHelpMessage(event.text) && org.domain) {
          // The user sent "help", so send welcome message
          await sendWelcomeHelpMessage(
            bot_access_token,
            event.user,
            org.domain,
          );
          return;
        }

        // The user sent a message to the bot channel, so send reply message
        await sendReplyHelpMessage(bot_access_token, event.user);
      }
    }
  },
  async app_home_opened(event: any, org: OrgEntity, authorizations: any) {
    const logger = new Logger(Viewer.createServiceViewer(), {
      event,
      org_id: org.id,
      authorizations,
    });
    try {
      if (Array.isArray(authorizations) && authorizations.length === 0) {
        logger.warn(
          'No authorization permissions found, the app has been removed from the workspace.',
          {
            orgID: org.id,
            slackUserID: event.user,
          },
        );
        return;
      }

      const slackBotCredentials = await org.getSlackBotCredentials();
      if (slackBotCredentials && typeof event.user === 'string' && org.domain) {
        await sendWelcomeHelpMessage(
          slackBotCredentials.bot_access_token,
          event.user,
          org.domain,
          /* onlyPostIfConversationEmpty: */ true,
        );
      } else {
        logger.warn('Could not respond to app_home_opened event', {
          orgID: org.id,
          slackUserID: event.user,
        });
      }
    } catch (error: any) {
      if (error.data.error === 'account_inactive') {
        logger.warn(
          'User has navigated to app home but the app has been removed from the workspace.',
          {
            orgID: org.id,
            slackUserID: event.user,
          },
        );
        return;
      }
      throw error;
    }
  },
  async channel_created(event: any, org: OrgEntity) {
    const viewer = Viewer.createOrgViewer(org.id);
    const { id, name } = event.channel;
    await new SlackChannelMutator(viewer).createOne(
      id,
      name,
      /* added */ false,
      /* archived */ false,
      0,
    );
  },
  async channel_rename(event: any, org: OrgEntity) {
    const { id, name } = event.channel;
    await new SlackChannelMutator(Viewer.createOrgViewer(org.id)).setName(
      id,
      name,
    );
  },
  async channel_archive(event: ChannelArchiveEvent, org: OrgEntity) {
    const { channel } = event;
    await new SlackChannelMutator(Viewer.createOrgViewer(org.id)).setArchived(
      channel,
      true,
    );
  },
  async channel_unarchive(event: ChannelUnarchiveEvent, org: OrgEntity) {
    const { channel } = event;
    await new SlackChannelMutator(Viewer.createOrgViewer(org.id)).setArchived(
      channel,
      false,
    );
  },
};
