import { useCordTranslation } from '@cord-sdk/react';
import { Menu2 } from 'external/src/components/ui2/Menu2.tsx';
import { MenuItem2 } from 'external/src/components/ui2/MenuItem2.tsx';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';
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
    <Menu2>
      {notification.readStatus === 'unread' && (
        <MenuItem2
          leftItem={<Icon2 name="CheckCircle" />}
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
        <MenuItem2
          leftItem={<Icon2 name="MailUnread" />}
          label={t('mark_as_unread_action')}
          onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();
            void markNotificationAsUnread(notification.id);
            closeMenu();
          }}
        />
      )}
      <MenuItem2
        leftItem={<Icon2 name="Trash" />}
        label={t('delete_action')}
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          deleteNotification(notification.id);
          closeMenu();
        }}
      />
    </Menu2>
  );
}
