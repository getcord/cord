import { useCallback } from 'react';

import { useNavigateToThreadPage } from 'external/src/effects/useNavigateToThreadPage.ts';
import type { NotificationsMessageFragment } from 'external/src/graphql/operations.ts';
import { SimpleNotificationWrapper } from 'external/src/components/ui3/notifications/SimpleNotificationWrapper.tsx';
import { StructuredMessage2 } from 'external/src/components/chat/message/StructuredMessage2.tsx';
import * as classes from 'external/src/components/ui3/notifications/SimpleMessageNotification.css.ts';
import type { NotificationsQueryResultNode } from 'external/src/components/notifications/types.ts';
import { messageNotification } from 'external/src/components/ui3/notifications/SimpleNotificationWrapper.css.ts';
import type { NotificationReactComponentProps } from '@cord-sdk/react/components/Notification.tsx';
import { getMessageData } from 'common/util/convertToExternal/thread.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { gqlNotificationFragmentToNotificationVariables } from 'common/util/convertToExternal/notification.ts';

type Props = {
  notification: NotificationsQueryResultNode;
  message: NotificationsMessageFragment;
  onClick?: NotificationReactComponentProps['onClick'];
};

export function SimpleMessageNotification({
  notification,
  message,
  onClick,
}: Props) {
  // TODO (notifications) placeholder deep linking solution
  const {
    byInternalID: { userByID: userByInternalID },
  } = useContextThrowingIfNoProvider(UsersContext);

  const openThreadPage = useNavigateToThreadPage({
    url: message.thread.url,
    threadID: message.thread.id,
    externalThreadID: message.thread.externalID,
    location: message.thread.location,
    targetOrgID: message.thread.externalOrgID,
    navigationUrl: message.thread.navigationURL,
    navigationTarget: '_top',
  });
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      onClick?.(e.nativeEvent, {
        notification: gqlNotificationFragmentToNotificationVariables(
          notification,
          userByInternalID,
        ),
        location: message.thread.location,
        destinationUrl: message.thread.navigationURL,
        message: getMessageData({
          message,
          thread: message.thread,
          userByInternalID,
        }),
      });
      if (!e.nativeEvent.defaultPrevented) {
        e.preventDefault();
        void openThreadPage();
      }
    },
    [onClick, notification, userByInternalID, message, openThreadPage],
  );

  // TODO(notifications) as written this renders all of the possible things that
  // can be inside a `StructuredMessage`/`MessageContent`. Is that what we want?
  //
  // TODO(notifications) is `true` the correct value of
  // `hideAnnotationAttachment`?
  //
  // TODO(notifications) are we dealing with deleted messages properly? That's
  // why we need the `any` cast...
  return (
    <SimpleNotificationWrapper
      notification={notification}
      className={messageNotification}
      onClick={handleClick}
      href={message.thread.url}
      attachment={
        <div className={classes.notificationMessage}>
          <StructuredMessage2
            message={message}
            content={message.content}
            wasEdited={false}
            isMessageBeingEdited={false}
            hideAnnotationAttachment={true}
          />
        </div>
      }
    />
  );
}
