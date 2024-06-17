export type UUID = string;
export type UserID = string;
/**
 * @deprecated Use GroupID instead.
 */
export type OrganizationID = string;
export type GroupID = string;
export type ThreadID = string;
export type MessageID = string;

/**
 * @minLength 1
 * @maxLength 128
 * */
export type ID = string | number;

/*
 * `FlatJsonObject` is an object where all values are simple, scalar types
 * (string, number or boolean).
 */
export type FlatJsonObject = { [key: string]: string | number | boolean };
// These objects are structurally the same, but if we use a type alias then
// TypeScript will unify them in the type checker, so separate them.
export type EntityMetadata = { [key: string]: string | number | boolean };
export type Location = { [key: string]: string | number | boolean };

// For backwards compatibility, will be removed along with the deprecated context prop
export type Context = Location;

export type LocationFilterOptions = {
  /**
   * The [Location](https://docs.cord.com/reference/location) of the threads.
   */
  value: Location;
  /**
   * If `true`, perform [partial matching](https://docs.cord.com/reference/location#Partial-Matching)
   * on the specified location. If `false`, fetch information for only exactly the
   * location specified.
   */
  partialMatch: boolean;
};

export type ViewerThreadStatus = 'subscribed' | 'mentioned';

// Fast comparison of two Locations
export function isEqualLocation(
  a: Location | undefined,
  b: Location | undefined,
) {
  // If `a` and `b` are the same object (or both are undefined) -> true
  if (a === b) {
    return true;
  }
  // If either `a` or `b` is undefined -> false
  // (If they are both undefined, we returned true above.)
  if (!a || !b) {
    return false;
  }

  // Get all keys of `a` and check that `b` has the same number of keys.
  const aKeys = Object.keys(a);
  if (aKeys.length !== Object.keys(b).length) {
    return false;
  }

  // If `b` does not have all the keys of `a` -> false
  if (!aKeys.every((aKey) => Object.prototype.hasOwnProperty.call(b, aKey))) {
    return false;
  }

  // We know that `a` and `b` have identical keys. Return whether the values are
  // identical, too.
  return aKeys.every((key) => a[key] === b[key]);
}

export type ListenerRef = number;

export type FetchMoreCallback = (howMany: number) => Promise<void>;
export interface PaginationParams {
  /**
   * When this is `true`, Cord is in the process of fetching additional data
   * from its backend. Once the fetch is complete, the additional items will be
   * appended to the result list, and `loading` will become `false`.
   *
   * Both the initial data load and a call to `fetchMore` will start a fetch and
   * cause `loading` to become `true`.
   */
  loading: boolean;

  /**
   * Call this function to fetch additional data from Cord's backend. It takes a
   * single argument, the number of additional items to fetch.
   *
   * Once called, `loading` will become `true` while the data is fetched. Once
   * the fetch is complete, the additional items will be appended to the result
   * list, and `loading` will return to `false`.
   *
   * This function returns a promise that is resolved once the fetch is complete.
   */
  fetchMore: FetchMoreCallback;

  /**
   * If this is `true`, then the list of results is incomplete, and you need to
   * call `fetchMore` to continue paginating through them. Once this becomes
   * `false`, all results are available, and calls to `fetchMore` won't do
   * anything.
   */
  hasMore: boolean;
}

export type TimestampRange = {
  /**
   * Timestamp from where to start the interval. The thread's timestamp must be
   * *newer* than (or equal to) this in order to match the filter.
   *
   * If not present, the interval will have no start date and any data will
   * include everything older than the provided `to` timestamp.
   */
  from?: Date;

  /**
   * Timestamp where to end the interval. The thread's timestamp must be *older*
   * than (or equal to) this in order to match the filter.
   *
   * If not present, the interval will have no end date and any data will
   * include everything newer than the provided `from` timestamp.
   */
  to?: Date;
};

export type ResolvedStatus = 'any' | 'resolved' | 'unresolved';

export type FilterParameters = {
  /**
   * The [Location](https://docs.cord.com/reference/location) of the threads.
   * This can either be just the location value or an object with a value for
   * both the location and partialMatch properties.
   *
   * The value for partialMatch will default to false if only location is provided.
   */
  location?: Location | LocationFilterOptions;

  /**
   * Return only objects containing these metadata keys and values. (Metadata is
   * arbitrary key-value pairs of data that you can associate with an object.)
   */
  metadata?: EntityMetadata;

  /**
   * @deprecated Use groupID instead.
   * Return only threads [belonging to this
   * organization](https://docs.cord.com/reference/permissions).
   */
  organizationID?: string;

  /**
   * Return only threads [belonging to this
   * group](https://docs.cord.com/reference/permissions).
   */
  groupID?: string;

  /**
   * Return only threads with a "first message timestamp" within this range. The
   * "first message timestamp" of a thread is the timestamp when the first
   * message in the thread was created. (This is typically when the thread was
   * created.)
   */
  firstMessageTimestamp?: TimestampRange;

  /**
   * Return only threads with a "most recent message timestamp" within this
   * range. The "most recent message timestamp" of a thread is the timestamp
   * when the most recent message in the thread was created or updated. (This is
   * typically when the thread was most recently replied to.)
   */
  mostRecentMessageTimestamp?: TimestampRange;

  /**
   * Return only threads created by this user.
   */
  authorID?: string;

  /**
   * If set to `resolved`, only resolved threads will be returned. If set to `unresolved`,
   * only unresolved threads will be returned. If set to `any`, both resolved and
   * unresolved threads will be returned.
   *
   * If unset, defaults to `any`.
   */
  resolvedStatus?: ResolvedStatus;

  /**
   * The status of the viewer in this thread.  If multiple statuses are
   * supplied, a thread will match the filter if the viewer has any of those
   * statuses.
   */
  viewer?: ViewerThreadStatus | ViewerThreadStatus[];
};
