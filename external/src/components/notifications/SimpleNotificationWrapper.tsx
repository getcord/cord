import { useCallback } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { MessageBlockRow2 } from 'external/src/components/2/MessageBlockRow2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import { Avatar2 } from 'external/src/components/ui2/Avatar2.tsx';
import { MessageTimestamp } from 'external/src/components/chat/message/MessageTimestamp.tsx';
import { StructuredNotificationHeader } from 'external/src/components/notifications/StructuredNotificationHeader.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { NotificationsContext } from 'external/src/context/notifications/NotificationsContext.tsx';
import { Row2 } from 'external/src/components/ui2/Row2.tsx';
import { NotificationOptions } from 'external/src/components/notifications/NotificationOptions.tsx';
import type { NotificationsQueryResultNode } from 'external/src/components/notifications/types.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';
import { cordifyClassname } from 'common/ui/style.ts';
import { userToUserData } from 'common/util/convertToExternal/user.ts';

const BADGE_SIZE = '2xs';

const AVATAR_SIZE = 'l';
const AVATAR_SIZE_VAR = cssVar(`space-${AVATAR_SIZE}`);

const useStyles = createUseStyles({
  linkWrapper: {
    display: 'block',
    textDecoration: 'none',
  },
  alignFlexStart: {
    alignItems: 'flex-start',
  },
  readTimestamp: {
    color: cssVar('notification-read-timestamp-text-color'),
  },
  unreadTimestamp: {
    color: cssVar('notification-unread-timestamp-text-color'),
    fontWeight: cssVar('font-weight-bold'),
  },
  badgeContainer: {
    alignItems: 'center',
    display: 'flex',
    gap: cssVar('space-3xs'),
  },
  badge: {
    backgroundColor: cssVar('notification-unread-badge-color'),
    borderRadius: '100%',
  },
  icon: {
    display: 'block',
    objectFit: 'cover',
    width: '100%',
  },
  notificationContainer: {
    position: 'relative',

    '&:hover $notificationBackground': {
      backgroundColor: cssVar('notification-background-color--hover'),
    },

    '&:hover $notificationBackground$unread': {
      backgroundColor: cssVar('notification-unread-background-color--hover'),
      opacity: cssVar('notification-unread-background-color-opacity--hover'),
    },
  },
  notificationBackground: {
    backgroundColor: cssVar('notification-background-color'),
    border: cssVar('notification-border'),
    borderRadius: cssVar('notification-border-radius'),
    boxShadow: cssVar('notification-box-shadow'),
    height: '100%',
    left: 0,
    pointerEvents: 'none',
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: -1,
  },
  unread: {
    backgroundColor: cssVar('notification-unread-background-color'),
    opacity: cssVar('notification-unread-background-color-opacity'),
  },
  optionsButtonWrapper: {
    height: AVATAR_SIZE_VAR,
    marginTop: `calc(-1 * ${cssVar('space-3xs')})`,
  },
  notificationHeaderAndOptionsContainer: {
    alignItems: 'flex-start',
    display: 'flex',
    flex: 1,
    gap: cssVar('space-3xs'),
  },
  notification: {
    '&:hover $notificationOptionsButtonHidden': {
      pointerEvents: 'auto',
      visibility: 'visible',
    },
  },
  notificationOptionsButtonHidden: {
    pointerEvents: 'none',
    visibility: 'hidden',
  },
  notificationOptionsButtonVisible: {
    pointerEvents: 'auto',
    visibility: 'visible',
  },
});

type Props = {
  notification: NotificationsQueryResultNode;
  attachment?: JSX.Element;
  onClick?: (e: React.MouseEvent) => void;
  href: string;
};

/**
 * @deprecated Plesae use `ui3/SimpleNotificationWrapper` instead.
 */
export function SimpleNotificationWrapper({
  notification,
  attachment,
  onClick,
  href,
}: Props) {
  const classes = useStyles();

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
          className={classes.icon}
          style={{
            height: 20,
            width: 20,
          }}
          src={notification.iconUrl}
          draggable={false}
        />
      );
    }
    if (notification.senders.length > 0) {
      return (
        <Avatar2
          size={AVATAR_SIZE}
          user={userToUserData(notification.senders[0])}
        />
      );
    }
    return <Icon2 name="Bell" />;
  };

  return (
    <a
      className={cx(
        classes.linkWrapper,
        cordifyClassname('simple-notification'),
      )}
      href={href}
      onClick={onNotificationClick}
      data-cy="cord-notification"
      data-cord-notification-id={notification.externalID}
    >
      <Box2
        padding="xs"
        paddingTop="m"
        style={{ cursor: 'pointer' }}
        className={cx(classes.notificationContainer, classes.notification)}
      >
        <MessageBlockRow2
          className={classes.alignFlexStart}
          leftElement={
            <div className={classes.badgeContainer}>
              {!notifIsRead ? (
                <Box2
                  width={BADGE_SIZE}
                  height={BADGE_SIZE}
                  className={classes.badge}
                  marginLeft="auto"
                />
              ) : null}

              {renderIcon()}
            </div>
          }
          leftElementAlignment="flex-end"
          paddingLeft="2xs"
        >
          <Box2 className={classes.notificationHeaderAndOptionsContainer}>
            <StructuredNotificationHeader notification={notification} />
            <Row2 className={classes.optionsButtonWrapper}>
              <NotificationOptions
                notification={notification}
                getClassName={(menuVisible) =>
                  classes[
                    menuVisible
                      ? 'notificationOptionsButtonVisible'
                      : 'notificationOptionsButtonHidden'
                  ]
                }
              />
            </Row2>
          </Box2>
        </MessageBlockRow2>
        {attachment && (
          <MessageBlockRow2
            marginTop="2xs"
            leftElement={null}
            paddingLeft="2xs"
          >
            {attachment}
          </MessageBlockRow2>
        )}
        <MessageBlockRow2 marginTop="2xs" leftElement={null} paddingLeft="2xs">
          <MessageTimestamp
            className={cx(classes.readTimestamp, {
              [classes.unreadTimestamp]: !notifIsRead,
            })}
            isoDateString={notification.timestamp}
            relative={true}
            translationNamespace="notifications"
          />
        </MessageBlockRow2>
        <Box2
          className={cx(classes.notificationBackground, {
            [classes.unread]: !notifIsRead,
          })}
        />
      </Box2>
    </a>
  );
}
