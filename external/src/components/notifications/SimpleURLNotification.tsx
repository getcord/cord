import { useCallback } from 'react';
import { SimpleNotificationWrapper } from 'external/src/components/ui3/notifications/SimpleNotificationWrapper.tsx';
import { URLNotification } from 'external/src/components/ui3/notifications/SimpleNotificationWrapper.css.ts';
import type { NotificationsQueryResult } from 'external/src/graphql/operations.ts';
import type { NotificationReactComponentProps } from '@cord-sdk/react/components/Notification.tsx';
import { gqlNotificationFragmentToNotificationVariables } from 'common/util/convertToExternal/notification.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

type Props = {
  notification: NotificationsQueryResult['notifications']['nodes'][number];
  url: string;
  onClick?: NotificationReactComponentProps['onClick'];
};

export function SimpleURLNotification({ notification, url, onClick }: Props) {
  const {
    byInternalID: { userByID: userByInternalID },
  } = useContextThrowingIfNoProvider(UsersContext);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      onClick?.(e.nativeEvent, {
        notification: gqlNotificationFragmentToNotificationVariables(
          notification,
          userByInternalID,
        ),
        message: null,
        location: null,
        destinationUrl: url,
      });
    },
    [notification, onClick, url, userByInternalID],
  );

  return (
    <SimpleNotificationWrapper
      notification={notification}
      href={url}
      className={URLNotification}
      onClick={handleClick}
    />
  );
}
