import type { Request, Response } from 'express';
import { decodeUnsubscribeThreadToken } from 'server/src/email/index.ts';
import { EmailSubscriptionMutator } from 'server/src/entity/email_subscription/EmailSubscriptionMutator.ts';
import { APP_ORIGIN } from 'common/const/Urls.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import {
  errorTemplate,
  successTemplate,
  unsunscribeFromThreadPageTemplate,
} from 'server/src/public/routes/email/unsubscribe_thread/templates/handlebars.ts';
import { Viewer } from 'server/src/auth/index.ts';
import { logServerEvent } from 'server/src/entity/event/EventMutator.ts';
import { LogLevel } from 'common/types/index.ts';
import { Logger } from 'server/src/logging/Logger.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';

export async function UnsubscribeThreadHandler(req: Request, res: Response) {
  const token = req.query.token;
  if (!token || typeof token !== 'string') {
    return res.send(errorTemplate({}));
  }

  try {
    const { threadID, userID, orgID, appID } =
      decodeUnsubscribeThreadToken(token);

    const viewer = Viewer.createLoggedInViewer(userID, orgID);
    const logger = new Logger(viewer);

    // Load the thread with no visbility checks.  If a user unsubscribes from a
    // thread, we should respect that and log it appropriately, even if they've
    // had their access to the thread revoked in the meantime.
    const thread = await ThreadEntity.findByPk(threadID);
    if (!thread) {
      throw new Error(`Thread ${threadID} not found`);
    }

    const mutator = new EmailSubscriptionMutator(viewer);
    await mutator.setEmailUnsubscribed(thread);

    const imageURL = await generateImageURL(appID);

    // Was this an RFC 8058 one-click unsubscribe?
    const oneClickUnsubscribe =
      'List-Unsubscribe' in req.body &&
      req.body['List-Unsubscribe'] === 'One-Click';

    logger.log('info', 'clicked-email-unsubscribe-from-thread', {
      userID,
      orgID,
      appID,
      oneClickUnsubscribe,
    });
    logServerEvent({
      session: { viewer },
      type: 'clicked-email-unsubscribe-from-thread',
      logLevel: LogLevel.INFO,
      metadata: {
        oneClickUnsubscribe,
      },
    });

    return res.send(
      successTemplate({
        Image_URL: imageURL,
      }),
    );
  } catch (e) {
    return res.send(errorTemplate({}));
  }
}

export async function RenderUnsubscribeThreadPage(req: Request, res: Response) {
  const token = req.query.token;
  if (!token || typeof token !== 'string') {
    return res.send(errorTemplate({}));
  }

  try {
    const { appID } = decodeUnsubscribeThreadToken(token);

    const imageURL = await generateImageURL(appID);

    return res.send(
      unsunscribeFromThreadPageTemplate({
        Image_URL: imageURL,
      }),
    );
  } catch (e) {
    return res.send(errorTemplate({}));
  }
}

async function generateImageURL(appID: string | null) {
  if (appID) {
    const application = await ApplicationEntity.findByPk(appID);
    if (application?.customEmailTemplate?.imageURL) {
      return application?.customEmailTemplate?.imageURL;
    }
  }
  return `${APP_ORIGIN}/static/cord-wordmark.png`;
}
