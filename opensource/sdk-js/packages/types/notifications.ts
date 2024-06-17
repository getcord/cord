import type {
  EntityMetadata,
  ListenerRef,
  PaginationParams,
  Location,
  LocationFilterOptions,
} from './core.js';
import type { ClientUserData } from './user.js';
import type { CoreMessageData } from './message.js';
import type { Translation } from './i18n.js';
import type { CoreThreadData } from './thread.js';

export type NotificationSummary = {
  /**
   * The number of notifications that the current user hasn't seen yet.
   */
  unread: number;
};

export type NotificationSummaryUpdateCallback = (
  summary: NotificationSummary,
) => unknown;

/**
 * An attachment representing a URL.
 */
export type NotificationURLAttachment = {
  /**
   * Indicator that this is a URL attachment.
   */
  type: 'url';

  /**
   * The URL this attachment points to. This would typically be the URL to send
   * the browser to if this notification is clicked.
   */
  url: string;
};

/**
 * An attachment representing a message.
 */
export type NotificationMessageAttachment = {
  /**
   * Indicator that this is a message attachment.
   */
  type: 'message';

  /**
   * @deprecated Use `message.id` instead.
   */
  messageID: string;

  /**
   * @deprecated Use `message.threadID` instead.
   */
  threadID: string;

  /**
   * The relevant message.
   */
  message: CoreMessageData;
};

/**
 * An attachment representing a thread.
 */
export type NotificationThreadAttachment = {
  /**
   * Indicator that this is a thread attachment.
   */
  type: 'thread';

  /**
   * The relevant thread.
   */
  thread: CoreThreadData;
};

type NotificationHeaderNode = NotificationTextHeader | NotificationUserHeader;

/**
 * A header node representing a basic string.
 */
type NotificationTextHeader = {
  /**
   * Indicator that this is a string header node.
   */
  type: 'text';

  /**
   * The text to display. This text may start and/or end with whitespace, which
   * should typically *not* be trimmed. For example, in order to display the
   * notification `"Alice replied to your thread."`, this would typically be
   * composed of two nodes -- a user node for Alice, and then a text node
   * containing `" replied to your thread."`, with a meaningful space at the
   * front, to separate this node from Alice's name.
   */
  text: string;

  /**
   * Whether the text should be formatted in bold.
   */
  bold: boolean;
};

/**
 * A header node representing a reference to a specific user.
 */
type NotificationUserHeader = {
  /**
   * Indicator that this is a user reference header node.
   */
  type: 'user';

  /**
   * @deprecated Use `user.id` instead.
   */
  userID: string;

  /**
   * The indicated user.
   */
  user: ClientUserData;
};

export interface CoreNotificationData {
  /**
   * The [ID](https://docs.cord.com/reference/identifiers) for this notification.
   */
  id: string;

  /**
   * The [IDs](https://docs.cord.com/reference/identifiers) of the user(s) who
   * sent this notification. The Cord backend will sometimes aggregate multiple
   * notifications together, causing them to have multiple senders. For example,
   * if multiple people react to the same message, that will generate only one
   * notification (but with multiple senders, one for each person who reacted).
   */
  senderUserIDs: string[];

  /**
   * The URL of an icon image for this notification, if one was specified when
   * it was created. This will always be `null` for Cord's internally-generated
   * notifications (i.e., it can only be non-null for notifications you create
   * via the REST API).
   */
  iconUrl: string | null;

  /**
   * The "header" or "text" of the notification. This will represent text like
   * "Alice replied to your thread." or similar. For notifications you create
   * via the REST API, this will be based upon the `template` parameter, see
   * below.
   */
  header: NotificationHeaderNode[];

  /**
   * A translation that can be used to translate the header of the notification.
   * All Cord-created notifications will have a translation, but this may be
   * null for notifications you [create through the REST
   * API](https://docs.cord.com/rest-apis/notifications#Create-a-notification).
   * See [the translations
   * documentation](https://docs.cord.com/customization/translations) for more
   * information.
   */
  headerTranslation: Translation | null;

  /**
   * Additional context attached to the notification. For example, if this
   * notification is about a new reaction on a message, the attachment will
   * specify what message received that new reaction.
   *
   * A renderer will typically check the `type` field of the attachment and
   * render that attachment type below the `header`.
   *
   * We may include other types of attachments in the future and therefore
   * recommend having a default case when handling the attachment types.
   */
  attachment:
    | NotificationURLAttachment
    | NotificationMessageAttachment
    | NotificationThreadAttachment
    | null;

  /**
   * Whether this notification has been read by the recipient yet.
   */
  readStatus: 'unread' | 'read';

  /**
   * The time this notification was sent.
   */
  timestamp: Date;

  /**
   * A space separated list of classnames to add to the notification.
   */
  extraClassnames: string | null;

  /**
   * An arbitrary JSON object specified when the notification was created. This
   * will always be an empty object for Cord's internally-generated
   * notifications (i.e., it can only be non-null for notifications you create
   * via the REST API).
   */
  metadata: EntityMetadata;
}

export interface ClientNotificationData extends PaginationParams {
  /**
   * The current user's notifications, in reverse-chronological order (i.e.,
   * newest first). Calling `fetchMore` will load a batch of older notifications
   * and append them to this list. Any new notifications that are sent to the
   * current viewer will automatically be prepended to this list.
   */
  notifications: CoreNotificationData[];
}

export type NotificationDataUpdateCallback = (
  data: ClientNotificationData,
) => unknown;

export type NotificationListFilter = {
  /**
   * An arbitrary JSON object specified when the notification is created.
   * The value for a `metadata` entry should be an object representing the
   * metadata key/value to filter on.  For example, to filter only notifications
   * with the metadata key of `"category"` set to `"sales"`, set the filter
   * to `{ metadata: { category: "sales" } }`.
   */
  metadata?: EntityMetadata;
  /**
   * The [location](https://docs.cord.com/reference/location) where the notifications
   * live.
   * This will be the location of the thread containing the message which
   * prompted the notification.
   */
  location?: Location | LocationFilterOptions;
  /**
   * @deprecated use groupID instead
   */
  organizationID?: string;
  /**
   * The group to which the message that prompted the notification belongs.
   */
  groupID?: string;
};

export interface ObserveNotificationSummaryOptions {
  /**
   * An object that can be used to filter the notifications returned.
   */
  filter?: NotificationListFilter;
}

export interface ObserveNotificationDataOptions {
  /**
   * An object that can be used to filter the notifications returned.
   */
  filter?: NotificationListFilter;
}

export type MarkAllNotificationsAsReadFilter = NotificationListFilter & {
  /**
   * The message that prompted the notification.
   */
  messageID?: string;
};

export interface MarkAllNotificationsAsReadOptions {
  /**
   * An object that can be used to filter the notifications marked as read.
   */
  filter?: MarkAllNotificationsAsReadFilter;
}

export interface ICordNotificationSDK {
  /**
   * This method allows you to observe the count of unread notifications for the
   * current user, including live updates.
   *
   * @example Overview
   * ```javascript
   * const ref = window.CordSDK.notification.observeNotificationCounts(
   *   (counts) => {
   *        console.log("Unread notifications", counts.unread);
   *   },
   *   { filter: {
   *         metadata: { flavor: 'minty' },
   *         location: { page: 'bookmarks' },
   *         groupID: 'group123',
   *    }}
   * );
   * ```
   *
   * @param callback - This callback will be called once with the current
                    notification counts, and then again every time the data
                    changes. The argument passed to the callback is an object
                    which will contain the fields described under "Available
                    Data" above..
   *
   * @param options
   *
   * @returns A reference number which can be passed to
   *  `unobserveNotificationCounts` to stop observing notification count
   *  information.
   */
  observeNotificationCounts(
    callback: NotificationSummaryUpdateCallback,
    options?: ObserveNotificationSummaryOptions,
  ): ListenerRef;
  unobserveNotificationCounts(ref: ListenerRef): boolean;

  /**
   * @deprecated Renamed to `observeNotificationCounts`
   */
  observeSummary(
    callback: NotificationSummaryUpdateCallback,
    options?: ObserveNotificationSummaryOptions,
  ): ListenerRef;
  /**
   * @deprecated Renamed to `unobserveNotificationCounts`
   */
  unobserveSummary(ref: ListenerRef): boolean;

  /**
   * This method allows you to observe the available notifications for the
   * current user, including live updates.
   *
   * @example Overview
   * ```javascript
   * const ref = window.CordSDK.notification.observeNotifications(
   *   ({ notifications, loading, hasMore, fetchMore }) => {
   *     console.log('Got a notifications data update:');
   *     if (loading) {
   *       console.log('Loading...');
   *     }
   *     notifications.forEach((notification) =>
   *       console.log(`Got notification ${notification.id}!`),
   *     );
   *     if (!loading && hasMore && notifications.length < 25) {
   *       // Get the first 25 notifications, 10 at a time.
   *       fetchMore(10);
   *     }
   *   },
   *   { filter: { metadata: { flavor: 'minty' } } },
   * );
   * ```
   *
   * @param callback - This callback will be called once with the current
   * notifications, and then again every time the data changes. The argument
   * passed to the callback is an object which will contain the fields described
   * under "Available Data" above.
   *
   * @param options - Miscellaneous options.
   *
   * @returns A reference number which can be passed to `unobserveNotifications`
   * to stop observing notifications.
   */
  observeNotifications(
    callback: NotificationDataUpdateCallback,
    options?: ObserveNotificationDataOptions,
  ): ListenerRef;
  unobserveNotifications(ref: ListenerRef): boolean;

  /**
   * @deprecated Renamed to `observeNotifications`
   */
  observeData(
    callback: NotificationDataUpdateCallback,
    options?: ObserveNotificationDataOptions,
  ): ListenerRef;
  /**
   * @deprecated Renamed to `unobserveNotifications`
   */
  unobserveData(ref: ListenerRef): boolean;

  /**
   * Mark a specific notification as read.
   *
   * @example Usage
   * ```javascript
   * window.CordSDK.notification.markAsRead('my-awesome-notification-id');
   * ```
   *
   * @param notificationID - The ID of the notification to mark as read.
   *
   * @returns A promise which resolves when the database write has completed.
   */
  markAsRead(notificationID: string): Promise<void>;

  /**
   * Mark a specific notification as unread.
   *
   * @example Usage
   * ```javascript
   * window.CordSDK.notification.markAsUnread('my-awesome-notification-id');
   * ```
   *
   * @param notificationID - The ID of the notification to mark as unread.
   *
   * @returns A promise which resolves when the database write has completed.
   */
  markAsUnread(notificationID: string): Promise<void>;

  /**
   * Mark all notifications as read (that, optionally, match a filter).
   *
   * @example Usage
   * ```javascript
   * window.CordSDK.notification.markAllAsRead(
   *   { filter: { metadata: { flavor: 'minty' } } },
   * );
   * ```
   *
   * @param options - Miscellaneous options.
   *
   * @returns A promise which resolves when the database writes have completed.
   */
  markAllAsRead(options?: MarkAllNotificationsAsReadOptions): Promise<void>;

  /**
   * Delete a notification
   *
   * @example Overview
   * ```javascript
   * window.CordSDK.notification.delete('my-awesome-notification-id');
   * ```
   *
   * @param notificationID - The ID of the notification to delete.
   *
   * @returns A promise that resolves to `true` if the operation succeeded or
   * rejects if it failed.
   */
  delete(notificationID: string): Promise<true>;

  /**
   * @deprecated Renamed to unobserveSummary.
   */
  unobserveNotificationSummary(
    ...args: Parameters<ICordNotificationSDK['unobserveSummary']>
  ): ReturnType<ICordNotificationSDK['unobserveSummary']>;
}

/**
 * https://docs.cord.com/rest-apis/notifications
 */
export type ServerCreateNotification = {
  /**
   * ID of user who is the "actor" sending the notification, i.e., the user
   * taking the action the notification is about.
   *
   * Required if `template` includes `{{actor}}`.
   */
  actorID?: string;

  /**
   * @deprecated alias for actorID.
   */
  actor_id?: string;

  /**
   * ID of user receiving the notification.
   */
  recipientID?: string;

  /**
   * @deprecated alias for recipientID.
   */
  recipient_id?: string;

  /**
   * Template for the header of the notification. The expressions `{{actor}}`
   * and `{{recipient}}` will be replaced respectively with the notification's
   * actor and recipient. (See below for an example.)
   */
  template: string;

  /**
   * URL of page to go to when the notification is clicked.
   */
  url: string;

  /**
   * URL of an icon image if a specific one is desired. For notifications with
   * an `actor_id` this will default to the sender's profile picture, otherwise
   * it will default to a bell icon.
   */
  iconUrl?: string;

  /**
   * Currently must be set to `url`. In the future this may specify different
   * types of notifications, but for now only `url` is defined.
   */
  type: 'url';

  /**
   * An arbitrary JSON object that can be used to set additional metadata on the
   * notification. When displaying a [list of
   * notifications](https://docs.cord.com/components/cord-notification-list),
   * you can filter the list by metadata value.
   *
   * Keys are strings, and values can be strings, numbers or booleans.
   */
  metadata?: EntityMetadata;

  /**
   * An optional space separated list of classnames to add to the notification.
   */
  extraClassnames?: string | null;
};

export type ServerListNotificationParameters = {
  /**
   * Notifications will be matched against the filters specified.
   * Please note that because this is a query parameter in a REST API,
   * this JSON object must be URI encoded before being sent.
   */
  filter?: NotificationListFilter;
};

// NB: these strings are written into the DB, so changes need to be
// backwards-compatible or involve a migration.
export type NotificationReplyAction =
  | 'create-thread'
  | 'mention'
  | 'assign-task'
  | 'unassign-task'
  | 'attach-file';
