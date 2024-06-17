import type {
  EntityMetadata,
  FilterParameters,
  GroupID,
  ListenerRef,
  Location,
  LocationFilterOptions,
  MessageID,
  OrganizationID,
  PaginationParams,
  ResolvedStatus,
  ThreadID,
  UserID,
  ViewerThreadStatus,
} from './core.js';
import type {
  ClientMessageData,
  CoreMessageData,
  MessageCallback,
  SearchOptionsType,
  SearchResultData,
} from './message.js';
import type { PaginationDetails } from './pagination.js';

/**
 * Options for the `observeLocationSummary` function in the Thread API.
 */
export interface ObserveThreadActivitySummaryOptions {
  /**
   * If `true`, perform [partial
   * matching](https://docs.cord.com/reference/location#Partial-Matching) on the
   * specified location. If `false`, fetch information for only exactly the
   * location specified.
   *
   * If unset, defaults to `false`.
   */
  partialMatch?: boolean;

  filter?: Pick<ThreadListFilter, 'groupID'>;
}

export interface ObserveThreadCountsOptions {
  /**
   * An object that can be used to filter the threads returned.
   */
  filter?: ClientThreadFilter;
}

export type ObserveThreadActivitySummaryHookOptions = {
  partialMatch?: boolean;
};

/**
 * A summary of the activity within a single thread.
 */
export interface ThreadActivitySummary {
  /**
   * The total number of threads, both resolved and unresolved.
   * This does not include threads in which all messages have been
   * deleted.
   */
  total: number;

  /**
   * The total number of threads that contain *at least one* unread message in
   * the thread.
   *
   * This will count all threads with unread messages, whether
   * the current user is subscribed to the thread or not.
   */
  unread: number;

  /**
   * The number of threads that have messages the current user hasn't seen yet
   * and is subscribed to.
   *
   * A user is automatically subscribed to threads relevant to them, for example
   * because they have sent a message or have been \@-mentioned in them.
   * `unreadSubscribed` is always less than or equal to `unread`.
   */
  unreadSubscribed: number;

  /**
   * The total number of threads that the user has never seen before at all,
   * i.e., *every* message in the thread is unread.
   *
   * This will count all threads with unread messages, whether
   * the current user is subscribed to the thread or not.
   */
  new: number;

  /**
   * The number of resolved threads. This refers to threads that users have
   * manually marked as resolved within Cord's UI components.
   */
  resolved: number;

  /**
   * The number of thread with no visible messages. This refers to threads
   * in which all the messages have been deleted.
   */
  empty: number;
}

export type ThreadActivitySummaryUpdateCallback = (
  summary: ThreadActivitySummary,
) => unknown;

/**
 * @deprecated All functions in this interface have been renamed.
 */
export interface ICordActivitySDK {
  /**
   * @deprecated Renamed to sdk.thread.observeLocationSummary.
   */
  observeThreadSummary(
    ...args: Parameters<ICordThreadSDK['observeLocationSummary']>
  ): ReturnType<ICordThreadSDK['observeLocationSummary']>;

  /**
   * @deprecated Renamed to sdk.thread.unobserveLocationSummary.
   */
  unobserveThreadSummary(
    ...args: Parameters<ICordThreadSDK['unobserveLocationSummary']>
  ): ReturnType<ICordThreadSDK['unobserveLocationSummary']>;
}

export type ThreadParticipant = {
  /**
   * The timestamp of the most recent message or reaction that this user has
   * seen in this thread. Is `null` if this participant has never viewed this
   * thread.
   */
  lastSeenTimestamp: Date | null;

  /**
   * The user ID of the participant. Can be null if the current viewer no longer
   * shares a [group](https://docs.cord.com/rest-apis/groups)
   * with this participant (and therefore can no longer access that
   * participant's information).
   */
  userID: UserID | null;

  /**
   * The display name of the participant. Can be null if the current viewer no
   * longer shares a [group](https://docs.cord.com/rest-apis/groups)
   * with this participant (and therefore can no longer access that
   * participant's information).
   */
  displayName: string | null;
};

export interface CoreThreadData {
  /**
   * The ID for this thread.
   */
  id: ThreadID;

  /**
   * The organization ID this thread is in.
   * @deprecated Use groupID instead.
   */
  organizationID: OrganizationID;

  /**
   * The group ID this thread is in.
   */
  groupID: GroupID;

  /**
   * The total number of messages in this thread. Equal to user messages + action messages.
   * Deleted messages are excluded from this count.
   */
  total: number;

  /**
   * The number of messages in this thread that were sent by users (i.e., not action messages).
   * Deleted messages are excluded from this count.
   */
  userMessages: number;

  /**
   * The number of action messages sent in this thread. An example is the message that appears
   * when a thread is resolved.
   * Deleted messages are excluded from this count.
   */
  actionMessages: number;

  /**
   * The number of deleted messages in this thread.
   */
  deletedMessages: number;

  /**
   * Whether this thread is resolved. This is equivalent to checking if
   * `resolvedTimestamp` is null.
   */
  resolved: boolean;

  /**
   * The timestamp when this thread was resolved. Set to `null` if this thread
   * is not resolved.
   */
  resolvedTimestamp: Date | null;

  /**
   * All of the users who are engaging in this thread. This includes both subscribed and unsubscribed users.
   */
  participants: ThreadParticipant[];

  /**
   * All of the users who are subscribed to this thread.
   */
  subscribers: UserID[];

  /**
   * All of the users who have replied to this thread.
   */
  repliers: UserID[];

  /**
   * All of the users who were mentioned in a message in this thread.
   */
  mentioned: UserID[];

  /**
   * Authors of any message of type `action_message` in this thread's replies, including
   * automatically generated messages from resolving or unresolving the thread.
   */
  actionMessageRepliers: UserID[];

  /**
   * The users that are currently typing in this thread.  Typing status is
   * transient in nature, so the value is the set of users typing at a
   * particular instant, but may change rapidly.  In the context of a specific
   * user (such as the JS API), it will exclude that user from the list.
   */
  typing: UserID[];

  /**
   * The name of the thread.  This is shown to users when the thread is
   * referenced, such as in notifications.  This should generally be something
   * like the page title.
   */
  name: string;

  /**
   * A URL where the thread can be seen.  This determines where a user is sent
   * when they click on a reference to this thread, such as in a notification,
   * or if they click on a reference to a message in the thread and the message
   * doesn't have its own URL.
   */
  url: string;

  /**
   * The [location](https://docs.cord.com/reference/location) of this thread.
   */
  location: Location;

  /**
   * Arbitrary key-value pairs that can be used to store additional information.
   */
  metadata: EntityMetadata;

  /**
   * An optional space separated list of classnames to add to the thread.
   */
  extraClassnames: string | null;
}

export interface ServerListThreads {
  /**
   * Page containing threads.
   */
  threads: CoreThreadData[];
  /**
   * Data related to cursor-based pagination.
   */
  pagination: PaginationDetails;
}

/**
 * A summary of a single thread.
 */
export interface ThreadSummary extends CoreThreadData {
  /**
   * The number of messages that the current user hasn't seen yet. This count
   * excludes deleted messages.
   */
  unread: number;
  /**
   * Whether the current viewer has either left a message or reacted to this thread.
   */
  viewerIsThreadParticipant: boolean;
  /**
   * Contains information about the first (i.e., oldest) message in the thread.
   * `null` if the thread is empty.
   */
  firstMessage: ClientMessageData | null;
  /**
   * Contains information about the last (i.e., newest) message in the thread.
   * `null` if the thread is empty.
   */
  lastMessage: ClientMessageData | null;
}

export type ThreadSummaryUpdateCallback = (summary: ThreadSummary) => unknown;

/**
 * Options for the `observeThreadSummary` and `observeThreadData` functions in
 * the Thread API.
 */
export interface ThreadObserverOptions {
  /**
   * @deprecated This option has no effect
   */
  threadName?: string;
  /**
   * @deprecated This option has no effect
   */
  location?: Location;
  /**
   * @deprecated Use `filter.groupID` instead
   */
  groupID?: string;

  /**
   * An object that can be used to filter the thread returned. In most cases,
   * you won't need to use this -- fetching a single thread but then filtering
   * it out isn't useful in most cases. However, it can be useful to make sure
   * the result of this function matches the filter of another Cord component
   * or hook.
   */
  filter?: ClientThreadFilter;

  /**
   * The number of messages to initially fetch. Once these are returned you can
   * use the `fetchMore` property to get additional messages.
   *
   * If not specified, the number of initial messages will be determined
   * dynamically based on the state of the thread and which messages the user
   * has read.
   */
  initialFetchCount?: number;
}

export type ObserveThreadSummaryOptions = ThreadObserverOptions;
export type ObserveThreadDataOptions = ThreadObserverOptions;

export type ThreadListFilter = {
  /**
   * The value for a `metadata` entry should be an object representing the
   * metadata key/value to filter on.  For example, to show only threads
   * with the metadata key of `"category"` set to `"sales"`, set the filter
   * to `{ metadata: { category: "sales" } }`.
   */
  metadata?: EntityMetadata;
  /**
   * The [Location](https://docs.cord.com/reference/location) of the threads.
   */
  location?: Location;
  /**
   * Filter to threads belonging to a specified [group](/rest-apis/groups).
   */
  groupID?: string;
  /**
   * If set to `resolved`, only resolved threads will be returned. If set to `unresolved`,
   * only unresolved threads will be returned. If set to `any`, both resolved and
   * unresolved threads will be returned.
   *
   * If unset, defaults to `unresolved`.
   */
  resolvedStatus?: ResolvedStatus;
  /**
   * The status of the viewer in this thread.  If multiple statuses are
   * supplied, a thread will match the filter if the viewer has any of those
   * statuses.
   */
  viewer?: ViewerThreadStatus | ViewerThreadStatus[];
};

export interface ClientThreadFilter
  extends Omit<ThreadListFilter, 'location' | 'resolvedStatus'> {
  /**
   * The [Location](https://docs.cord.com/reference/location) of the threads.
   * This can either be just the location value or an object with a value for
   * both the location and partialMatch properties.
   *
   * The value for partialMatch will default to false if only location is provided.
   */
  location?: Location | LocationFilterOptions;
  /**
   * If set to `resolved`, only resolved threads will be returned. If set to `unresolved`,
   * only unresolved threads will be returned. If set to `any`, both resolved and
   * unresolved threads will be returned.
   *
   * If unset, defaults to `any`.
   */
  resolvedStatus?: ResolvedStatus;
}

export type SortDirection = 'ascending' | 'descending';
export type SortBy =
  | 'first_message_timestamp'
  | 'most_recent_message_timestamp';
export type ThreadSortOptions = {
  /**
   * This option controls the criteria for how threads are sorted.
   * Combined with `sortDirection`, it determines which threads are
   * "first".
   *
   * It's a string enum which can have one of the following values:
   *
   * * `first_message_timestamp`: sort threads by the
   *   timestamp of the first message in the thread. In other
   *    words, threads will be sorted based on how recently they
   *    were created.
   *
   * * `most_recent_message_timestamp`: sort threads
   *    by the timestamp of the most recent message in the thread.
   *    In other words, threads will be sorted based on how
   *    recently they were responded to.
   *
   * If unset, defaults to `first_message_timestamp`.
   */
  sortBy?: SortBy;
  /**
   * This option controls the direction that `sortBy`
   * sorts. Combined with `sortBy`, it determines
   * which threads are "first".
   *
   * It's a string enum which can have one of the following
   * values:
   *
   * * `ascending`: sort older threads in front of newer threads.
   *
   * * `descending`: sort newer threads in front of older threads.
   *
   * If unset, defaults to `descending` (since people usually care
   * about the most recent things).
   */
  sortDirection?: SortDirection;
};

export type ObserveLocationDataOptions = ThreadSortOptions & {
  /**
   * If `false`, resolved threads are filtered out of the results. If `true`,
   * all threads are returned.
   *
   * If unset, defaults to `false`.
   *
   * @deprecated Please use the resolvedStatus instead
   */
  includeResolved?: boolean;
  /**
   * If `true`, perform [partial matching](https://docs.cord.com/reference/location#Partial-Matching)
   * on the specified location. If `false`, fetch information for only exactly the
   * location specified.
   *
   * If unset, defaults to `false`.
   */
  partialMatch?: boolean;
  /**
   * An object that can be used to filter the threads returned.
   */
  filter?: ThreadListFilter;
};

export type ObserveThreadsOptions = ThreadSortOptions & {
  /**
   * An object that can be used to filter the threads returned.
   */
  filter?: ClientThreadFilter;
  /**
   * The number of threads to initially fetch. Once these are returned you can
   * use the `fetchMore` property to get additional threads.
   *
   * The default for this is 10, and has a limit of 1000.
   */
  initialFetchCount?: number;
};

export type LocationData = PaginationParams & {
  /**
   * An array of [thread summary](/js-apis-and-hooks/thread-api/observeThreadSummary#Available-Data)
   * objects. There will be one of each thread at the specified
   * [location](/reference/location).
   *
   * This array is paginated. At first, it will contain summaries of only the first
   * few threads. Calling `fetchMore` will cause further thread summaries to be
   * appended to the array.
   *
   * The order in which you will receive the threads is determined by the sorting
   * options.
   */
  threads: ThreadSummary[];
};
export type LocationDataCallback = (data: LocationData) => unknown;

export type ThreadsData = PaginationParams & {
  /**
   * An array of objects containing the threads that match the request.
   *
   * This array is paginated. At first, it will contain only the first
   * few threads. Calling `fetchMore` will cause further threads to be
   * appended to the array.
   *
   * The order in which you will receive the threads is determined by the sorting
   * options.
   */
  threads: ThreadSummary[];

  /**
   * An object providing counts of threads. Refer to [observeThreadCount API](https://docs.cord.com/js-apis-and-hooks/thread-api/observeThreadCounts#Available-Data)
   * for more information about the properties returned.
   */
  counts?: ThreadActivitySummary;
};
export type ThreadsCallback = (data: ThreadsData) => unknown;

export interface ClientUpdateThread
  extends Partial<
    Pick<
      CoreThreadData,
      'name' | 'url' | 'metadata' | 'resolved' | 'extraClassnames'
    >
  > {
  /**
   * Whether the thread is resolved.  Setting this to `true` is equivalent to
   * setting `resolvedTimestamp` to the current time, and setting this to
   * `false` is equivalent to setting `resolvedTimestamp` to `null`.
   */
  resolved?: boolean;
  /**
   * Whether to mark the current user as typing in the thread. The typing
   * indicator expires after 3 seconds, so to continually show the indicator
   * it needs to be called on an interval.  Passing `false` is a no-op and
   * the indicator will time out normally.
   */
  typing?: boolean;
}

export interface ClientCreateThread
  extends Pick<CoreThreadData, 'location' | 'url' | 'name'>,
    Partial<
      Omit<
        CoreThreadData,
        // Required fields
        | 'location'
        | 'url'
        | 'name'
        // Non-create fields
        | 'organizationID'
        | 'total'
        | 'userMessages'
        | 'actionMessages'
        | 'deletedMessages'
        | 'resolved'
        | 'resolvedTimestamp'
        | 'participants'
        | 'mentioned'
        | 'repliers'
        | 'actionMessageRepliers'
        | 'typing'
        | 'subscribers'
      >
    > {
  /**
   * A list of subscribers to add to this thread.
   */
  addSubscribers?: UserID[];
}

export type CreateFileAttachment = {
  /**
   * The type of attachment.  This is `file` for file attachments.
   */
  type: 'file';
  /**
   * The ID of the file to attach.  This must have been previously uploaded via
   * the [file API](https://docs.cord.com/js-apis-and-hooks/file-api/uploadFile).
   */
  id: string;
};

export type CreateAttachment = CreateFileAttachment;

export type RemoveFileAttachment = {
  /**
   * The type of attachment to remove.  This is `file` for file attachments.
   */
  type: 'file';
  /**
   * The ID of the file attachment to remove.
   */
  id: string;
};

export type RemoveLinkPreviewAttachment = {
  /**
   * The type of attachment to remove.  This is `link_preview` for link preview attachments.
   */
  type: 'link_preview';
  /**
   * The ID of the link preview attachment to remove.
   */
  id: string;
};

export type RemoveAttachment =
  | RemoveLinkPreviewAttachment
  | RemoveFileAttachment;

export interface ClientCreateMessage
  // Pick the required properties
  extends Pick<CoreMessageData, 'content'>,
    // Then a partial version of the rest of the properties
    Partial<
      Omit<
        CoreMessageData,
        // Required fields
        | 'content'
        // Fields that are readonly
        | 'plaintext'
        | 'reactions'
        | 'attachments'
        | 'seenBy'
        // Fields that can't be set in the client API
        | 'authorID'
        | 'organizationID'
        | 'groupID'
        | 'threadID'
        | 'createdTimestamp'
        | 'updatedTimestamp'
        | 'deletedTimestamp'
        | 'type'
      >
    > {
  /**
   * The parameters for creating a thread if the supplied thread doesn't exist
   * yet.  If the thread doesn't exist but `createThread` isn't provided, the
   * call will generate an error.  This value is ignored if the thread already
   * exists.
   */
  createThread?: Omit<ClientCreateThread, 'id'>;
  /**
   * Whether to subscribe the sender of the message to the thread, so that they
   * get notified about replies.  If not specified, defaults to `true`.  If
   * false, the user's subscription status will be left unchanged.
   */
  subscribeToThread?: boolean;
  /**
   * A list of unicode strings representing the reactions you want to add to this message.
   * Trying to create a reaction that already exists for a user does nothing.
   */
  addReactions?: string[];
  /**
   * A list of attachments to add to the message.  The same file cannot be
   * attached to the same message multiple times.
   */
  addAttachments?: CreateAttachment[];
  /**
   * Whether to capture and attach a screenshot to the message.  The screenshot
   * will appear as a `MessageScreenshotAttachment` in the message's
   * [`attachments`](https://docs.cord.com/js-apis-and-hooks/thread-api/observeMessage#attachments)
   * and may be used in other situations, such as to provide context to
   * notification emails.
   *
   * Whether the sent message includes a screenshot is determined entirely by
   * this property, and is independent of the `capture_when` setting in the [SDK
   * initialization
   * settings](https://docs.cord.com/js-apis-and-hooks/initialization).
   *
   * Taking a screenshot is a potentially-slow process, depending on the
   * contents of the page, so it's done asynchronously in the background after
   * the message is sent.  If the user closes the page or navigates away after
   * the message has been sent but before the screenshot is uploaded, the
   * screenshot data may be lost.  In this case, the screenshot attachment will
   * end up with a status of `cancelled`.
   */
  addScreenshot?: boolean;
}

export interface ClientUpdateMessage
  extends Partial<
    Omit<
      ClientCreateMessage,
      'id' | 'createThread' | 'subscribeToThread' | 'addScreenshot'
    >
  > {
  /**
   * Whether to change the deleted status of this message.
   */
  deleted?: boolean;
  /**
   * A list of unicode strings representing the reactions you want to remove from this message.
   * Removing a reaction that does not exist will have no effect and will not return an error.
   * An error is returned if a reaction is both added and deleted in the same request.
   */
  removeReactions?: string[];
  /**
   * The attachments you want to remove from this message.  Removing an
   * attachment that doesn't exist has no effect and won't return an error.
   * Attempting to add and remove the same attachment in one request is an
   * error.
   */
  removeAttachments?: RemoveAttachment[];
}

export type ShareThreadViaEmail = {
  /**
   * Sharing a thread via email will include the first and last message of the thread,
   * and a screenshot of the page.
   */
  method: 'email';
  /**
   * Email address the thread will be shared to.
   */
  email: string;
};

export type ShareThreadToSlack = {
  /**
   * When you share a thread on Slack, it copies the thread to the chosen Slack channel.
   * This includes any new messages added to the thread on Slack or Cord.
   * To share a thread on Slack, the group needs to be linked to a Slack Workspace
   * and can be connected using the [connectToSlack](https://docs.cord.com/js-apis-and-hooks/user-api/connectToSlack) method.
   * Also, when you share a thread to a Slack channel, a Cord Slack bot is added automatically to that channel.
   */
  method: 'slack';
  /**
   * The slack channel ID the thread will be shared to.
   */
  channelID: string;
};

/**
 * Options to share a thread.
 */
export type ShareThreadOptions = ShareThreadViaEmail | ShareThreadToSlack;

export interface ICordThreadSDK {
  /**
   * This method allows you to observe summary information about a
   * [location](https://docs.cord.com/reference/location), including live
   * updates.
   *
   * @deprecated This method has been deprecated in favor of `observeThreadCounts`.
   * It returns identical data as observeLocationSummary and offers more
   * flexibility with additional filter parameters.
   *
   * @example Overview
   * ```javascript
   * const ref = window.CordSDK.thread.observeLocationSummary(
   *   {page: 'document_details'},
   *   (summary) => {
   *      // Received an update!
   *      console.log("Total threads", summary.total);
   *      console.log("Unread threads", summary.unread);
   *      console.log("Unread subscribed threads", summary.unreadSubscribed);
   *      console.log("Resolved threads", summary.resolved);
   *   },
   *   {partialMatch: true}
   * );
   * // ... Later, when updates are no longer needed ...
   * window.CordSDK.thread.unobserveLocationSummary(ref);
   * ```
   * @param location - The [location](https://docs.cord.com/reference/location)
   * to fetch summary information for.
   * @param callback - This callback will be called once with the current
   * location summary, and then again every time the data changes. The argument
   * passed to the callback is an object which will contain the fields described
   * under "Available Data" above.
   * @param options - Options that control which threads are returned.
   * @returns A reference number which can be passed to
   * `unobserveLocationSummary` to stop observing location summary information.
   */
  observeLocationSummary(
    location: Location,
    callback: ThreadActivitySummaryUpdateCallback,
    options?: ObserveThreadActivitySummaryOptions,
  ): ListenerRef;
  unobserveLocationSummary(ref: ListenerRef): boolean;

  /**
   * This API allows you to observe the count of all the threads in a project
   * that are visible to the current user.
   *
   * @example Overview
   * ```javascript
   * const ref = window.CordSDK.thread.observeThreadCounts(
   *   (threadCounts) => {
   *      // Received an update!
   *      console.log("Total threads", threadCounts.total);
   *      console.log("Unread threads", threadCounts.unread);
   *      console.log("Unread subscribed threads", threadCounts.unreadSubscribed);
   *      console.log("Resolved threads", threadCounts.resolved);
   *   },
   *    { filter: {
   *        location: {
   *              'value': { 'page': 'document_details'},
   *              'partialMatch': true
   *             },
   *        metadata: {'category': 'sales'}
   *    }}
   * );
   * // ... Later, when updates are no longer needed ...
   * window.CordSDK.thread.unobserveThreadCounts(ref);
   * ```
   *
   * @param callback - This callback will be called once with the current observeThreadCounts
   * data, and then again every time the data changes. The
   * argument passed to the callback is an object which will
   * contain the fields described under "Available Data" above.
   * @param options - Options that control the thread counts returned.
   * @returns A reference which can be passed to `unobserveThreadCounts`
   * to stop observing thread counts.
   */
  observeThreadCounts(
    callback: ThreadActivitySummaryUpdateCallback,
    options?: ObserveThreadCountsOptions,
  ): ListenerRef;
  unobserveThreadCounts(ref: ListenerRef): boolean;

  /**
   * This method allows you to observe detailed data about a
   * [location](https://docs.cord.com/reference/location), including live
   * updates.
   *
   * @deprecated This method has been deprecated in favor of `observeThreads`
   * which provides all functionalities of `observeLocationData` and offers
   * more flexibility with extra filter parameters.
   *
   * @example Overview
   * ```javascript
   * const ref = window.CordSDK.thread.observeLocationData(
   *   { page: 'document_details' },
   *   ({ threads, loading, hasMore, fetchMore }) => {
   *     console.log('Got a thread data update:');
   *     if (loading) {
   *       console.log('Loading...');
   *     }
   *     threads.forEach((threadSummary) =>
   *       console.log(\`Thread \${threadSummary.id} has \${threadSummary.total} messages!\`),
   *     );
   *     if (!loading && hasMore && threads.length < 25) {
   *       // Get the first 25 threads, 10 at a time.
   *       fetchMore(10);
   *     }
   *   },
   * );
   * // ... Later, when updates are no longer needed ...
   * window.CordSDK.thread.unobserveLocationData(ref);
   * ```
   * @param location - The [location](https://docs.cord.com/reference/location)
   * to fetch data for.
   * @param callback - This callback will be called once with the current location
   * data, and then again every time the data changes. The
   * argument passed to the callback is an object which will
   * contain the fields described under "Available Data" above.
   * @param options - Miscellaneous options. See below.
   * @returns A reference number which can be passed to
   * `unobserveLocationData` to stop observing location data.
   */
  observeLocationData(
    location: Location,
    callback: LocationDataCallback,
    options?: ObserveLocationDataOptions,
  ): ListenerRef;
  unobserveLocationData(ref: ListenerRef): boolean;

  /**
   * This API allows you to observe threads data within your project, that are
   * visible to the current user, including live updates. You can use the available
   * filter options to fine tune the threads returned.
   *
   * @example Overview
   * ```javascript
   * const ref = window.CordSDK.thread.observeThreads(
   *   ({ threads, loading, hasMore, fetchMore, counts }) => {
   *     console.log('Got a thread data update:');
   *     if (loading) {
   *       console.log('Loading...');
   *     }
   *      if (counts){
   *       console.log(`Total threads: ${counts.total} and unread threads: ${counts.unread}`)
   *      }
   *     threads.forEach((thread) =>
   *       console.log(`Thread ${thread.id} has ${thread.total} messages!`)
   *     );
   *     if (!loading && hasMore && threads.length < 25) {
   *       // Get the first 25 threads, 10 at a time.
   *       fetchMore(10);
   *     }
   *   },
   *   { filter: {
   *        location: {
   *              'value': { 'page': 'document_details'},
   *              'partialMatch': true
   *             },
   *        metadata: {'category': 'sales'}
   *    }}
   * );
   * // ... Later, when updates are no longer needed ...
   * window.CordSDK.thread.unobserveThreads(ref);
   * ```
   * @param callback - This callback will be called once with the options
   * data, and then again every time the data changes. The
   * argument passed to the callback is an object which will
   * contain the fields described under "Available Data" above.
   * @param options - Options that control which threads are returned.
   * @returns A reference which can be passed to `unobserveThreads`
   * to stop observing threads data.
   */
  observeThreads(
    callback: ThreadsCallback,
    options?: ObserveThreadsOptions,
  ): ListenerRef;
  unobserveThreads(ref: ListenerRef): boolean;

  /**
   * This method allows you to observe summary information about a thread, such
   * as its location and number of unread messages, including live updates.
   * @deprecated In favor of `observeThread` which returns both thread messages and thread summary data.
   * @example Overview
   * ```javascript
   * const ref = window.CordSDK.thread.observeThreadSummary(
   *   'my-awesome-thread-id',
   *   (summary) => {
   *     // Received an update!
   *     console.log("Total messages", summary.total);
   *     console.log("Unread messages", summary.unread);
   *   },
   * );
   * // ... Later, when updates are no longer needed ...
   * window.CordSDK.thread.unobserveThreadSummary(ref);
   * ```
   * @param threadId - The thread ID to fetch summary information for. If a
   * thread with this ID does not exist, it will be created.
   * @param callback - This callback will be called once with the current thread
   * summary, and then again every time the data changes. The argument passed to
   * the callback is an object which will contain the fields described under
   * "Available Data" above.
   * @param options - Options for creating new threads.
   * @returns A reference which can be passed to `unobserveThreadSummary` to
   * stop observing thread summary information.
   */
  observeThreadSummary(
    threadId: ThreadID,
    callback: ThreadSummaryUpdateCallback,
    options?: ObserveThreadSummaryOptions,
  ): ListenerRef;
  unobserveThreadSummary(ref: ListenerRef): boolean;

  /**
   * This method allows you to observe detailed data about a thread, including
   * data about all the messages inside it, including live updates.
   * @deprecated In favor of `observeThread` which returns both thread messages and thread summary data.
   * @example Overview
   * ```javascript
   * const ref = window.CordSDK.thread.observeThreadData(
   *   'my-awesome-thread-id',
   *   ({ messages, loading, hasMore, fetchMore }) => {
   *     console.log('Got a thread data update:');
   *     if (loading) {
   *       console.log('Loading...');
   *     }
   *     messages.forEach((messageSummary) =>
   *       console.log(`Message ${messageSummary.id} was created at ${messageSummary.createdTimestamp}!`),
   *     );
   *     if (!loading && hasMore && messages.length < 25) {
   *       // Get the first 25 threads, 10 at a time.
   *       fetchMore(10);
   *     }
   *   },
   * );
   * // ... Later, when updates are no longer needed ...
   * window.CordSDK.thread.unobserveThreadData(ref);
   * ```
   *
   * @param threadId - The thread ID to fetch data for.
   * @param callback - This callback will be called once with the current thread
   * data, and then again every time it changes. The argument passed to the
   * callback is an object which will contain the fields described under
   * "Available Data" above.
   * @param options - Options for creating new threads.
   * @returns A reference number which can be passed to `unobserveThreadData` to
   * stop observing thread data.
   */
  observeThreadData(
    threadId: ThreadID,
    callback: ThreadDataCallback,
    options?: ObserveThreadDataOptions,
  ): ListenerRef;
  unobserveThreadData(ref: ListenerRef): boolean;

  /**
   * This method allows you to observe all messages and data for a thread, including live updates.
   * @example Overview
   * ```javascript
   * const ref = window.CordSDK.thread.observeThread(
   *   'my-awesome-thread-id',
   *   ({ messages, loading, hasMore, fetchMore, thread }) => {
   *     console.log('Got a thread data update:');
   *     if (loading) {
   *       console.log('Loading...');
   *     }
   *     if (thread) {
   *       console.log(`${thread.unread}/${thread.total} unread`)
   *     }
   *     messages.forEach((messageSummary) =>
   *       console.log(`Message ${messageSummary.id} was created at ${messageSummary.createdTimestamp}!`),
   *     );
   *     if (!loading && hasMore && messages.length < 25) {
   *       // Get the first 25 threads, 10 at a time.
   *       fetchMore(10);
   *     }
   *   },
   * );
   * // ... Later, when updates are no longer needed ...
   * window.CordSDK.thread.unobserveThread(ref);
   * ```
   * @param threadID - The thread ID to fetch messages from.
   * @param callback - This callback will be called once with the current thread
   * data, and then again every time it changes. The argument passed to the
   * callback is an object which will contain the fields described under
   * "Available Data" above.
   * @param options - Options for creating new threads.
   * @returns A reference number which can be passed to `unobserveThread` to
   * stop observing thread.
   */
  observeThread(
    threadID: ThreadID,
    callback: ThreadCallback,
    options?: ThreadObserverOptions,
  ): ListenerRef;
  unobserveThread(ref: ListenerRef): boolean;

  /**
   * This method allows you fetch data for a single message, including live updates.
   * @example Overview
   * ```javascript
  
   * const ref = window.CordSDK.thread.observeMessage(
   *   'my-awesome-message-id',
   *   (message) => {
   *     console.log('Got a thread data update:');
   *     if (message === undefined) {
   *       console.log('Loading...');
   *     }
   *     if (message) {
   *       console.log(`Message /${message.id} was authored by: /${message.authorID}`)
   *     }
   *   }
   * );
   * // ... Later, when updates are no longer needed ...
   * window.CordSDK.thread.unobserveMessage(ref);
   * 
   * ```
   * @param messageID - The ID of the message.
   * @param callback - This callback will be called once with the current message
   * data, and then again every time it changes. The argument passed to the
   * callback is an object containing the message data or null if there's no
   * message found with the provided messageID.
   * @returns A reference number which can be passed to `unobserveMessage` to
   * stop observing message information.
   */
  observeMessage(messageID: MessageID, callback: MessageCallback): ListenerRef;
  unobserveMessage(ref: ListenerRef): boolean;

  /**
   * Set the subscribed status for an existing thread for the current user. A
   * subscribed user will be notified of any new thread activity.
   * @example Overview
   * ```
   * await window.CordSDK.thread.setSubscribed('my-awesome-thread-id', false);
   * ```
   * @param threadID - The ID of the thread.
   *
   * @param subscribed - Whether the user should be subscribed to the thread.
   * @returns A promise that resolves to `true` if the operation succeeded or
   * rejects if it failed.
   */
  setSubscribed(threadID: ThreadID, subscribed: boolean): Promise<true>;

  /**
   * Mark entire threads as seen or unseen for the current user.  This does not
   * affect whether the user is subscribed to the thread or not.
   * @example Overview
   * ```
   * // To mark a thread as unseen
   * await window.CordSDK.thread.setSeen('my-awesome-thread-id', false);
   *
   * // To mark a thread as seen
   * await window.CordSDK.thread.setSeen('my-awesome-thread-id', true);
   * ```
   * @param threadID - The ID of the thread to operate on.
   * @param seen - Whether the thread should now be seen (true) or unseen
   * (false).
   * @returns A promise that resolves to `true` if the operation succeeded or
   * rejects if it failed.
   */
  setSeen(threadID: ThreadID, seen: boolean): Promise<true>;

  /**
   * Mark entire threads as seen or unseen for the current user.  This does not
   * affect whether the user is subscribed to the thread or not.
   * @example Overview
   * ```
   * // To mark threads as unseen
   * await window.CordSDK.thread.setSeen({ metadata: {archived: true} }, false);
   *
   * // To mark threads as seen
   * await window.CordSDK.thread.setSeen({ metadata: {archived: true} }, true);
   * ```
   * @param filter - The set of threads to operate on.
   * @param seen - Whether the threads should now be seen (true) or unseen
   * (false).
   * @returns A promise that resolves to `true` if the operation succeeded or
   * rejects if it failed.
   */
  setSeen(filter: ClientThreadFilter, seen: boolean): Promise<true>;

  /**
   * Create a new empty thread i.e. a thread without messages.
   * Please note that because the new thread won't have any messages, it will not be displayed
   * on any of the thread-related components like [ThreadedComments](https://docs.cord.com/components/cord-threaded-comments),
   * [ThreadList](https://docs.cord.com/components/cord-thread-list) or [Thread](https://docs.cord.com/components/cord-thread).
   * If you would like to create a thread containing a message instead, please use
   * the [SendMessage API](https://docs.cord.com/js-apis-and-hooks/thread-api/sendMessage) and
   * pass in thread data via the `createThread` argument.
   *
   * @example Overview
   * ```javascript
   * await window.CordSDK.thread.createThread({
   *   id: 'my-awesome-thread-id',
   *   name: 'A more awesome name',
   *   location: {'page': 'sales'},
   *   url: "https://my-awesome-url.com",
   * });
   * ```
   *
   * @param data - The data values the new thread should have.
   * @returns A promise that resolves to `true` if the operation succeeded or
   * rejects if it failed.
   */
  createThread(data: ClientCreateThread): Promise<true>;

  /**
   * Update an existing thread with new data.
   * @example Overview
   * ```javascript
   * await window.CordSDK.thread.updateThread('my-awesome-thread-id', {
   *   name: 'A more awesome name',
   *   resolved: true,
   * });
   * ```
   * @param threadID - The ID of the thread to update.
   * @param data - The data values that should be updated.
   * @returns A promise that resolves to `true` if the operation succeeded or
   * rejects if it failed.
   */
  updateThread(threadID: ThreadID, data: ClientUpdateThread): Promise<true>;

  /**
   * Shares the most recent message, including a link to the thread, via email.
   * @example Overview
   * ```javascript
   * await window.CordSDK.thread.shareThread('my-awesome-thread-id', {
   *   method: 'email',
   *   email: 'example@email.com',
   * });
   * ```
   * @param threadID - The ID of the thread to share.
   * @param options - Options to configure how to share a thread.
   *
   * @returns A promise that resolves to `true` if the operation succeeded or
   * rejects if it failed.
   */
  shareThread(threadID: ThreadID, options: ShareThreadOptions): Promise<true>;

  /**
   * Add a new message to a thread.  The message will be authored by the current
   * user and belong to their current group.
   * @example Overview
   * ```javascript
   * await window.CordSDK.thread.sendMessage(
   *   'my-awesome-thread-id',
   *   {
   *     content: [{ type: 'p', children: [{ text: 'Amazing job!' }]}],
   *   }
   * );
   * ```
   * @param threadID - The ID of the thread to add the message to.  If this
   * thread does not yet exist, the `createThread` parameter determines what
   * happens.
   * @param data - The data values for the new message.
   * @returns A promise that resolves to `true` if the operation succeeded or
   * rejects if it failed.
   */
  sendMessage(threadID: ThreadID, data: ClientCreateMessage): Promise<true>;

  /**
   * Update the content or properties of an existing message.  This can only be
   * used to modify messages created by the current viewer.
   * @example Overview
   * ```javascript
   * await window.CordSDK.thread.updateMessage(
   *   'my-awesome-thread-id',
   *   'message-42',
   *   {
   *     content: [{ type: 'p', children: [{ text: 'An updated message content' }]}],
   *   }
   * );
   * ```
   * @deprecated The argument 'threadID' in this function has been deprecated in
   * favor of using just the 'messageID' and 'data'.
   * @param threadID - The ID of the thread containing the message.
   * @param messageID - The ID of the message to update.
   * @param data - The data values to update.  Any omitted values will be left
   * at their current values.
   * @returns A promise that resolves to `true` if the operation succeeded or
   * rejects if it failed.
   */
  updateMessage(
    threadID: ThreadID,
    messageID: MessageID,
    data: ClientUpdateMessage,
  ): Promise<true>;

  /**
   * Update the content or properties of an existing message.  This can only be
   * used to modify messages created by the current viewer.
   * @example Overview
   * ```javascript
   * await window.CordSDK.thread.updateMessage(
   *   'message-42',
   *   {
   *     content: [{ type: 'p', children: [{ text: 'An updated message content' }]}],
   *   }
   * );
   * ```
   * @param messageID - The ID of the message to update.
   * @param data - The data values to update.  Any omitted values will be left
   * at their current values.
   * @returns A promise that resolves to `true` if the operation succeeded or
   * rejects if it failed.
   */
  updateMessage(messageID: MessageID, data: ClientUpdateMessage): Promise<true>;

  /**
   * This method allows you search for messages by content.
   * @example Overview
   * ```javascript
   * await window.CordSDK.thread.searchMessages({textToMatch: 'hello'});
   * ```
   * @param searchOptions - Various options for how to search the messages.  Each
   * option is optional, but if you supply no options the result will be an empty
   * array.
   * @returns An array containing message objects including thread location.
   */
  searchMessages(
    searchOptions: SearchOptionsType,
  ): Promise<SearchResultData[] | undefined>;
}

/**
 * Detailed data about a single thread.
 */
export interface ThreadData extends PaginationParams {
  /**
   * Contains information about the first (i.e., oldest) message in the thread.
   * `null` if the thread is empty.
   */
  firstMessage: ClientMessageData | null;
  /**
   * An array of objects, one for each message in the specified thread.
   *
   * This array is paginated. At first, it will contain summaries of only the
   * latest (newest) few messages. Calling `fetchMore` will cause further
   * message summaries to be appended to the array.
   */
  messages: ClientMessageData[];
}

export type ThreadDataCallback = (data: ThreadData) => unknown;

export type ClientThreadData = {
  /**
   * An array of objects, one for each message in the specified thread.
   *
   * This array is paginated. At first, it will contain only the latest (newest)
   * messages. Calling `fetchMore` will cause further messages to be appended to
   * the array.
   */
  messages: ClientMessageData[];

  /**
   * Information about the thread.
   * @deprecated
   */
  summary: ThreadSummary | undefined;

  /**
   * Information about the thread.  This will be undefined if the thread is
   * still loading and null if the thread does not exist.
   */
  thread: ThreadSummary | null | undefined;
} & PaginationParams;

export type ThreadCallback = (data: ClientThreadData) => unknown;

/**
 * https://docs.cord.com/rest-apis/threads/
 */
export type ServerUpdateThread = Partial<
  Omit<
    CoreThreadData,
    | 'total'
    | 'userMessages'
    | 'actionMessages'
    | 'deletedMessages'
    | 'participants'
    | 'typing'
    | 'resolved'
    | 'repliers'
    | 'actionMessageRepliers'
    | 'subscribers'
    | 'mentioned'
  > & {
    /**
     * Certain changes to the thread may post a message into the thread -- in
     * particular, resolving or unresolving a thread posts a message into the
     * thread saying "User un/resolved this thread". This parameter is the ID of
     * the User who will be listed as the author of that message. It's optional
     * -- if no user is specified, then those messages won't get posted.
     */
    userID: string;
    /**
     * Marks the specified users as typing in this thread.  The typing indicator
     * expires after 3 seconds, so to continually show the indicator it needs to
     * be called on an interval.  Pass an empty array to clear all users' typing indicators.
     */
    typing: string[];
    /**
     * Whether the thread is resolved.  Setting this to `true` is equivalent to
     * setting `resolvedTimestamp` to the current time, and setting this to
     * `false` is equivalent to setting `resolvedTimestamp` to `null`.
     */
    resolved?: boolean;
    /**
     * Marks the specified users as having seen/not seen this thread. If a user
     * is not included in this list, the seen status will not be changed.
     */
    seenByUsers: ServerThreadSeenUser[];
    /**
     * A list of subscribers to add to this thread.
     */
    addSubscribers?: UserID[];
    /**
     * A list of subscribers to remove from this thread.
     */
    removeSubscribers?: UserID[];
  }
>;

export interface ServerCreateThread
  extends Pick<CoreThreadData, 'location' | 'url' | 'name' | 'groupID'>,
    Partial<
      Omit<
        CoreThreadData,
        // Required fields
        | 'location'
        | 'url'
        | 'name'
        | 'groupID'
        // Non-create fields
        | 'total'
        | 'userMessages'
        | 'actionMessages'
        | 'deletedMessages'
        | 'resolved'
        | 'resolvedTimestamp'
        | 'participants'
        | 'mentioned'
        | 'repliers'
        | 'actionMessageRepliers'
        | 'typing'
        | 'subscribers'
      >
    > {
  /**
   * @deprecated This field is deprecated and has no effect.
   */
  resolved?: boolean;
  /**
   * A list of subscribers to add to this thread.
   */
  addSubscribers?: UserID[];
}

export interface ServerListThreadFilter
  extends Omit<FilterParameters, 'organizationID' | 'authorID' | 'viewer'> {}

export type ServerListThreadParameters = {
  /**
   * Threads will be matched against the filters specified.
   * This is a partial match, which means any keys other than the ones you specify are ignored
   * when checking for a match. Please note that because this is a query parameter in a REST API,
   * this JSON object must be URI encoded before being sent.
   */
  filter?: ServerListThreadFilter;
  /**
   * Number of threads to return. Defaults to 1000.
   */
  limit?: number;
  /**
   * Pagination token. This is returned in the `pagination` object of a previous response.
   */
  token?: string;
};

/**
 * https://docs.cord.com/rest-apis/threads/
 */
export interface ServerThreadSeenUser {
  /**
   * ID of the user that has seen/not seen the thread.
   */
  userID: UserID;
  /**
   * Whether the user has seen the thread or not.
   */
  seen: boolean;
}
