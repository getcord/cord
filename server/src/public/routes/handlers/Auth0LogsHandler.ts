import type { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { Viewer } from 'server/src/auth/index.ts';
import { EventMutator } from 'server/src/entity/event/EventMutator.ts';
import { Logger } from 'server/src/logging/Logger.ts';
import { sendMessageToCord } from 'server/src/slack/util.ts';
import { ipToLocation } from 'docs/lib/geoip/geoip.ts';
import { CORD_DEV_CONSOLE_LOGGING_SLACK_CHANNEL_ID } from 'common/const/Ids.ts';
import Env from 'server/src/config/Env.ts';

// Refer to https://auth0.com/docs/deploy-monitor/logs/log-event-type-codes
// for more log type events
// Remember to select the events you want in the webhook creation
// https://manage.auth0.com/dashboard/eu/dev-e20axg57/log-streams
const AUTH0_EVENT_LOG: { [type: string]: string } = {
  s: 'console-successful-login',
  ss: 'console-successful-signups',
  f: 'console-failed-login',
  fs: 'console-failed-signup',
};

type AUTH0_EVENT_LOG_TYPE = keyof typeof AUTH0_EVENT_LOG;

export default function Auth0LogsHandler(req: Request, res: Response) {
  const viewer = Viewer.createAnonymousViewer();
  const anonLogger = new Logger(viewer);
  anonLogger.debug('Auth0LogsHandler', { payload: req.body });

  try {
    const auth = req.headers.authorization;
    if (!auth) {
      throw new Error('Authorization missing in headers');
    }
    const token = auth.split(' ')[1];

    if (!token) {
      throw new Error('Token missing');
    }
    jwt.verify(token, Env.AUTH0_WEBHOOK_SECRET);
  } catch (e) {
    res.sendStatus(401);
    if (e instanceof Error) {
      anonLogger.error('Auth0LogsHandler: ' + e.message, {
        payload: req.headers.authorization,
      });
    }
    return;
  }

  res.sendStatus(200);
  const logs = req.body.logs;
  storeAuth0EventLogs(viewer, logs).catch((error) => {
    if (error instanceof Error) {
      anonLogger.error('Auth0LogsHandler: ' + error.message, {
        payload: req.body,
      });
    } else {
      anonLogger.error('Auth0LogsHandler', { payload: req.body });
    }
  });
}

async function storeAuth0EventLogs(viewer: Viewer, logs: any[]) {
  if (!Array.isArray(logs)) {
    throw new Error('Logs should be array');
  }

  if (logs.length === 0) {
    throw new Error('No logs');
  }
  const eventMutator = new EventMutator({ viewer });
  const anonLogger = new Logger(viewer);
  await Promise.all(
    logs.map(async (log) => {
      if (!('data' in log)) {
        throw new Error('Data does not exist');
      }

      const dataLog = log.data;
      if (!('type' in dataLog) || typeof dataLog['type'] !== 'string') {
        throw new Error('Type does not exist');
      }

      const logType = dataLog['type'];
      // Remember to select the events you want in the webhook creation
      // https://manage.auth0.com/dashboard/eu/dev-e20axg57/log-streams
      if (logType in AUTH0_EVENT_LOG) {
        await eventMutator.createEvent({
          eventNumber: null,
          pageLoadID: null,
          clientTimestamp: dataLog.date,
          installationID: null,
          type: AUTH0_EVENT_LOG[logType],
          payload: {
            email: dataLog.user_name,
            description: dataLog.description,
            connection: dataLog.connection,
          },
          metadata: { log: dataLog },
          logLevel: 'info',
        });

        await sendAuth0EventToSlack({
          type: logType as keyof typeof AUTH0_EVENT_LOG,
          email: dataLog.user_name,
          ip: dataLog.ip,
          connection: dataLog?.connection ?? 'user name and password',
          logger: anonLogger,
        });
      }
    }),
  );
}

async function sendAuth0EventToSlack({
  type,
  email,
  ip,
  connection,
  logger,
}: {
  type: AUTH0_EVENT_LOG_TYPE;
  email: string;
  ip: string;
  connection: string;
  logger: Logger;
}) {
  let location = ip;
  try {
    location = await ipToLocation(ip);
  } catch (error) {
    logger.logException('Auth0LogsHandler: Could not get geo location', {
      payload: { ip, email, connection, type },
    });
  }
  // This message should never be posted..
  let message = `🔥 Could not convert Auth0 log type: ${type} to slack message...`;
  switch (type) {
    case 's': // successful login
      message = `🫒 (${location}) user with email ${email} logged in to the console using ${connection}.`;
      break;
    case 'ss': //successful signup
      message = `🚀 (${location}) user with email ${email} signed up to the console using ${connection}.`;
      break;
    case 'f': // failed login
      message = `🏴‍☠️ (${location}) user with email ${email} failed to log in to the console using ${connection}.`;
      break;
    case 'fs': // failed signup
      message = `☠️ (${location}) user with email ${email} failed to sign up to the console using ${connection}.`;
      break;
  }
  await sendMessageToCord(message, CORD_DEV_CONSOLE_LOGGING_SLACK_CHANNEL_ID);
}
