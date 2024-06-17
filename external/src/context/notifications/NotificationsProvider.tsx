import { useMemo, useCallback, useReducer } from 'react';

import type {
  NotificationsContextMapValue,
  NotificationsContextType,
} from 'external/src/context/notifications/NotificationsContext.tsx';
import { NotificationsContext } from 'external/src/context/notifications/NotificationsContext.tsx';
import type {
  NotificationReadStatus,
  NotificationsNodeFragment,
} from 'external/src/graphql/operations.ts';
import {
  useNotificationEventsSubscription,
  useDeleteNotificationMutation,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
  useMarkNotificationAsUnreadMutation,
} from 'external/src/graphql/operations.ts';
import type { NotificationListFilter, UUID } from 'common/types/index.ts';
import {
  NotificationDeletedTypeName,
  NotificationAddedTypeName,
  NotificationReadStateUpdatedTypeName,
  getLocationFilter,
} from 'common/types/index.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';

type NotificationsState = {
  notifications: Map<UUID, NotificationsContextMapValue>;
  notificationsByExternalID: Map<UUID, NotificationsContextMapValue>;
};

type NotificationsActions =
  | {
      type: 'MERGE_NOTIFICATIONS';
      notifications: NotificationsNodeFragment[];
    }
  | { type: 'DELETE_NOTIFICATIONS'; notificationIDs: UUID[] }
  | {
      type: 'UPDATE_READ_STATUS';
      notificationIDs: UUID[];
      status: NotificationReadStatus;
      byExternalID: boolean;
    };

function notificationsReducer(
  state: NotificationsState,
  action: NotificationsActions,
): NotificationsState {
  const newState = {
    notifications: new Map(state.notifications),
    notificationsByExternalID: new Map(state.notificationsByExternalID),
  };
  switch (action.type) {
    case 'MERGE_NOTIFICATIONS':
      action.notifications.forEach((notif) => {
        newState.notifications.set(notif.id, notif);
        newState.notificationsByExternalID.set(notif.externalID, notif);
      });
      return newState;
    case 'DELETE_NOTIFICATIONS':
      action.notificationIDs.forEach((id) => {
        const notif = state.notifications.get(id);
        newState.notifications.set(id, 'deleted');
        if (notif && notif !== 'deleted') {
          newState.notificationsByExternalID.set(notif.externalID, 'deleted');
        }
      });
      return newState;
    case 'UPDATE_READ_STATUS': {
      const readMap = action.byExternalID
        ? state.notificationsByExternalID
        : state.notifications;
      action.notificationIDs.forEach((id) => {
        const notif = readMap.get(id);
        if (notif && notif !== 'deleted') {
          const updatedNotif = { ...notif, readStatus: action.status } as const;
          newState.notifications.set(notif.id, updatedNotif);
          newState.notificationsByExternalID.set(
            notif.externalID,
            updatedNotif,
          );
        }
      });
      return newState;
    }
  }
}

export function NotificationsProvider({
  children,
}: React.PropsWithChildren<unknown>) {
  const [state, dispatch] = useReducer(notificationsReducer, {
    notifications: new Map(),
    notificationsByExternalID: new Map(),
  });
  const { logWarning } = useLogger();

  useNotificationEventsSubscription({
    variables: {
      filter: {
        metadata: undefined,
        location: undefined,
        partialMatch: undefined,
        organizationID: undefined,
      },
    },
    onData: ({ data: { data } }) => {
      if (data) {
        const event = data.notificationEvents.__typename;
        switch (event) {
          case NotificationAddedTypeName: {
            // No need to do anything, handled by NotificationsListProvider.
            break;
          }
          case NotificationReadStateUpdatedTypeName: {
            dispatch({
              type: 'UPDATE_READ_STATUS',
              notificationIDs: [data.notificationEvents.notification.id],
              status: data.notificationEvents.notification.readStatus,
              byExternalID: false,
            });
            break;
          }
          case NotificationDeletedTypeName: {
            dispatch({
              type: 'DELETE_NOTIFICATIONS',
              notificationIDs: [data.notificationEvents.id],
            });
            break;
          }
          default: {
            const _: never = event;
            logWarning('Unhandled notification event', data.notificationEvents);
          }
        }
      }
    },
  });

  const [markAllNotificationsAsReadMutation] =
    useMarkAllNotificationsAsReadMutation();
  const [markNotificationAsReadMutation] = useMarkNotificationAsReadMutation();
  const [markNotificationAsUnreadMutation] =
    useMarkNotificationAsUnreadMutation();
  const [deleteNotificationMutation] = useDeleteNotificationMutation();

  const mergeFetchedNotifications = useCallback(
    (toMerge: NotificationsNodeFragment[]) =>
      dispatch({ type: 'MERGE_NOTIFICATIONS', notifications: toMerge }),
    [],
  );

  const markAllNotificationsAsRead = useCallback(
    async (
      filter: NotificationListFilter | undefined,
      optimisticUpdateIDs: string[],
      byExternalID = false,
    ) => {
      if (optimisticUpdateIDs.length > 0) {
        dispatch({
          type: 'UPDATE_READ_STATUS',
          notificationIDs: optimisticUpdateIDs,
          status: 'read',
          byExternalID,
        });
      }
      const locationFilter = getLocationFilter(filter?.location);

      await markAllNotificationsAsReadMutation({
        variables: {
          filter: {
            location: locationFilter?.value ?? undefined,
            partialMatch: locationFilter?.partialMatch ?? undefined,
            metadata: filter?.metadata ?? undefined,
            organizationID:
              filter?.groupID ?? filter?.organizationID ?? undefined,
          },
        },
      });
    },
    [markAllNotificationsAsReadMutation],
  );

  const markNotificationAsRead = useCallback(
    async (notificationID: string, byExternalID = false) => {
      dispatch({
        type: 'UPDATE_READ_STATUS',
        notificationIDs: [notificationID],
        status: 'read',
        byExternalID,
      });
      const result = await markNotificationAsReadMutation({
        variables: { notificationID, byExternalID },
      });
      if (!result.data?.markNotificationAsRead.success) {
        console.error(
          'Failed to mark notification as read',
          result.data?.markNotificationAsRead.failureDetails,
        );
      }
    },
    [markNotificationAsReadMutation],
  );

  const markNotificationAsUnread = useCallback(
    async (notificationExternalID: string) => {
      dispatch({
        type: 'UPDATE_READ_STATUS',
        notificationIDs: [notificationExternalID],
        status: 'unread',
        byExternalID: true,
      });
      const result = await markNotificationAsUnreadMutation({
        variables: { notificationExternalID },
      });
      if (!result.data?.markNotificationAsUnread.success) {
        console.error(
          'Failed to mark notification as unread',
          result.data?.markNotificationAsUnread.failureDetails,
        );
      }
    },
    [markNotificationAsUnreadMutation],
  );

  const deleteNotification = useCallback(
    async (notificationID: UUID) => {
      dispatch({
        type: 'DELETE_NOTIFICATIONS',
        notificationIDs: [notificationID],
      });
      await deleteNotificationMutation({
        variables: { notificationID, byExternalID: false },
      });
    },
    [deleteNotificationMutation],
  );

  const contextValue: NotificationsContextType = useMemo(
    () => ({
      notifications: state.notifications,
      notificationsByExternalID: state.notificationsByExternalID,
      mergeFetchedNotifications,
      markAllNotificationsAsRead,
      markNotificationAsRead,
      markNotificationAsUnread,
      deleteNotification,
    }),
    [
      state,
      mergeFetchedNotifications,
      markAllNotificationsAsRead,
      markNotificationAsRead,
      markNotificationAsUnread,
      deleteNotification,
    ],
  );

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  );
}
