import Page from 'docs/server/ui/page/Page.tsx';
import IndexCardTiles from 'docs/server/ui/indexCardTiles/IndexCardTiles.tsx';
import UserObserveUserData from 'docs/server/routes/apisAndHooks/userAPI/UserObserveUserData.tsx';
import UserObserveViewerData from 'docs/server/routes/apisAndHooks/userAPI/UserObserveViewerData.tsx';
import UserSetNotificationPreferences from 'docs/server/routes/apisAndHooks/userAPI/UserSetNotificationPreferences.tsx';
import UserObserveOrgMembers from 'docs/server/routes/apisAndHooks/userAPI/UserObserveOrgMembers.tsx';
import UserConnectToSlack from 'docs/server/routes/apisAndHooks/userAPI/UserConnectToSlack.tsx';
import UserDisconnectSlackWorkspace from 'docs/server/routes/apisAndHooks/userAPI/UserDisconnectSlackWorkspace.tsx';
import UserSearchUsers from 'docs/server/routes/apisAndHooks/userAPI/UserSearchUsers.tsx';

const uri = '/js-apis-and-hooks/user-api';
const title = 'User API';
const subtitle =
  "The user API offers information about users that you've synced to Cord.";

const navItems = [
  {
    name: UserObserveUserData.title,
    linkTo: UserObserveUserData.uri,
    description: UserObserveUserData.subtitle,
    component: <UserObserveUserData.Element />,
  },
  {
    name: UserObserveViewerData.title,
    linkTo: UserObserveViewerData.uri,
    description: UserObserveViewerData.subtitle,
    component: <UserObserveViewerData.Element />,
  },
  {
    name: UserSetNotificationPreferences.title,
    linkTo: UserSetNotificationPreferences.uri,
    description: UserSetNotificationPreferences.subtitle,
    component: <UserSetNotificationPreferences.Element />,
  },
  {
    name: UserObserveOrgMembers.title,
    linkTo: UserObserveOrgMembers.uri,
    description: UserObserveOrgMembers.subtitle,
    component: <UserObserveOrgMembers.Element />,
  },
  {
    name: UserConnectToSlack.title,
    linkTo: UserConnectToSlack.uri,
    description: UserConnectToSlack.subtitle,
    component: <UserConnectToSlack.Element />,
  },
  {
    name: UserDisconnectSlackWorkspace.title,
    linkTo: UserDisconnectSlackWorkspace.uri,
    description: UserDisconnectSlackWorkspace.subtitle,
    component: <UserDisconnectSlackWorkspace.Element />,
  },
  {
    name: UserSearchUsers.title,
    linkTo: UserSearchUsers.uri,
    description: UserSearchUsers.subtitle,
    component: <UserSearchUsers.Element />,
  },
];

function UserAPI() {
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
  Element: UserAPI,
  navItems,
};
