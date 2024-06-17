import { useCordTranslation } from '@cord-sdk/react';
import { Menu } from 'external/src/components/ui3/Menu.tsx';
import { MenuItem } from 'external/src/components/ui3/MenuItem.tsx';
import { Icon } from 'external/src/components/ui3/icons/Icon.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { NotificationsContext } from 'external/src/context/notifications/NotificationsContext.tsx';
import type { NotificationsQueryResultNode } from 'external/src/components/notifications/types.ts';

type Props = {
  closeMenu: () => void;
  notification: NotificationsQueryResultNode;
};

export function NotificationActionsMenu({ closeMenu, notification }: Props) {
  const { t } = useCordTranslation('notifications');
  const {
    markNotificationAsRead,
    markNotificationAsUnread,
    deleteNotification,
  } = useContextThrowingIfNoProvider(NotificationsContext);

  return (
    <Menu>
      {notification.readStatus === 'unread' && (
        <MenuItem
          menuItemAction={'notification-mark-as-read'}
          leftItem={<Icon name="CheckCircle" />}
          label={t('mark_as_read_action')}
          onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();
            void markNotificationAsRead(notification.id);
            closeMenu();
          }}
        />
      )}
      {notification.readStatus === 'read' && (
        <MenuItem
          menuItemAction={'notification-mark-as-unread'}
          leftItem={<Icon name="MailUnread" />}
          label={t('mark_as_unread_action')}
          onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();
            void markNotificationAsUnread(notification.externalID);
            closeMenu();
          }}
        />
      )}
      <MenuItem
        menuItemAction={'notification-delete'}
        leftItem={<Icon name="Trash" />}
        label={t('delete_action')}
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          deleteNotification(notification.id);
          closeMenu();
        }}
      />
    </Menu>
  );
}
