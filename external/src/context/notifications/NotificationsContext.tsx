import { createContext } from 'react';

import type { NotificationListFilter, UUID } from 'common/types/index.ts';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';
import type { NotificationsNodeFragment } from 'external/src/graphql/operations.ts';

export type NotificationsContextMapValue =
  | NotificationsNodeFragment
  | 'deleted';

export type NotificationsContextType = {
  notifications: ReadonlyMap<UUID, NotificationsContextMapValue>;
  notificationsByExternalID: ReadonlyMap<string, NotificationsContextMapValue>;
  mergeFetchedNotifications: (notifs: NotificationsNodeFragment[]) => void;
  markAllNotificationsAsRead: (
    filter: NotificationListFilter | undefined,
    optimisticUpdateIDs: string[],
    byExternalID?: boolean,
  ) => Promise<void>;
  markNotificationAsRead: (
    notificationID: string,
    byExternalID?: boolean,
  ) => Promise<void>;
  markNotificationAsUnread: (notificationExternalID: string) => Promise<void>;
  deleteNotification: (notificationID: UUID) => void;
};

export const NotificationsContext = createContext<
  NotificationsContextType | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);

type NotificationsListContextType = {
  notifications: NotificationsNodeFragment[];
  loading: boolean;
  hasMore: boolean;
  fetchAdditionalNotifications: (howMany: number) => Promise<void>;
  markAllNotificationsAsRead: () => void;
  error: boolean;
};

export const NotificationsListContext = createContext<
  NotificationsListContextType | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);
