import { useCallback, useEffect, useMemo, useState } from 'react';
import { sort } from 'radash';

import { useInboxQuery } from 'external/src/graphql/operations.ts';
import type { UUID } from 'common/types/index.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import {
  inboxThreadFragmentToThreadData,
  ThreadsContext2,
} from 'external/src/context/threads2/ThreadsContext2.tsx';
import {
  batchReactUpdates,
  getThreadLatestTimestamp,
} from 'external/src/lib/util.ts';
import { InboxContext } from 'external/src/context/inbox/InboxContext.ts';
import { useUpdatingRef } from 'external/src/effects/useUpdatingRef.ts';
import { GlobalElementContext } from 'external/src/context/globalElement/GlobalElementContext.ts';
import { extractUsersFromInboxThread2 } from 'external/src/context/users/util.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';

export function useInbox2Controller() {
  const { getThreadUpdatingRef, mergeThread, markThreadSeen, reorderThreads } =
    useContextThrowingIfNoProvider(ThreadsContext2);

  // Order threads by latest message timestamp
  const orderThreads = useCallback(
    (threadIDs: UUID[]) => {
      return sort(
        threadIDs.map((id) => getThreadUpdatingRef(id).current!),
        getThreadLatestTimestamp,
        true,
      ).map((thread) => thread.id);
    },
    [getThreadUpdatingRef],
  );

  const [threadIDs, setThreadIDs] = useState<{
    unread: UUID[];
    read: UUID[];
  }>({
    unread: [],
    read: [],
  });

  const {
    addUsers,
    byInternalID: { requestUsers },
  } = useContextThrowingIfNoProvider(UsersContext);
  const { lastUpdateTimestamp } = useContextThrowingIfNoProvider(InboxContext);
  const [initialInboxLoadDone, setInitialInboxLoadDone] = useState(false);
  const {
    data: inboxItemsResult,
    loading: inboxItemsLoading,
    refetch: refetchInboxItems,
  } = useInboxQuery();

  const showToastPopup =
    useContextThrowingIfNoProvider(GlobalElementContext)?.showToastPopup;

  const initialInboxLoadDoneRef = useUpdatingRef(initialInboxLoadDone);
  useEffect(() => {
    if (initialInboxLoadDoneRef.current) {
      void refetchInboxItems();
    }
  }, [initialInboxLoadDoneRef, lastUpdateTimestamp, refetchInboxItems]);

  useEffect(() => {
    if (!inboxItemsLoading && inboxItemsResult) {
      const { threads: unreadThreads, threadsArchive: readThreads } =
        inboxItemsResult.viewer.inbox;
      [...unreadThreads, ...readThreads].map((t) =>
        extractUsersFromInboxThread2(t, addUsers, requestUsers),
      );
      batchReactUpdates(() => {
        setThreadIDs((prev) => {
          const prevUnreadIDs = new Set(prev.unread);
          const prevReadIDs = new Set(prev.read);
          const newUnreadThreadIDs: UUID[] = [];
          let newReadThreadIDs: UUID[] = [];
          // For unread threads, maintain order adding any new threads to front
          for (const unreadThread of unreadThreads) {
            if (!prevUnreadIDs.has(unreadThread.id)) {
              newUnreadThreadIDs.push(unreadThread.id);
            }
          }
          newUnreadThreadIDs.push(...prev.unread);
          const unreadThreadIDSet = new Set(newUnreadThreadIDs);
          // For read threads, maintain order adding any new threads that aren't
          // in unread to front. Filter out any read threads that are still in
          // the unread section (because we avoid moving threads from unread to
          // read without manual user action)
          for (const readThread of readThreads) {
            if (!prevReadIDs.has(readThread.id)) {
              newReadThreadIDs.push(readThread.id);
            }
          }
          newReadThreadIDs.push(...prev.read);
          newReadThreadIDs = newReadThreadIDs.filter(
            (readThreadID) => !unreadThreadIDSet.has(readThreadID),
          );
          return {
            ...prev,
            unread: newUnreadThreadIDs,
            read: newReadThreadIDs,
          };
        });
        for (const thread of [...unreadThreads, ...readThreads]) {
          // Only add threads that we're not tracking already, to avoid
          // overwriting messages that were added via subscription/loadOlderMessages
          if (!getThreadUpdatingRef(thread.id).current) {
            mergeThread(inboxThreadFragmentToThreadData(thread));
          }
        }
        setInitialInboxLoadDone(true);
      });
    }
  }, [
    addUsers,
    requestUsers,
    getThreadUpdatingRef,
    inboxItemsLoading,
    inboxItemsResult,
    mergeThread,
  ]);

  const markThreadAsRead = useCallback(
    (threadID: UUID) => {
      markThreadSeen(threadID);
      setThreadIDs((prev) => {
        return {
          ...prev,
          read: orderThreads([...prev.read, threadID]),
          unread: prev.unread.filter((id) => id !== threadID),
        };
      });
      showToastPopup?.(`Conversation marked as read`);
    },
    [markThreadSeen, orderThreads, showToastPopup],
  );

  // Reorder, and move any read inbox threads out of unread section
  const refreshUnreadAndReadSections = useCallback(() => {
    const orderedThreadIDs = reorderThreads();
    const unread: UUID[] = [];
    const read: UUID[] = [];
    for (const threadID of orderedThreadIDs) {
      const thread = getThreadUpdatingRef(threadID).current;
      if (!thread) {
        continue;
      }
      if (thread.hasNewMessages) {
        unread.push(threadID);
      } else {
        read.push(threadID);
      }
    }
    setThreadIDs({ unread, read });
  }, [getThreadUpdatingRef, reorderThreads]);

  return useMemo(
    () => ({
      threadIDs,
      markThreadAsRead,
      initialInboxLoadDone,
      refreshUnreadAndReadSections,
    }),
    [
      initialInboxLoadDone,
      markThreadAsRead,
      refreshUnreadAndReadSections,
      threadIDs,
    ],
  );
}
