import type {
  NotificationReplyAction,
  CoreThreadData,
  CoreMessageData,
  EntityMetadata,
  CoreNotificationData,
  UUID,
  ClientUserData,
  MessageContent,
} from '@cord-sdk/types';

// Typing of the payloads we send to clients
export interface WebhookPayloads {
  'thread-message-added': ThreadMessageAddedWebhookPayload;
  'notification-created': NotificationCreatedWebhookPayload;
  'url-verification': URLVerificationWebhookPayload;
}

export interface ThreadMessageAddedWebhookPayload {
  // TODO: deprecate all of these as they have been regrouped into new message
  // and thread fields, below
  threadID: string;
  messageID: string;
  /**
   * @deprecated use groupID instead.
   */
  orgID: string;
  /**
   * @deprecated use groupID instead.
   */
  organizationID: string;
  groupID: string;
  /**
   * @deprecated use projectID instead.
   */
  applicationID: UUID; // exception: this one will be moved to higher level (see postEvent)
  projectID: UUID; // exception: this one will be moved to higher level (see postEvent)
  author: ClientUserData;
  content: MessageContent;
  plaintext: string;
  url: string;
  messageType: 'action_message' | 'user_message';
  metadata: EntityMetadata;
  // new format/things that can stay the same
  message: WebhookMessage;
  thread: CoreThreadData;
  usersToNotify: UsersToNotify[];
}

// Need to be split out to help the docs type extraction script
export interface WebhookMessage extends CoreMessageData {
  author: ClientUserData;
}

export interface UsersToNotify extends ClientUserData {
  replyActions: NotificationReplyAction[] | null;
}

export interface NotificationCreatedWebhookPayload
  extends CoreNotificationData {
  recipientUserID: string;
}

export interface URLVerificationWebhookPayload {
  message: string;
}

export type WebhookTypes = keyof WebhookPayloads;

export interface WebhookWrapperProperties<T extends WebhookTypes> {
  /**
   * The type of event.  The contents of the event property will vary depending
   * on the event type.  See https://docs.cord.com/reference/events-webhook#Events-2
   * for more detail about the body of each event type.
   */
  type: T;
  /**
   * The time at which this event was sent.
   */
  timestamp: string;
  /**
   * @deprecated use projectID instead.
   */
  applicationID: string;
  /**
   * The ID for the project this event belongs to.
   */
  projectID: string;
  /**
   * The body of the event, which will vary depending on event type.
   * See https://docs.cord.com/reference/events-webhook#Events-2 for more
   * detail about the body of each event type.
   */
  event: WebhookPayloads[T];
}

export type ServerCreateWebhook = {
  /**
   * The URL to register that will receive webhook events
   * @format uri
   */
  url: string;

  /**
   * The events which you will receive
   */
  events: (keyof WebhookPayloads)[];
};
