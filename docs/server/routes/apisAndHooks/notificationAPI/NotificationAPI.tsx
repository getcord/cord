import NotificationDelete from 'docs/server/routes/apisAndHooks/notificationAPI/NotificationDelete.tsx';
import NotificationMarkAsRead from 'docs/server/routes/apisAndHooks/notificationAPI/NotificationMarkAsRead.tsx';
import NotificationObserveNotifications from 'docs/server/routes/apisAndHooks/notificationAPI/NotificationObserveNotifications.tsx';
import NotificationObserveNotificationCounts from 'docs/server/routes/apisAndHooks/notificationAPI/NotificationObserveNotificationCounts.tsx';
import IndexCardTiles from 'docs/server/ui/indexCardTiles/IndexCardTiles.tsx';
import Page from 'docs/server/ui/page/Page.tsx';

const uri = '/js-apis-and-hooks/notification-api';
const title = 'Notification API';
const subtitle =
  'The notification API offers information about user notifications in your app, letting you build custom UI indicators such as unread badge counts';

const navItems = [
  {
    name: NotificationObserveNotificationCounts.title,
    linkTo: NotificationObserveNotificationCounts.uri,
    description: NotificationObserveNotificationCounts.subtitle,
    component: <NotificationObserveNotificationCounts.Element />,
  },
  {
    name: NotificationObserveNotifications.title,
    linkTo: NotificationObserveNotifications.uri,
    description: NotificationObserveNotifications.subtitle,
    component: <NotificationObserveNotifications.Element />,
  },
  {
    name: NotificationMarkAsRead.title,
    linkTo: NotificationMarkAsRead.uri,
    description: NotificationMarkAsRead.subtitle,
    component: <NotificationMarkAsRead.Element />,
  },
  {
    name: NotificationDelete.title,
    linkTo: NotificationDelete.uri,
    description: NotificationDelete.subtitle,
    component: <NotificationDelete.Element />,
  },
];

function NotificationAPI() {
  return (
    <Page
      pretitle="JavaScript APIs & Hooks"
      pretitleLinkTo="/js-apis-and-hooks"
      title={title}
      pageSubtitle={subtitle}
    >
      <IndexCardTiles cardList={navItems} />
    </Page>
  );
}

export default {
  uri,
  title,
  subtitle,
  Element: NotificationAPI,
  navItems,
};
