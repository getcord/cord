import type { Request, Response } from 'express';
import { errorRedirectTemplate } from 'server/src/public/routes/notifications_logging/handlebars.ts';
import { APP_ORIGIN } from 'common/const/Urls.ts';
import { MessageOutboundNotificationEntity } from 'server/src/entity/message_notification/MessageOutboundNotificationEntity.ts';
import { NOTIFICATION_LOGGING_REDIRECT_ID_LENGTH } from 'common/const/Api.ts';
import { EventMutator } from 'server/src/entity/event/EventMutator.ts';
import type { UUID } from 'common/types/index.ts';
import { LogLevel } from 'common/types/index.ts';
import { setDeepLinkThreadMessageID } from 'server/src/deep_link_threads/index.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { getFeatureFlagValue } from 'server/src/featureflags/index.ts';
import { FeatureFlag } from 'common/const/UserPreferenceKeys.ts';
import { extractDeepLinkQueryParams } from 'common/util/index.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { getNotificationRedirectURI } from 'server/src/util/notificationRedirectURI.ts';
import { anonymousLogger, Logger } from 'server/src/logging/Logger.ts';
import { Viewer } from 'server/src/auth/index.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';

export default async function NotificationLoggingHandler(
  req: Request,
  res: Response,
) {
  const { redirectID } = req.params;
  let logger = anonymousLogger();

  try {
    if (!redirectID) {
      throw new Error(`redirectID does not exist, url: ${req.url}`);
    }
    if (redirectID.length !== NOTIFICATION_LOGGING_REDIRECT_ID_LENGTH) {
      logger.warn(`redirectID length is incorrect, id: ${redirectID}`);
      return res.send(
        errorRedirectTemplate({
          imageURL: `${APP_ORIGIN}/static/cord-wordmark.png`,
        }),
      );
    }

    const messageNotificationEntity =
      await MessageOutboundNotificationEntity.findByPk(redirectID);

    if (!messageNotificationEntity) {
      throw new Error(`notification does not exist, id:${redirectID}`);
    }
    const {
      url: originalURL,
      type,
      messageID,
      targetUserID,
      targetOrgID,
      sharerOrgID,
    } = messageNotificationEntity;

    const org = await OrgEntity.findByPk(targetOrgID);

    if (!org) {
      logger.warn('Org not found', { orgID: targetOrgID, redirectID });
      return res.end();
    }

    const orgViewer = Viewer.createOrgViewer(org.id);

    logger = new Logger(orgViewer, {
      id: org.id,
      externalId: org.externalID,
      appId: org.platformApplicationID,
      name: org.name,
    });
    let url = originalURL;
    if (!sharerOrgID) {
      // liklely to be an old notification where we didn't log sharerOrgID
      // or sharerUserID
      logger.warn(`Sharer orgID does not exist`, {
        orgID: targetOrgID,
        redirectID,
      });
    } else {
      const sharerOrg = await OrgEntity.findByPk(sharerOrgID);

      if (!sharerOrg) {
        throw new Error(`Sharer org does not exist: ${sharerOrgID}`);
      }

      url = !sharerOrg.platformApplicationID
        ? originalURL
        : await getNotificationRedirectURI(logger, {
            targetOrgID,
            platformApplicationID: sharerOrg.platformApplicationID,
            redirectID,
            targetExternalOrgID: org.externalID,
            messageNotificationEntity,
          });
    }

    const fromSlackUnfurler = requestFromSlackUnfurler(req);
    if (!fromSlackUnfurler) {
      let loggedInViewer: Viewer | null = null;
      if (targetUserID) {
        const orgMembership = await OrgMembersEntity.findOne({
          where: { userID: targetUserID, orgID: targetOrgID },
        });
        if (orgMembership) {
          loggedInViewer = Viewer.createLoggedInViewer(
            targetUserID,
            targetOrgID,
          );
        }
      }
      const targetUserEventMutator = new EventMutator({
        viewer: loggedInViewer ?? orgViewer,
      });

      await targetUserEventMutator.createEvent({
        pageLoadID: null,
        installationID: null,
        eventNumber: null,
        clientTimestamp: new Date(Date.now()),
        logLevel: LogLevel.DEBUG,
        type: `notification-logging`,
        payload: {
          messageNotifications: messageNotificationEntity.get({ plain: true }),
          userAgent: req.get('User-Agent'),
        },
        metadata: {},
      });

      if (targetUserID) {
        await maybeDeeplinkViaRedis({
          logger,
          userID: targetUserID,
          org,
          url,
          redirectID,
          messageID,
        });
      }
    }

    logger.debug(`notifications-logging-${type}`, {
      url,
      type,
      fromSlackUnfurler,
      userAgent: req.get('User-Agent'),
    });

    return res.redirect(302, url);
  } catch (error) {
    logger.logException('notifications-logging-error', error, {
      redirectID,
      url: req.url,
      headers: req.headers,
      remoteAddress: req.socket.remoteAddress,
    });

    return res.send(
      errorRedirectTemplate({
        imageURL: `${APP_ORIGIN}/static/cord-wordmark.png`,
      }),
    );
  }
}

function requestFromSlackUnfurler(req: Request): boolean {
  const userAgent = req.get('User-Agent');
  return (
    userAgent !== undefined && userAgent.includes('Slackbot-LinkExpanding')
  );
}

async function maybeDeeplinkViaRedis({
  logger,
  userID,
  org,
  url,
  messageID,
  redirectID,
}: {
  logger: Logger;
  userID: UUID;
  org: OrgEntity;
  url: string;
  messageID: UUID;
  redirectID: UUID;
}) {
  let application;
  if (org.platformApplicationID) {
    application = await ApplicationEntity.findByPk(org.platformApplicationID);
  }
  // Add message/thread IDs to redis to enable deep linking - i.e. when the
  // redirect page loads, the relevant thread or message will be highlighted
  const shouldDeepLinkMessageViaRedis = await getFeatureFlagValue(
    FeatureFlag.DEEP_LINK_MESSAGE_FROM_NOTIFICATION,
    {
      userID,
      orgID: org.id,
      platformApplicationID: org.platformApplicationID ?? 'extension',
      version: null,
      customerID: application?.customerID,
    },
  );

  if (!shouldDeepLinkMessageViaRedis) {
    return;
  }
  const deepLinkParams = extractDeepLinkQueryParams(url);
  const queryParamDeeplinkEnabled = await getFeatureFlagValue(
    FeatureFlag.QUERY_PARAM_DEEP_LINKS,
    {
      userID,
      orgID: org.id,
      platformApplicationID: org.platformApplicationID ?? 'extension',
      version: null,
      customerID: application?.customerID,
    },
  );
  const deepLinkingViaQueryParams =
    !!deepLinkParams && queryParamDeeplinkEnabled;
  if (deepLinkingViaQueryParams) {
    // dont deeplink via Redis as we're already deeplinking via query params
    return;
  }

  const message = await MessageEntity.findOne({
    where: { id: messageID },
  });

  const threadID = message?.threadID;
  if (!threadID) {
    // this should never happen thanks to current DB schema, but just in case
    logger.error('threadID was undefined', { messageID, redirectID });
    return;
  }

  await setDeepLinkThreadMessageID({
    threadID,
    messageID,
    userID,
  });
}
