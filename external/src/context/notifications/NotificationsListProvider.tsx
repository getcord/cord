import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import jsonStableStringify from 'fast-json-stable-stringify';
import {
  NotificationAddedTypeName,
  getLocationFilter,
} from 'common/types/index.ts';
import type { NotificationListFilter, UUID } from 'common/types/index.ts';
import {
  NotificationsContext,
  NotificationsListContext,
} from 'external/src/context/notifications/NotificationsContext.tsx';
import type { NotificationsNodeFragment } from 'external/src/graphql/operations.ts';
import {
  useNotificationEventsSubscription,
  useNotificationsQuery,
} from 'external/src/graphql/operations.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { batchReactUpdates } from 'external/src/lib/util.ts';
import { Errors } from 'common/const/Errors.ts';
import { DEFAULT_NOTIFICATION_INITIAL_PAGE_SIZE } from 'common/const/Api.ts';

type Props = {
  firstLoadCount?: number;
  filter?: NotificationListFilter;
};

export function NotificationsListProvider({
  firstLoadCount = DEFAULT_NOTIFICATION_INITIAL_PAGE_SIZE,
  filter,
  children,
}: React.PropsWithChildren<Props>) {
  return (
    <NotificationsListProviderImpl
      firstLoadCount={firstLoadCount}
      filter={filter}
      // We need this here to make sure the notificationList gets rerendered
      // with the correct data any time the filter is updated.
      key={jsonStableStringify(filter)}
    >
      {children}
    </NotificationsListProviderImpl>
  );
}

function NotificationsListProviderImpl({
  firstLoadCount = DEFAULT_NOTIFICATION_INITIAL_PAGE_SIZE,
  filter,
  children,
}: React.PropsWithChildren<Props>) {
  const { logError } = useLogger();
  const {
    notifications: notificationsMap,
    mergeFetchedNotifications,
    markAllNotificationsAsRead,
  } = useContextThrowingIfNoProvider(NotificationsContext);

  const [ids, setIds] = useState<UUID[]>([]);
  const [paginationInfo, setPaginationInfo] = useState({
    hasNextPage: true,
    endCursor: null as string | null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const traceRef = useRef<unknown[]>([]);

  const locationFilter = getLocationFilter(filter?.location);

  const { refetch: fetchAdditionalNotificationsQuery } = useNotificationsQuery({
    variables: {
      first: firstLoadCount,
      // Despite `after` being an optional parameter, our codegen renders that
      // into JS as a required property (which is permitted to be set to null or
      // undefined). So we need to put *something* here.
      after: null,
      filter: {
        location: locationFilter?.value ?? undefined,
        partialMatch: locationFilter?.partialMatch ?? undefined,
        metadata: filter?.metadata ?? undefined,
        organizationID: filter?.groupID ?? filter?.organizationID ?? undefined,
      },
    },
    onError: (e) => {
      if (e.message === Errors.USER_NOT_IN_GROUP) {
        console.error(
          `User is not part of group ${
            filter?.groupID ?? filter?.organizationID
          }.`,
        );
      } else {
        console.error('Something went wrong with requesting notifications.');
      }
      setLoading(false);
      setError(true);
    },
    onCompleted: (data) => {
      batchReactUpdates(() => {
        mergeFetchedNotifications(data.notifications.nodes);

        const newIds = data.notifications.nodes.map((notif) => notif.id);
        traceRef.current.push(
          `[${new Date().toISOString()}] Fetch completed, endCursor: ${
            data.notifications.paginationInfo.endCursor
          } hasNextPage: ${
            data.notifications.paginationInfo.hasNextPage
          } newIds: ${newIds.join(',')}`,
        );
        setIds((oldIds) => [...oldIds, ...newIds]);
        setPaginationInfo(data.notifications.paginationInfo);
        setLoading(false);
      });
    },
    notifyOnNetworkStatusChange: true, // Needed to make onCompleted be called again when refetch is called.
  });

  useNotificationEventsSubscription({
    variables: {
      filter: {
        metadata: filter?.metadata ?? undefined,
        location: locationFilter?.value ?? undefined,
        partialMatch: locationFilter?.partialMatch ?? undefined,
        organizationID: filter?.groupID ?? filter?.organizationID ?? undefined,
      },
    },
    onData: ({ data: { data } }) => {
      if (data) {
        switch (data.notificationEvents.__typename) {
          // TODO: We should split this event out from the rest of the events
          // (so we don't have to subscribe to all of them)
          case NotificationAddedTypeName: {
            const notif = data.notificationEvents.notification;
            mergeFetchedNotifications([notif]);
            traceRef.current.push(
              `[${new Date().toISOString()}] Subscription NotificationAddedTypeName received, id: ${
                notif.id
              }`,
            );
            setIds((oldIds) => [notif.id, ...oldIds]);
            break;
          }
          // Ignore other events.
        }
      }
    },
  });

  // Check whether there are duplicate notification IDs. This should never occur
  // but we have at least one bug report, so we want to know how often this happens.
  useEffect(() => {
    const duplicatedIDs = findDuplicates(ids);
    if (duplicatedIDs.length > 0) {
      traceRef.current.push(
        `[${new Date().toISOString()}] Duplicated IDs detected! ids: ${duplicatedIDs.join(
          ',',
        )}`,
      );
      logError(`Found duplicate notification ids`, {
        trace: traceRef.current.join('\n'),
      });
    }
  }, [ids, logError]);

  // TODO: this probably generates too many re-renders.
  const notifications = useMemo(() => {
    const result: NotificationsNodeFragment[] = [];
    ids.forEach((id) => {
      const notif = notificationsMap.get(id);
      if (!notif) {
        logError(`Could not find notification in cache: ${id}`);
      } else if (notif === 'deleted') {
        // Skip deleted notifs, not an error.
      } else {
        result.push(notif);
      }
    });
    return result;
  }, [ids, logError, notificationsMap]);

  const fetchAdditionalNotifications = useCallback(
    async (howMany: number) => {
      if (paginationInfo.hasNextPage) {
        traceRef.current.push(
          `[${new Date().toISOString()}] Pagination fetch beginning. first: ${howMany} after: ${
            paginationInfo.endCursor
          }`,
        );
        setLoading(true);
        await fetchAdditionalNotificationsQuery({
          first: howMany,
          after: paginationInfo.endCursor,
        });
      }
    },
    [fetchAdditionalNotificationsQuery, paginationInfo],
  );

  const markAllNotificationsAsReadWrapper = useCallback(
    () => markAllNotificationsAsRead(filter, ids),
    [filter, markAllNotificationsAsRead, ids],
  );

  const contextValue = {
    notifications,
    loading,
    hasMore: paginationInfo.hasNextPage,
    fetchAdditionalNotifications,
    markAllNotificationsAsRead: markAllNotificationsAsReadWrapper,
    error,
  };

  return (
    <NotificationsListContext.Provider value={contextValue}>
      {children}
    </NotificationsListContext.Provider>
  );
}

function findDuplicates(arr: string[]): string[] {
  const duplicates = new Set<string>();
  const seen = new Set<string>();

  for (const element of arr) {
    if (seen.has(element)) {
      duplicates.add(element);
    } else {
      seen.add(element);
    }
  }

  return Array.from(duplicates);
}
