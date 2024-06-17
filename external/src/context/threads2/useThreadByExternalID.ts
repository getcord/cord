import { useEffect, useRef } from 'react';
import {
  threadFragmentToThreadData,
  ThreadsContext2,
  ThreadsDataContext2,
} from 'external/src/context/threads2/ThreadsContext2.tsx';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { extractUsersFromThread2 } from 'external/src/context/users/util.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { useThreadByExternalID2Query } from 'external/src/graphql/operations.ts';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';

type Options = {
  initialFetchCount?: number;
};

export function useThreadByExternalID(
  externalThreadID: string | undefined,
  { initialFetchCount }: Options = {},
) {
  const { organization } = useContextThrowingIfNoProvider(OrganizationContext);
  const { mergeThread, getThreadByExternalID, addExternalIDMapping } =
    useContextThrowingIfNoProvider(ThreadsContext2);
  // This component needs to re-render when threadData changes because
  // getThreadByExternalID depends on it
  // TODO: Find a cleaner solution
  useContextThrowingIfNoProvider(ThreadsDataContext2);

  const thread = externalThreadID
    ? getThreadByExternalID(externalThreadID)
    : undefined;

  const {
    addUsers,
    byInternalID: { requestUsers },
  } = useContextThrowingIfNoProvider(UsersContext);

  // The GraphQL interface and our internal representation always keep the first
  // message of the thread in thread.messages[0], but if the caller requested N
  // messages, we don't want to count that first message unless we have all the
  // intervening messages
  const messagesInThread = !thread
    ? 0
    : thread.messages.length === thread.allMessagesCount
    ? thread.messages.length
    : thread.messages.length - 1;

  const threadHasEnoughMessages =
    thread &&
    (initialFetchCount === undefined ||
      Math.min(initialFetchCount, thread.allMessagesCount) <= messagesInThread);

  // fetch thread if needed and add it to context once fetched
  const { data, loading, error } = useThreadByExternalID2Query({
    skip: threadHasEnoughMessages || !externalThreadID,
    variables: {
      input: {
        externalThreadID: externalThreadID!,
      },
      initialFetchCount,
      _externalOrgID: organization?.externalID ?? null,
    },
  });

  const lastProcessedQueryRef = useRef<typeof data | undefined>();

  useEffect(() => {
    if (lastProcessedQueryRef.current) {
      return;
    }
    lastProcessedQueryRef.current = data;

    if (error) {
      console.error(
        `Error fetching thread ${externalThreadID}: ${error.message}`,
      );
    }

    if (!data?.threadByExternalID2.thread) {
      if (data?.threadByExternalID2.id && externalThreadID) {
        addExternalIDMapping(externalThreadID, data.threadByExternalID2.id);
      }
      return;
    }
    extractUsersFromThread2(
      data.threadByExternalID2.thread,
      addUsers,
      requestUsers,
    );
    mergeThread(threadFragmentToThreadData(data.threadByExternalID2.thread));
  }, [
    addUsers,
    requestUsers,
    data,
    error,
    mergeThread,
    addExternalIDMapping,
    externalThreadID,
    thread,
    loading,
  ]);

  // Report to the caller that we're loading if either Apollo says we're loading
  // from GraphQL, *or* if we've got a result from Apollo but haven't yet run
  // the extract+merge effect above and pulled the processed thread back out of
  // the context.
  return {
    thread,
    threadID: thread?.id ?? data?.threadByExternalID2.id,
    loading:
      loading ||
      !!(data?.threadByExternalID2.thread && !threadHasEnoughMessages),
  };
}
