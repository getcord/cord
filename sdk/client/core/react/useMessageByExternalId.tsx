import { useEffect, useMemo, useState } from 'react';
import {
  ThreadsContext2,
  threadFragmentToThreadData,
} from 'external/src/context/threads2/ThreadsContext2.tsx';
import type { ThreadData } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { useThreadByExternalID } from 'external/src/context/threads2/useThreadByExternalID.ts';
import type { MessageFragment } from 'external/src/graphql/operations.ts';
import {
  useMessageByExternalIDQuery,
  useMessageByExternalIDWithThreadQuery,
  useThreadEventsSubscription,
} from 'external/src/graphql/operations.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';
import { extractUsersFromThread2 } from 'external/src/context/users/util.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';

function findMessage(thread: ThreadData, messageID: string) {
  for (const message of thread.messages) {
    if (message.externalID === messageID) {
      return message;
    }
  }

  return null;
}

function useMessageFromThreadsContext({
  messageID,
  threadID,
}: {
  messageID: string | undefined;
  threadID: string | undefined;
}) {
  const { getThreadByExternalMessageID } =
    useContextThrowingIfNoProvider(ThreadsContext2);

  const threadFromMessageID = getThreadByExternalMessageID(messageID);
  const { thread: threadFromThreadID, loading: loadingFromThreadID } =
    useThreadByExternalID(threadFromMessageID ? undefined : threadID);

  const thread = threadFromMessageID ?? threadFromThreadID;

  const message = useMemo(() => {
    if (!thread) {
      return undefined;
    }
    return messageID ? findMessage(thread, messageID) : thread?.messages[0];
  }, [messageID, thread]);

  return {
    thread,
    message,
    loading: loadingFromThreadID,
  };
}

function useMessageFromQuery({
  messageID,
  thread,
  skip,
}: {
  messageID: string | undefined;
  thread: ThreadData | undefined;
  skip: boolean;
}) {
  const { organization } = useContextThrowingIfNoProvider(OrganizationContext);
  const { mergeThread } = useContextThrowingIfNoProvider(ThreadsContext2);
  const {
    addUsers,
    byInternalID: { requestUsers },
  } = useContextThrowingIfNoProvider(UsersContext);

  // There are two variations of MessageByExternalIDQuery -- one which fetches
  // the full ThreadFragment, and one which doesn't fetch any thread data at
  // all. If we don't have the thread yet, use the former; if we do have the
  // thread, use the latter. In other words, if you look at the `skip` of the
  // next two queries, no more than one of them will run.

  const { data: queryData, loading: queryLoading } =
    useMessageByExternalIDQuery({
      skip: skip || !messageID || !thread,
      variables: {
        id: messageID!,
        _externalOrgID: organization?.externalID ?? null,
      },
    });

  const { data: queryDataWithThread, loading: queryLoadingWithThread } =
    useMessageByExternalIDWithThreadQuery({
      skip: skip || !messageID || !!thread,
      variables: {
        id: messageID!,
        _externalOrgID: organization?.externalID ?? null,
      },
    });
  const threadFromQuery = queryDataWithThread?.messageByExternalID?.thread;

  useEffect(() => {
    if (threadFromQuery) {
      extractUsersFromThread2(threadFromQuery, addUsers, requestUsers);
      mergeThread(threadFragmentToThreadData(threadFromQuery));
    }
  }, [addUsers, mergeThread, threadFromQuery, requestUsers]);

  return {
    thread: threadFromQuery && threadFragmentToThreadData(threadFromQuery),
    message:
      queryData?.messageByExternalID ??
      queryDataWithThread?.messageByExternalID,
    loading: queryLoading || queryLoadingWithThread,
  };
}

function useMessageFromSubscription({
  messageID,
  threadID,
  skip,
}: {
  messageID: string | undefined;
  threadID: string | undefined;
  skip: boolean;
}) {
  const [subscriptionMessage, setSubscriptionMessage] =
    useState<MessageFragment | null>(null);
  const { data: subscriptionData } = useThreadEventsSubscription({
    skip: skip || !messageID || !threadID,
    variables: {
      threadID: threadID!,
    },
  });

  useEffect(() => {
    if (
      subscriptionData &&
      'message' in subscriptionData.threadEvents &&
      subscriptionData.threadEvents.message.externalID === messageID
    ) {
      setSubscriptionMessage(subscriptionData.threadEvents.message);
    }
  }, [messageID, subscriptionData]);

  const message =
    // Changing the messageId doesn't necessarily reset React state, so make
    // sure it's still useable/valid.
    subscriptionMessage?.externalID === messageID ? subscriptionMessage : null;

  return { message };
}

/**
 * Fetch a message based on that message's external ID, and optionally based on
 * a thread's external ID.
 *
 * Specifying the thread isn't strictly necessary but can help with performance
 * in some cases (by allowing us to have more chance of a cache hit). Omitting
 * the message ID means to fetch the first message of the specified thread.
 * Omitting both the message and thread ID is equivalent to "skip" -- nothing
 * will be returned.
 *
 * This function is carefully constructed to maximise our chances of cache hits
 * in various cases -- we try to avoid a server-side hit if at all possible,
 * instead looking for the thread and message in the threads context cache.
 * Unlike most places where we don't care about performance, avoiding that
 * server-side hit actually is important: it's a very common pattern to
 * useThreads() and then to render a Message for each thread (which calls this
 * function internally), and doing a server-side hit for each Message is a big
 * enough perf problem we noticed immediately in Clack when we broke the caching
 * here.
 *
 * There are a lot of different cases to worry about -- the thread might be
 * cached or not, the cached thread might have the target message or not, the
 * caller might have specified a thread ID or a message ID or not, we might need
 * to set up our own gql subscription for updates if we didn't fetch out of the
 * cache, etc. Hopefully the code is factored in a way to make this all as clear
 * as possible, but React really doesn't make this easy since it all has to be
 * straight-line code with `skip` parameters.
 */
export function useMessageByExternalID({
  messageID,
  threadID,
}: {
  messageID: string | undefined;
  threadID: string | undefined;
}): {
  message: MessageFragment | undefined | null;
  thread: ThreadData | undefined | null;
} {
  // Try to get the message out of our thread context cache. If it's there, we
  // should just use it.
  const {
    message: messageFromThreadsContext,
    thread: threadFromThreadsContext,
    loading: loadingFromThreadsContext,
  } = useMessageFromThreadsContext({ messageID, threadID });

  // If that finished and it didn't work, we need to do a server-side hit.
  const {
    message: messageFromQuery,
    thread: threadFromQuery,
    loading: loadingFromQuery,
  } = useMessageFromQuery({
    messageID,
    thread: threadFromThreadsContext,
    skip:
      loadingFromThreadsContext ||
      !!(threadFromThreadsContext && messageFromThreadsContext),
  });

  if (threadID && threadFromQuery && threadID !== threadFromQuery.id) {
    console.error('Message is not part of specified thread');
  }

  const thread = threadFromThreadsContext ?? threadFromQuery;

  // If we got a message from a server-side hit, we need to subscribe to updates
  // for it ourselves -- this is normally done by the thread context, but that
  // is not in play if we did our own fetch.
  const { message: messageFromSubscription } = useMessageFromSubscription({
    messageID,
    threadID: thread?.id,
    skip: !messageFromQuery,
  });

  const message =
    messageFromThreadsContext ?? messageFromSubscription ?? messageFromQuery;
  const loading = loadingFromThreadsContext || loadingFromQuery;

  if (messageID && !message && !loading) {
    console.error(`Unknown message ID ${messageID}`);
  }

  return {
    message,
    thread,
  };
}
