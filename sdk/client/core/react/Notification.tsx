import { memo, useState } from 'react';
import type { NotificationReactComponentProps } from '@cord-sdk/react';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { NotificationsContext } from 'external/src/context/notifications/NotificationsContext.tsx';
import { NotificationImpl } from 'external/src/components/ui3/NotificationList.tsx';
import { useNotificationByExternalIDQuery } from 'external/src/graphql/operations.ts';
import 'sdk/client/core/react/Notification.css';
import { batchReactUpdates } from 'external/src/lib/util.ts';

function Notification({
  notificationId: externalID,
  onClick,
}: NotificationReactComponentProps) {
  const { notificationsByExternalID, mergeFetchedNotifications } =
    useContextThrowingIfNoProvider(NotificationsContext);

  const notif = notificationsByExternalID.get(externalID);
  const [loading, setLoading] = useState(!notif);

  useNotificationByExternalIDQuery({
    variables: {
      externalID,
    },
    skip: !!notif,
    onCompleted: (data) => {
      batchReactUpdates(() => {
        const fetchedNotif = data.notificationByExternalID;
        if (fetchedNotif) {
          mergeFetchedNotifications([fetchedNotif]);
        }
        setLoading(false);
      });
    },
  });

  if (!notif || notif === 'deleted') {
    if (!notif && !loading) {
      console.warn(`Unknown notification: ${externalID}`);
    }
    return null;
  }

  return <NotificationImpl node={notif} onClick={onClick} />;
}

export default memo(Notification);
