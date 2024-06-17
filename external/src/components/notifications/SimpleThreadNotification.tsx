import { useCallback } from 'react';
import { SimpleNotificationWrapper } from 'external/src/components/ui3/notifications/SimpleNotificationWrapper.tsx';
import { URLNotification } from 'external/src/components/ui3/notifications/SimpleNotificationWrapper.css.ts';
import type {
  NotificationsQueryResult,
  ThreadFragment,
} from 'external/src/graphql/operations.ts';
import type { NotificationReactComponentProps } from '@cord-sdk/react/components/Notification.tsx';
import { gqlNotificationFragmentToNotificationVariables } from 'common/util/convertToExternal/notification.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

import { useNavigateToThreadPage } from 'external/src/effects/useNavigateToThreadPage.ts';

type Props = {
  notification: NotificationsQueryResult['notifications']['nodes'][number];
  thread: ThreadFragment;
  onClick?: NotificationReactComponentProps['onClick'];
};

export function SimpleThreadNotification({
  notification,
  thread,
  onClick,
}: Props) {
  const {
    byInternalID: { userByID: userByInternalID },
  } = useContextThrowingIfNoProvider(UsersContext);

  const openThreadPage = useNavigateToThreadPage({
    url: thread.url,
    threadID: thread.id,
    externalThreadID: thread.externalID,
    location: thread.location,
    targetOrgID: thread.externalOrgID,
    navigationUrl: thread.navigationURL,
    navigationTarget: '_top',
  });

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      onClick?.(e.nativeEvent, {
        notification: gqlNotificationFragmentToNotificationVariables(
          notification,
          userByInternalID,
        ),
        location: thread.location,
        destinationUrl: thread.navigationURL,
        message: null,
      });
      if (!e.nativeEvent.defaultPrevented) {
        e.preventDefault();
        void openThreadPage();
      }
    },
    [onClick, notification, userByInternalID, thread, openThreadPage],
  );

  return (
    <div>
      <SimpleNotificationWrapper
        notification={notification}
        href={thread.url}
        className={URLNotification}
        onClick={handleClick}
      />
    </div>
  );
}
