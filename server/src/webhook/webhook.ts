import { createHmac } from 'crypto';

import jsonStableStringify from 'fast-json-stable-stringify';

import type {
  WebhookPayloads,
  ClientUserData,
  WebhookTypes,
  WebhookWrapperProperties,
} from '@cord-sdk/types';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import type { UUID } from 'common/types/index.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { NotificationEntity } from 'server/src/entity/notification/NotificationEntity.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { convertStructuredMessageToText } from '@cord-sdk/react/common/lib/messageNode.ts';
import {
  getThreadLocation,
  loadParticipants,
  loadUserMessagesCount,
  loadSubscribers,
  loadTypingUsers,
  loadActionMessagesCount,
  loadDeletedMessagesCount,
  loadMentioned,
  loadRepliers,
  loadActionMessageRepliers,
} from 'server/src/public/routes/platform/threads/GetThreadHandler.ts';
import { whereAggregatedNotificationEntity } from 'server/src/public/mutations/notifications/utils.ts';
import { buildNotification } from 'server/src/notifications/fetch.ts';
import { gqlNotificationToNotificationVariables } from 'server/src/notifications/convert.ts';
import { createViewerAndContext } from 'server/src/util/createViewerAndContext.ts';
import { getCoreMessageData } from 'server/src/public/routes/platform/messages/getCoreMessageData.ts';
import { ApplicationWebhookEntity } from 'server/src/entity/application_webhook/ApplicationWebhookEntity.ts';
import { getNewLoaders } from 'server/src/RequestContextLoaders.ts';
import { Viewer } from 'server/src/auth/index.ts';
import { userDisplayName, userFullName } from 'server/src/entity/user/util.ts';
import submitAsync from 'server/src/asyncTier/submitAsync.ts';

// This defines the data that publishEventToWebhook will receive except that
// the field type is omitted on purpose to make typechecker happy.
// The type field is added in the WebhookEvent type. For more details, see
// (https://stackoverflow.com/questions/76492435/how-to-type-a-dispatch-function-in-typescript?noredirect=1#comment134877125_76492435)
type WebhookEvents = {
  'thread-message-added': {
    threadID: UUID;
    messageID: UUID;
  };
  'notification-created': {
    notificationID: string;
    userID: UUID; //recipientID
  };
  'url-verification': object;
};

type WebhookEvent<T extends WebhookTypes> = {
  [Type in WebhookTypes]: WebhookEvents[Type] & { type: Type };
}[T];

// All payload IDs which are sent to customers are external IDs
export type WebhookPayload<T extends WebhookTypes> = {
  [K in T]: WebhookPayloads[K];
}[T];

type HandlerType = {
  [Type in WebhookTypes]: (
    event: WebhookEvent<Type>,
  ) => Promise<WebhookPayload<Type>>;
};

function assemblePayload<T extends WebhookTypes>(
  type: T,
  appID: UUID,
  timestamp: string,
  eventBody: WebhookPayload<T>,
): WebhookWrapperProperties<T> & WebhookPayload<T> {
  return {
    type,
    applicationID: appID,
    projectID: appID,
    timestamp,
    event: eventBody,
    ...eventBody, // TODO: remove when we're sure consuming code has been updated
  };
}

export async function publishEventToWebhook<T extends WebhookTypes>(
  app: ApplicationEntity,
  event: WebhookEvent<T>,
) {
  // Webhooks can be specified in two places.
  // The first is directly on the application by the application developer.  This
  // is a customer going in to the console or via api and setting the singular
  // callback location for events
  // The second place is via webhook registration and is used by Zapier
  // and perhaps other applications to register webhooks.
  // We need to check both locations as possible places to send the events
  const webhooks = [];
  if (
    app.eventWebhookURL &&
    app.eventWebhookSubscriptions?.includes(event.type)
  ) {
    webhooks.push(app.eventWebhookURL);
  }

  const applicationWebhooks = await ApplicationWebhookEntity.findAll({
    where: { platformApplicationID: app.id },
  });
  webhooks.push(
    ...applicationWebhooks
      .filter(
        (entity) =>
          entity.eventWebhookURL &&
          entity.eventWebhookSubscriptions?.includes(event.type),
      )
      .map((entity) => entity.eventWebhookURL),
  );

  if (webhooks.length === 0) {
    return;
  }

  const handler = handlers[event.type];
  const payload = await handler(event);

  await postEvent(app, webhooks, event.type, payload);
}

export function authenticationHeader<T extends WebhookTypes>(
  eventType: WebhookTypes,
  app: ApplicationEntity,
  event: WebhookPayload<T>,
) {
  // This is based on how Slack does it:
  //   https://api.slack.com/authentication/verifying-requests-from-slack
  const timestamp = Date.now().toString();
  const payloadString = jsonStableStringify(
    assemblePayload(eventType, app.id, timestamp, event),
  );
  const hmac = createHmac('sha256', app.sharedSecret);
  hmac.update(timestamp + ':' + payloadString);
  const signature = hmac.digest('base64');

  return [payloadString, timestamp, signature];
}

async function postEvent<T extends WebhookTypes>(
  app: ApplicationEntity,
  webhookURLs: string[],
  eventType: WebhookTypes,
  event: WebhookPayload<T>,
) {
  if (webhookURLs.length === 0) {
    return;
  }

  const [payloadString, timestamp, signature] = authenticationHeader(
    eventType,
    app,
    event,
  );

  await Promise.all(
    webhookURLs.map(async (url) => {
      void submitAsync('notifyWebhook', {
        retryCount: 0,
        eventType: eventType,
        appID: app.id,
        url: url,
        timestamp: timestamp,
        signature: signature,
        payload: payloadString,
        event: event,
      });
    }),
  );
}

export const handlers: HandlerType = {
  'thread-message-added': handleThreadMessageAddedEvent,
  'notification-created': handleNotificationCreatedEvent,
  'url-verification': handleVerifyWebhookURL,
};

export async function handleVerifyWebhookURL(
  _event: WebhookEvent<'url-verification'>,
): Promise<WebhookPayload<'url-verification'>> {
  return {
    message: 'Please respond with a HTTP 200 status code.',
  };
}

async function handleThreadMessageAddedEvent(
  event: WebhookEvent<'thread-message-added'>,
): Promise<WebhookPayload<'thread-message-added'>> {
  const [message, thread, notifications] = await Promise.all([
    MessageEntity.findByPk(event.messageID),
    ThreadEntity.findByPk(event.threadID),
    NotificationEntity.findAll({ where: { messageID: event.messageID } }),
  ]);

  if (!message || !thread) {
    throw new Error(
      'Unable to find message and/or thread when creating webhook payload',
    );
  }

  const notifiedUserIntIDs = notifications.map((n) => n.recipientID);

  const loaders = await getNewLoaders(
    Viewer.createOrgViewer(thread.orgID, thread.platformApplicationID),
  );

  const [
    users,
    org,
    repliers,
    actionMessageRepliers,
    participants,
    subscribers,
    mentioned,
    typing,
    totalThreadMessages,
    userThreadMessages,
    actionThreadMessages,
    deletedThreadMessages,
    location,
    coreMessageData,
  ] = await Promise.all([
    UserEntity.findAll({
      where: { id: [message.sourceID, ...notifiedUserIntIDs] },
    }),
    OrgEntity.findByPk(thread.orgID),
    loadRepliers(loaders.threadLoader, thread.id),
    loadActionMessageRepliers(loaders.threadLoader, thread.id),
    loadParticipants(thread.id),
    loadSubscribers(thread.id),
    loadMentioned(thread.id),
    loadTypingUsers(thread.id),
    MessageEntity.count({ where: { threadID: thread.id } }),
    loadUserMessagesCount(thread.id),
    loadActionMessagesCount(thread.id),
    loadDeletedMessagesCount(thread.id),
    getThreadLocation(thread),
    getCoreMessageData(loaders, message, thread),
  ]);

  if (!org) {
    throw new Error('Unable to find org when creating webhook payload');
  }

  const externalUserInfo = users.reduce<Record<string, ClientUserData>>(
    (obj, u) => {
      obj[u.id] = {
        id: u.externalID,
        metadata: u.metadata,
        name: u.name,
        shortName: u.screenName,
        displayName: userDisplayName(u),
        secondaryDisplayName: userFullName(u),
        profilePictureURL: u.profilePictureURL,
      };
      return obj;
    },
    {},
  );

  const usersToNotifyInfo = notifications.map((n) => ({
    replyActions: n.replyActions,
    ...externalUserInfo[n.recipientID],
  }));

  return {
    // TODO: deprecate this first chunk (see comment on WebhookPayloads interface)
    messageID: message.externalID,
    threadID: thread.externalID,
    orgID: org.externalID,
    organizationID: org.externalID,
    groupID: org.externalID,
    applicationID: message.platformApplicationID,
    projectID: message.platformApplicationID,
    author: externalUserInfo[message.sourceID],
    content: message.content,
    plaintext: convertStructuredMessageToText(message.content),
    url: message.url ?? thread.url,
    messageType: message.type,
    metadata: message.metadata,

    // New format:
    usersToNotify: usersToNotifyInfo,
    message: {
      author: externalUserInfo[message.sourceID],
      ...coreMessageData,
    },
    thread: {
      id: thread.externalID,
      organizationID: org.externalID,
      groupID: org.externalID,
      name: thread.name,
      metadata: thread.metadata,
      location,
      total: totalThreadMessages,
      userMessages: userThreadMessages,
      actionMessages: actionThreadMessages,
      deletedMessages: deletedThreadMessages,
      resolved: !!thread.resolvedTimestamp,
      resolvedTimestamp: thread.resolvedTimestamp,
      participants,
      subscribers,
      mentioned,
      repliers,
      actionMessageRepliers,
      typing,
      url: thread.url,
      extraClassnames: thread.extraClassnames,
    },
  };
}

async function handleNotificationCreatedEvent(
  event: WebhookEvent<'notification-created'>,
): Promise<WebhookPayload<'notification-created'>> {
  const notif = await NotificationEntity.findByPk(event.notificationID);

  if (!notif) {
    throw new Error(
      `Unable to find notification when creating webhook payload. notificationID: ${event.notificationID}, userID: ${event.userID}`,
    );
  }

  const platformApplicationID = notif.platformApplicationID;

  const user = await UserEntity.findOne({
    where: { platformApplicationID, id: event.userID },
  });
  if (!user) {
    throw new Error(
      'Unable to find recipient user when creating webhook payload',
    );
  }

  const context = await createViewerAndContext(
    platformApplicationID,
    user,
    'webhook',
  );

  const aggregateEntities = await NotificationEntity.findAll({
    where: whereAggregatedNotificationEntity(notif),
  });
  const gqlNotif = await buildNotification(context, aggregateEntities);

  if (!gqlNotif) {
    throw new Error('No notification found when creating webhook payload');
  }

  const notifVariables = await gqlNotificationToNotificationVariables(
    context.loaders,
    gqlNotif,
  );

  return {
    recipientUserID: user.externalID,
    ...notifVariables,
  };
}
