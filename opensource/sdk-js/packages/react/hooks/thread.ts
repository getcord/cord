import type {
  ObserveThreadSummaryOptions,
  ThreadActivitySummary,
  ThreadSummary,
  ClientMessageData,
  Location,
  ObserveThreadDataOptions,
  ThreadData,
  ObserveLocationDataOptions,
  LocationData,
  ObserveThreadActivitySummaryOptions,
  SearchResultData,
  SearchOptionsType,
  ThreadObserverOptions,
  ClientThreadData,
  MessageID,
  ObserveThreadCountsOptions,
  ObserveThreadsOptions,
  ThreadsData,
} from '@cord-sdk/types';
import { useEffect, useState } from 'react';
import { useCordContext } from '../contexts/CordContext.js';
import { useMemoObject } from './useMemoObject.js';
import { NO_SELECTOR, useObserveFunction } from './util.js';
import type { SkipOption } from './util.js';

/**
 * This method allows you to observe summary information about a
 * [location](https://docs.cord.com/reference/location), including live updates.
 *
 * @deprecated This method has been deprecated in favor of `useThreadCounts`.
 * It returns identical data as useLocationSummary and offers more
 * flexibility with additional filter parameters.
 *
 * @example Overview
 * ```javascript
 * import { thread } from '@cord-sdk/react';
 * const summary = thread.useLocationSummary({page: 'document_details'}, {partialMatch: true});
 * return (
 *   <div>
 *     {!summary && "Loading..."}
 *     {summary && (
 *       <p>Total threads: {summary.total}</p>
 *       <p>Unread threads: {summary.unread}</p>
 *       <p>Unread subscribed threads: {summary.unreadSubscribed}</p>
 *       <p>Resolved threads: {summary.resolved}</p>
 *     )}
 *   </div>
 * );
 * ```
 * @param location - The [location](https://docs.cord.com/reference/location) to
 * fetch summary information for.
 * @param options - Options that control which threads are returned.
 * @returns The hook will initially return `undefined` while the data loads from
 * our API. Once it has loaded, your component will re-render and the hook will
 * return an object containing the fields described under "Available Data"
 * above. The component will automatically re-render if any of the data changes,
 * i.e., this data is always "live".
 */
export function useLocationSummary(
  location: Location,
  options?: ObserveThreadActivitySummaryOptions,
): ThreadActivitySummary | undefined {
  return useObserveFunction(
    'thread',
    'observeLocationSummary',
    location,
    options,
    undefined,
  );
}

/**
 * This API allows you to observe the count of all the threads in a project
 * that are visible to the current user.
 *
 * @example Overview
 * ```javascript
 * import { thread } from '@cord-sdk/react';
 * const threadCounts = thread.useThreadCounts(
 *     { filter: {
 *        location: {
 *              'value' {'page': 'document_details'},
 *              'partialMatch': false
 *             },
 *        metadata: {'category': 'sales'}
 *    }}
 * );
 * return (
 *   <div>
 *     {!threadCounts && "Loading..."}
 *     {threadCounts && (
 *       <p>Total threads: {threadCounts.total}</p>
 *       <p>Unread threads: {threadCounts.unread}</p>
 *       <p>Unread subscribed threads: {threadCounts.unreadSubscribed}</p>
 *       <p>Resolved threads: {threadCounts.resolved}</p>
 *     )}
 *   </div>
 * );
 * ```
 *
 * @param options - Options that control which threads are counted.
 * @returns The hook will initially return `undefined` while the data loads from
 * our API. Once it has loaded, your component will re-render and the hook will
 * return an object containing the fields described under "Available Data"
 * above. The component will automatically re-render if any of the data changes,
 * i.e., this data is always "live".
 */
export function useThreadCounts(
  options?: ObserveThreadCountsOptions,
): ThreadActivitySummary | undefined {
  return useObserveFunction(
    'thread',
    'observeThreadCounts',
    NO_SELECTOR,
    options,
    undefined,
  );
}

/**
 * This method allows you to observe summary information about a thread,
 * including live updates.
 * @deprecated In favor of `useThread` which returns both thread messages and thread summary data.
 * @example Overview
 * ```javascript
 * import { thread } from '@cord-sdk/react';
 * const summary = thread.useThreadSummary('my-awesome-thread-id');
 * return (
 *   <div>
 *     {!summary && "Loading..."}
 *     {summary && (
 *       <p>Total messages: {summary.total}</p>
 *       <p>Unread messages: {summary.unread}</p>
 *     )}
 *   </div>
 * );
 * ```
 * @param id - The thread ID to fetch summary information for. If a thread with
 * this ID does not exist, it will be created.
 * @param options - Options for creating new threads.
 * @returns The hook will initially return `undefined` while the data loads from
 * our API. Once it has loaded, your component will re-render and the hook will
 * return an object containing the fields described under "Available Data"
 * above. The component will automatically re-render if any of the data changes,
 * i.e., this data is always "live".
 */
export function useThreadSummary(
  id: string,
  options?: ObserveThreadSummaryOptions,
): ThreadSummary | null {
  return useObserveFunction(
    'thread',
    'observeThreadSummary',
    id,
    options,
    null,
  );
}

const USE_LOCATION_DATA_LOADING_VALUE = {
  threads: [],
  loading: true,
  hasMore: false,
  fetchMore: async () => {},
};

const USE_LOCATION_DATA_SKIP_VALUE = {
  threads: [],
  loading: false,
  hasMore: false,
  fetchMore: async () => {},
};

/**
 * This method allows you to observe detailed data about
 * a [location](https://docs.cord.com/reference/location),
 * including live updates.
 *
 * @deprecated This method has been deprecated in favor of `useThreads`
 * which provides all functionalities of `useLocationData` and
 * offers more flexibility with extra filter parameters.
 *
 * @example Overview
 * ```javascript
 * import { thread } from '@cord-sdk/react';
 * const { threads, loading, hasMore, fetchMore } = thread.useLocationData({
 *   page: 'document_details',
 * });
 * return (
 *   <div>
 *     {threads.map((threadSummary) => (
 *       <div key={threadSummary.id}>
 *         Thread ID {threadSummary.id} has {threadSummary.total} messages!
 *       </div>
 *     ))}
 *     {loading ? (
 *       <div>Loading...</div>
 *     ) : hasMore ? (
 *       <div onClick={() => fetchMore(10)}>Fetch 10 more</div>
 *     ) : null}
 *   </div>
 * );
 * ```
 * @param location - The [location](https://docs.cord.com/reference/location)
 * to fetch data for.
 * @param options -  Miscellaneous options.
 * @returns The hook will return an object containing the fields described under
 * "Available Data" above. The component will automatically re-render if any of
 * the data changes, i.e., this data is always "live".
 */
export function useLocationData(
  location: Location,
  options?: ObserveLocationDataOptions,
): LocationData {
  return useObserveFunction(
    'thread',
    'observeLocationData',
    location,
    options,
    USE_LOCATION_DATA_LOADING_VALUE,
    USE_LOCATION_DATA_SKIP_VALUE,
  );
}

const USE_THREADS_LOADING_VALUE = {
  threads: [],
  loading: true,
  hasMore: false,
  fetchMore: async (_n: number) => {},
  counts: undefined,
};

const USE_THREADS_SKIP_VALUE = {
  threads: [],
  loading: false,
  hasMore: false,
  fetchMore: async () => {},
  counts: undefined,
};

/**
 * This method allows you to observe threads data including live updates.
 *
 * @example Overview
 * ```javascript
 * import { thread } from '@cord-sdk/react';
 * const { threads, loading, hasMore, fetchMore, counts } = thread.useThreads({
 *   sortBy: 'first_message_timestamp',
 *   filter: {
 *     location: {
 *       value: { page: 'document_details' },
 *       partialMatch: true
 *     },
 *     metadata: { category: 'sales' },
 *   },
 * });
 *
 * return (
 *   <div>
 *      {counts &&
 *         <div>
 *           We have {counts.total} total threads and {counts.unread} unread threads.
 *         </div>
 *       }
 *     {threads.map((thread) => (
 *       <div key={thread.id}>
 *         Thread ID {thread.id} has {thread.total} messages!
 *       </div>
 *     ))}
 *     {loading ? (
 *       <div>Loading...</div>
 *     ) : hasMore ? (
 *       <div onClick={() => fetchMore(10)}>Fetch 10 more</div>
 *     ) : null}
 *   </div>
 * );
 * ```
 * @param options -  Options that control which threads are returned.
 * @returns The hook will return an object containing the fields described under
 * "Available Data" above. The component will automatically re-render if any of
 * the data changes, i.e., this data is always "live".
 */
export function useThreads(options?: ObserveThreadsOptions): ThreadsData {
  return useObserveFunction(
    'thread',
    'observeThreads',
    NO_SELECTOR,
    options,
    USE_THREADS_LOADING_VALUE,
    USE_THREADS_SKIP_VALUE,
  );
}

const USE_THREAD_DATA_LOADING_VALUE = {
  messages: [],
  firstMessage: null,
  loading: true,
  hasMore: false,
  fetchMore: async (_n: number) => {},
};

const USE_THREAD_DATA_SKIP_VALUE = {
  messages: [],
  firstMessage: null,
  loading: false,
  hasMore: false,
  fetchMore: async (_n: number) => {},
};

/**
 * This method allows you to observe summary and detailed data about a thread, including
 * live updates.
 * @deprecated In favor of `useThread` which returns both thread messages and thread summary data.
 * @example Overview
 * ```javascript
 * import { thread } from '@cord-sdk/react';
 * const { messages, loading, hasMore, fetchMore } = thread.useThreadData('my-awesome-thread-id');
 *
 * return (
 *   <div>
 *     {messages.map((messageSummary) => (
 *       <div key={messageSummary.id}>
 *         Message ID {messageSummary.id} was created at {messageSummary.createdTimestamp}!
 *       </div>
 *     ))}
 *     {loading ? (
 *       <div>Loading...</div>
 *     ) : hasMore ? (
 *       <div onClick={() => fetchMore(10)}>Fetch 10 more</div>
 *     ) : null}
 *   </div>
 * );
 * ```
 * @param threadId - The thread ID to fetch data for.
 * @param options - Options for creating new threads.
 * @returns The hook will initially return `undefined` while the data loads from
 * our API. Once it has loaded, your component will re-render and the hook will
 * return an object containing the fields described under "Available Data"
 * above. The component will automatically re-render if any of the data changes,
 * i.e., this data is always "live".
 */
export function useThreadData(
  threadId: string,
  options?: ObserveThreadDataOptions,
): ThreadData {
  return useObserveFunction(
    'thread',
    'observeThreadData',
    threadId,
    options,
    USE_THREAD_DATA_LOADING_VALUE,
    USE_THREAD_DATA_SKIP_VALUE,
  );
}

const USE_THREAD_LOADING_VALUE = {
  summary: undefined,
  thread: undefined,
  loading: true,
  hasMore: false,
  messages: [],
  fetchMore: async () => {},
};

const USE_THREAD_SKIP_VALUE = {
  summary: undefined,
  thread: undefined,
  loading: false,
  hasMore: false,
  messages: [],
  fetchMore: async () => {},
};

type ReactThreadObserverOptions = ThreadObserverOptions & SkipOption;

/**
 * This hook allows you to observe message and summary data about a thread,
 * including live updates.
 * @example Overview
 * ```javascript
 * import { thread } from '@cord-sdk/react';
 * const { messages, thread, loading, hasMore, fetchMore } = thread.useThread('my-awesome-thread-id');
 *
 * return (
 *   <div>
 *     {thread ?
 *       <p> {thread.unread} / {thread.total} unread messages </p>
 *       : null}
 *     {messages.map((messageSummary) => (
 *       <div key={messageSummary.id}>
 *         Message ID {messageSummary.id} was created at {messageSummary.createdTimestamp}!
 *       </div>
 *     ))}
 *     {loading ? (
 *       <div>Loading...</div>
 *     ) : hasMore ? (
 *       <div onClick={() => fetchMore(10)}>Fetch 10 more</div>
 *     ) : null}
 *   </div>
 * );
 * ```
 * @param threadID - The thread ID to fetch data for.
 * @param options - Options for creating new threads.
 * @returns Returns an object containing the fields described under "Available Data" above.
 * Initially, `loading` will be `true`, `thread` will be `undefined`, and `messages` an empty array
 * while the data loads from our API. Once it has loaded, your component will re-render and
 * the hook will return an object containing the full data. The component will automatically
 * re-render if any of the data changes, i.e., this data is always "live".
 */
export function useThread(
  threadID?: string,
  options?: ReactThreadObserverOptions,
): ClientThreadData {
  return useObserveFunction(
    'thread',
    'observeThread',
    threadID ?? '',
    options,
    USE_THREAD_LOADING_VALUE,
    USE_THREAD_SKIP_VALUE,
  );
}

/**
 * This method allows you search for messages by content.
 * @example Overview
 * ```javascript
 * import { thread } from '@cord-sdk/react';
 * const results = thread.useSearchMessages({textToMatch: 'hello'});
 *
 * return (
 *   <div>
 *     {results.map((result) => (
 *       <div key={result.id}>
 *         Found match in message {result.id}: {result.plaintext}
 *       </div>
 *     ))}
 *   </div>
 * );
 * ```
 * @param searchOptions - Various options for how to search the messages.  Each
 * option is optional, but if you supply no options the result will be an empty
 * array.
 * @returns The hook will initially return `undefined` while the data loads from
 * our API. Once it has loaded, your component will re-render and the hook will
 * return an array containing message objects including thread location.
 *
 * Please note that the results are limited to 50 messages by default, but you
 * can use the `limit` option to override that. To get more specific results,
 * consider using one or more of the other search options provided.
 */
export function useSearchMessages(
  searchOptions: SearchOptionsType,
): SearchResultData[] | undefined {
  const [data, setData] = useState<SearchResultData[] | undefined>(undefined);
  const {
    textToMatch,
    authorID,
    orgID,
    groupID,
    locationOptions,
    timestampRange,
    metadata,
    limit,
    sortBy,
    sortDirection,
  } = searchOptions;

  const inputsMemo = useMemoObject({
    textToMatch,
    authorID,
    locationOptions,
    orgID,
    groupID,
    timestampRange,
    metadata,
    limit,
    sortBy,
    sortDirection,
  });

  const { sdk } = useCordContext('useSearchMessages');
  const threadSDK = sdk?.thread;

  useEffect(() => {
    if (!threadSDK) {
      return;
    }

    threadSDK
      .searchMessages(inputsMemo)
      .then((result) => {
        setData(result);
      })
      .catch((e) => {
        console.error(e);
      });
  }, [threadSDK, textToMatch, authorID, inputsMemo]);

  return data;
}

/**
 * This method allows you to fetch data for a single message, including live updates.
 * @example Overview
 * ```javascript
 * import { thread } from '@cord-sdk/react';
 * const message = thread.useMessage('my-awesome-message-id');
 *
 * return message && <div>Message with id: {message.id} found!</div>;
 * ```
 * @param messageID - The ID of the message.
 * @returns The hook will initially return `undefined` while the data loads from
 * our API. Once it has loaded, your component will re-render and the hook will
 * return an an object containing the message data. If no message matching the
 * provided messageID is found, it will return `null` instead.
 *
 */
export function useMessage(
  messageID: MessageID,
): ClientMessageData | null | undefined {
  return useObserveFunction(
    'thread',
    'observeMessage',
    messageID,
    undefined,
    undefined,
  );
}
