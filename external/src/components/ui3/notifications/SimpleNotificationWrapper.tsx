import { useCallback } from 'react';
import cx from 'classnames';
import { StructuredNotificationHeader } from 'external/src/components/ui3/notifications/StructuredNotificationHeader.tsx';
import { Avatar } from 'external/src/components/ui3/Avatar.tsx';
import { MessageTimestamp } from 'external/src/components/ui3/MessageTimestamp.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { NotificationsContext } from 'external/src/context/notifications/NotificationsContext.tsx';
import { NotificationOptions } from 'external/src/components/ui3/notifications/NotificationOptions.tsx';
import type { NotificationsQueryResultNode } from 'external/src/components/notifications/types.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { Icon } from 'external/src/components/ui3/icons/Icon.tsx';

import * as classes from 'external/src/components/ui3/notifications/SimpleNotificationWrapper.css.ts';
import { AVATAR_SIZE } from 'external/src/components/ui3/notifications/SimpleNotificationWrapper.css.ts';
import { MODIFIERS } from 'common/ui/modifiers.ts';
import { useExtraClassnames } from '@cord-sdk/react/hooks/useExtraClassnames.ts';
import { userToUserData } from 'common/util/convertToExternal/user.ts';

type Props = {
  notification: NotificationsQueryResultNode;
  attachment?: JSX.Element;
  onClick?: (e: React.MouseEvent) => void;
  href: string;
  className: string;
};

export function SimpleNotificationWrapper({
  className,
  notification,
  attachment,
  onClick,
  href,
}: Props) {
  const { markNotificationAsRead } =
    useContextThrowingIfNoProvider(NotificationsContext);

  const { logEvent } = useLogger();

  const onNotificationClick = useCallback(
    (e: React.MouseEvent) => {
      void markNotificationAsRead(notification.id);
      logEvent('notification-onclick', { id: notification.id });
      onClick?.(e);
    },
    [markNotificationAsRead, notification.id, logEvent, onClick],
  );

  const notifIsRead = notification.readStatus === 'read';

  const renderIcon = () => {
    if (notification.iconUrl) {
      return (
        <img
          className={classes.notificationIcon}
          src={notification.iconUrl}
          draggable={false}
        />
      );
    }
    if (notification.senders.length > 0) {
      return (
        <Avatar
          size={AVATAR_SIZE}
          user={userToUserData(notification.senders[0])}
        />
      );
    }
    return <Icon name="Bell" />;
  };

  const extraClassnames = useExtraClassnames(notification.extraClassnames);

  return (
    <a
      className={cx(className, classes.notificationContainer, extraClassnames, {
        [MODIFIERS.unseen]: !notifIsRead,
      })}
      href={href}
      onClick={onNotificationClick}
      data-cy="cord-notification"
      data-cord-notification-id={notification.externalID}
    >
      <>
        <div className={classes.notificationIconContainer}>{renderIcon()}</div>
        <StructuredNotificationHeader notification={notification} />
        <NotificationOptions notification={notification} />
        {attachment && <>{attachment}</>}
        <MessageTimestamp
          value={notification.timestamp}
          relative={true}
          translationNamespace="notifications"
        />
      </>
    </a>
  );
}
