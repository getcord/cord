import type { Request, Response } from 'express';
import { APP_ORIGIN } from 'common/const/Urls.ts';
import { demoRedirectTemplate } from 'server/src/public/routes/notification-uri-test/handlebars.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';

export default function NotificationRedirectURIHandler(
  req: Request,
  res: Response,
) {
  const { cord_notifications } = req.query;

  try {
    if (typeof cord_notifications !== 'string') {
      throw new Error('cord_notifications query is not a string');
    }
    const segments = cord_notifications.split('.');

    if (segments.length !== 3) {
      throw new Error('cord_notifications not jwt format');
    }

    const [_, payload] = segments;

    const info = JSON.parse(Buffer.from(payload, 'base64').toString());

    if (typeof info !== 'object') {
      throw new Error('Info is not an object');
    }

    if (!('notificationInfo' in info)) {
      throw new Error('notificationInfo does not exist in info object');
    }

    if (!('iat' in info)) {
      throw new Error('iat does not exist in info object');
    }

    const infoState = info as {
      notificationInfo: unknown;
      iat: unknown;
    };

    if (typeof infoState.iat !== 'number') {
      throw new Error('iat is not a number');
    }

    const iatParsed = new Date(infoState.iat * 1000).toUTCString();

    return res.send(
      demoRedirectTemplate({
        imageURL: `${APP_ORIGIN}/static/cord-wordmark.png`,
        notificationInfo: JSON.stringify(
          infoState.notificationInfo,
          undefined,
          2,
          // Insert extra spaces to match template indentation
        ).replaceAll('\n', '\n      '),
        iat: infoState.iat,
        iatParsed,
      }),
    );
  } catch (error) {
    anonymousLogger().error(`NotificationRedirectURIHandler: ${error}`, {
      cord_notifications,
    });
    return res.send('Oops something went wrong');
  }
}
