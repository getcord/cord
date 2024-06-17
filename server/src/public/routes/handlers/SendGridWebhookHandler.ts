import type { Request, Response, NextFunction } from 'express';
import { v4 as uuid } from 'uuid';
import { LogLevel } from 'common/types/index.ts';
import type { JsonObject } from 'common/types/index.ts';
import { contextWithSession } from 'server/src/RequestContext.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { Viewer } from 'server/src/auth/index.ts';
import type { RelevantHeaders } from 'server/src/email/utils.ts';
import {
  emailTextToMessageContent,
  getNotification,
  parseRelevantHeaders,
} from 'server/src/email/utils.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import { MessageMutator } from 'server/src/entity/message/MessageMutator.ts';
import { getFeatureFlagValue } from 'server/src/featureflags/index.ts';
import { EventMutator } from 'server/src/entity/event/EventMutator.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { LinkedOrgsEntity } from 'server/src/entity/linked_orgs/LinkedOrgsEntity.ts';
import { anonymousLogger, Logger } from 'server/src/logging/Logger.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { executeNewMessageCreationTasks } from 'server/src/message/executeMessageTasks.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { PageEntity } from 'server/src/entity/page/PageEntity.ts';

export default async function SendGridWebhookHandler(
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  let logger = anonymousLogger();

  // Temporary debugging to collect data on a missing sendgrid call
  logger.debug('SendGridWebhookHandler', {
    body: req.body,
    headers: req.headers,
  });

  // tell Typescript that by default request's body fields are of type
  // "unknown" rather than "any". This forces us to always check that they
  // exist and have the right type.
  const reqBody: { [k: string]: unknown } | null | undefined = req.body;
  if (reqBody === null || reqBody === undefined) {
    logger.warn('request body missing');
    return res.end();
  }

  let headers: RelevantHeaders;
  if (reqBody.headers && typeof reqBody.headers === 'string') {
    headers = parseRelevantHeaders(reqBody.headers);
  } else {
    logger.warn('"Missing headers in Sendgrid request payload');
  }

  const toAddress = reqBody.to;
  if (typeof toAddress !== 'string') {
    logger.warn('Email "To" address is missing');
    return res.end();
  }
  const fromAddress = reqBody.from;
  if (typeof fromAddress !== 'string') {
    logger.warn('Email "From" address is missing');
    return res.end();
  }

  // Nice email clients won't send automated replies to us - they ought to obey
  // the 'Return-Path' header which Sendgrid sets for us and is something like
  // <bounces+16847044-d466-gillian=cord.com@em5842.cord.fyi>
  // Not all email clients are nice though and many will just reply to the 'From'
  // address. 'Auto-Submitted' is another header they should set if they are sending
  // an automated reply: see
  // https://www.iana.org/assignments/auto-submitted-keywords/auto-submitted-keywords.xhtml
  // NB MS Exchange are known to not do this, but we set a special header when we send the
  // notification email asking them not to send any automated responses (X-Auto-Response-Suppress)
  if (headers?.autoSubmitted && headers?.autoSubmitted !== 'no') {
    logger.warn('Email reply was autogenerated, discarding', {
      autoSubmitted: headers.autoSubmitted,
      sendgridMessageID: headers?.messageID,
    });
    return res.end();
  }

  const notification = await getNotification(
    toAddress,
    headers?.inReplyTo,
    fromAddress,
    logger,
  );
  if (notification === null) {
    logger.warn(
      'Notification id is not present in email address, could not be derived from headers, or notification is not present in db',
      {
        toAddress,
        inReplyTo: headers?.inReplyTo,
        fromAddress,
        sendgridMessageID: headers?.messageID,
      },
    );
    return res.end();
  }

  // Check the user is still part of the org and is active
  const [orgMember, user, thread] = await Promise.all([
    OrgMembersEntity.findOne({
      where: {
        userID: notification.userID,
        orgID: notification.orgID,
      },
    }),
    UserEntity.findOne({
      where: {
        id: notification.userID,
      },
    }),
    ThreadEntity.findByPk(notification.threadID),
  ]);

  if (!orgMember) {
    logger.warn('User who sent the email is no longer part of the org', {
      userID: notification.userID,
      orgID: notification.orgID,
    });
    return res.end();
  }
  if (!user || user.state !== 'active') {
    logger.warn('User who sent the email is no longer active', {
      userID: notification.userID,
      orgID: notification.orgID,
      state: user?.state,
    });
    return res.end();
  }
  if (!thread) {
    logger.warn('Cannot add message to non-existent thread');
    return res.end();
  }

  const [org, application] = await Promise.all([
    OrgEntity.findByPk(notification.orgID),
    ApplicationEntity.findByPk(thread.platformApplicationID),
  ]);

  if (!org) {
    logger.warn('Org not found', {
      orgID: notification.orgID,
      notificationId: notification.id,
    });
    return res.end();
  }
  if (!application) {
    logger.warn('Application not found', {
      platformApplicationID: user.platformApplicationID,
      notificationID: notification.id,
    });
    return res.end();
  }
  const flagsUser = {
    userID: notification.userID,
    orgID: notification.orgID,
    platformApplicationID: org.platformApplicationID ?? 'extension',
    version: null,
    customerID: application?.customerID,
  };
  const emailRepliesEnabled = await getFeatureFlagValue(
    'email_replies',
    flagsUser,
  );
  if (!emailRepliesEnabled) {
    return res.end();
  }

  // Deal with the case where a platform user has mentioned a non-platform user
  // in their slack org
  if (
    notification.threadOrgID &&
    notification.orgID !== notification.threadOrgID
  ) {
    const linkedOrg = await LinkedOrgsEntity.findOne({
      where: {
        sourceOrgID: notification.threadOrgID,
        linkedOrgID: notification.orgID,
      },
    });
    if (!linkedOrg) {
      logger.error('Email reply: linked org not found', {
        threadOrgId: notification.threadOrgID,
        notificationId: notification.id,
      });
      return res.end();
    }
  }

  // Finally, store the message in DB
  const emailText = reqBody.text;
  if (typeof emailText !== 'string' || emailText.length === 0) {
    logger.warn('email body not found or empty', emailText as JsonObject);
    return res.end();
  }

  const viewer = await Viewer.createLoggedInPlatformViewer({ user, org });

  logger = new Logger(viewer);

  try {
    const context = await contextWithSession(
      { viewer },
      getSequelize(),
      null,
      null,
    );

    const attachments = reqBody.attachments;
    if (typeof attachments !== 'string' || attachments.length === 0) {
      logger.warn(
        'attachment body not found or empty',
        attachments as JsonObject,
      );
      return res.end();
    }

    const content = emailTextToMessageContent(emailText, attachments);

    const message = await new MessageMutator(
      viewer,
      context.loaders,
    ).createMessage({
      id: uuid(),
      thread,
      content,
      url: null,
      replyToEmailNotificationID: notification.id,
    });

    const page = await PageEntity.findOne({
      where: {
        contextHash: thread?.pageContextHash,
      },
    });

    if (!page) {
      throw new Error(
        `Could not find page for message ${message.id} and thread ${thread?.id}`,
      );
    }
    await executeNewMessageCreationTasks({
      context,
      flagsUser,
      application,
      page,
      thread,
      message,
      fileAttachments: [],
      annotationAttachments: [],
      isFirstMessage: false,
      task: null,
      screenshotAttachment: null,
      sendNotifications: !!viewer.platformApplicationID,
      subscribeToThread: false,
    });

    // Don't replace viewer's org ID for logging event
    const eventMutator = new EventMutator(
      (
        await contextWithSession(
          {
            viewer: Viewer.createLoggedInViewer(
              notification.userID,
              notification.orgID,
            ),
          },
          getSequelize(),
          null,
          null,
        )
      ).session,
    );
    await eventMutator.createEvent({
      pageLoadID: null,
      installationID: null,
      eventNumber: null,
      clientTimestamp: new Date(Date.now()),
      logLevel: LogLevel.DEBUG,
      type: 'reply-via-email',
      payload: {
        messageID: message.id,
        notificationID: notification.id,
        sendgridMessageID: headers?.messageID,
      },
      metadata: {},
    });
  } catch (e) {
    logger.logException('failed to create a message from email reply', e);
  }

  return res.end();
}
