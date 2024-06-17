import { List, ListItemText, Toolbar, Link, Divider } from '@material-ui/core';
import { ListItemButton } from '@mui/material';
import {
  ArrowTopRightOnSquareIcon,
  BookOpenIcon,
  ClipboardDocumentIcon,
  SquaresPlusIcon,
  WrenchScrewdriverIcon,
  BoltIcon,
  Cog8ToothIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  ChatBubbleLeftIcon,
  BriefcaseIcon,
  UserGroupIcon,
} from '@heroicons/react/20/solid';
import { Route, Link as RouterLink, Routes } from 'react-router-dom';
import { createUseStyles } from 'react-jss';
import { useAuth0 } from '@auth0/auth0-react';
import cx from 'classnames';

import {
  ConsoleApplicationRoutes,
  ConsoleRoutes,
  getBaseApplicationURL,
  getBaseGettingStartedURL,
  getBaseSettingsURL,
} from 'external/src/entrypoints/console/routes.ts';
import LoginButton from 'external/src/entrypoints/console/components/LoginButton.tsx';
import { Colors } from 'common/const/Colors.ts';
import { ProfilePictureWithMenu } from 'external/src/entrypoints/console/components/ProfilePictureWithMenu.tsx';
import { COMMUNITY_ORIGIN, DOCS_ORIGIN } from 'common/const/Urls.ts';
import { CustomerInfoContext } from 'external/src/entrypoints/console/contexts/CustomerInfoProvider.tsx';
import { useFeatureFlag } from 'external/src/effects/useFeatureFlag.ts';
import { FeatureFlags } from 'common/const/FeatureFlags.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import type { LayoutProps } from 'external/src/entrypoints/console/components/Layout.tsx';
import SidebarNavLink from 'external/src/entrypoints/console/components/SidebarNavLink.tsx';
import {
  ConsoleApplicationContext,
  ConsoleApplicationContextProvider,
} from 'external/src/entrypoints/console/contexts/ConsoleApplicationContextProvider.tsx';
import { ApplicationSelector } from 'external/src/entrypoints/console/components/ApplicationSelector.tsx';
import {
  ConsoleAppBar,
  ConsoleAppDrawer,
  ConsoleAppMainContent,
  ConsolePageWrapper,
} from 'external/src/entrypoints/console/components/ConsolePageLayout.tsx';
import { ConsoleSetupContext } from 'external/src/entrypoints/console/contexts/ConsoleSetupProvider.tsx';
import { TopLeftLogo } from 'external/src/entrypoints/console/components/TopLeftLogo.tsx';

export const DRAWER_WIDTH = 256;
export const TOOLBAR_HEIGHT = 68;

const useStyles = createUseStyles({
  wordmark: {
    height: '36px',
    width: 'auto',
  },
  toolbarContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
  },
  logoBox: {
    minHeight: TOOLBAR_HEIGHT + 'px',
    display: 'flex',
    alignItems: 'center',
    paddingInlineStart: '24px',
  },
  logoBoxBorder: {
    borderBottom: `1px solid ${Colors.GREY_LIGHT}`,
  },
  logoLinkWrapper: {
    alignItems: 'center',
    display: 'flex',
  },
  list: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  listItem: {
    '&:hover, &$selected, &$selected:hover': {
      backgroundColor: Colors.BRAND_PURPLE_LIGHT,
      borderRadius: '4px',
      color: Colors.BRAND_PURPLE_DARK,
    },
    borderRadius: '4px',
    padding: '8px',
  },
  nestedList: {
    width: '85%',
    alignSelf: 'end',
  },
  docsLink: {
    flex: 'none',
  },
  externalLinkIcon: {
    width: '16px',
    marginLeft: '4px',
  },
  listDivider: {
    margin: '12px 0',
  },
  listIcon: {
    color: 'inherit',
  },
  selected: {},
  heroIcon: {
    width: '20px',
    marginRight: '8px',
  },
});

function ApplicationSidebarSection() {
  const classes = useStyles();
  const isLandingPageEnabledInConsole = useFeatureFlag(
    FeatureFlags.SHOW_CONSOLE_LANDING_PAGE,
  );

  const { id } = useContextThrowingIfNoProvider(ConsoleApplicationContext);

  return (
    <div className={classes.nestedList}>
      <ApplicationSelector />
      {id && (
        <>
          {isLandingPageEnabledInConsole && (
            <ListItemButton
              classes={{
                root: classes.listItem,
              }}
              activeClassName={classes.selected}
              component={SidebarNavLink}
              to={getBaseGettingStartedURL(id)}
            >
              <BoltIcon className={classes.heroIcon} />
              <ListItemText primary="Getting started" />
            </ListItemButton>
          )}
          <ListItemButton
            classes={{
              root: classes.listItem,
            }}
            activeClassName={classes.selected}
            component={SidebarNavLink}
            to={getBaseSettingsURL(id)}
          >
            <WrenchScrewdriverIcon className={classes.heroIcon} />
            <ListItemText primary="Configuration" />
          </ListItemButton>{' '}
          <ListItemButton
            classes={{
              root: classes.listItem,
            }}
            activeClassName={classes.selected}
            component={SidebarNavLink}
            to={`${getBaseApplicationURL(id)}/${
              ConsoleApplicationRoutes.APPLICATION_ORGS
            }`}
          >
            <BriefcaseIcon className={classes.heroIcon} />
            <ListItemText primary="Groups" />
          </ListItemButton>
          <ListItemButton
            classes={{
              root: classes.listItem,
            }}
            activeClassName={classes.selected}
            component={SidebarNavLink}
            to={`${getBaseApplicationURL(id)}/${
              ConsoleApplicationRoutes.APPLICATION_USERS
            }`}
          >
            <UserIcon className={classes.heroIcon} />
            <ListItemText primary="Users" />
          </ListItemButton>
          <ListItemButton
            classes={{
              root: classes.listItem,
            }}
            activeClassName={classes.selected}
            component={SidebarNavLink}
            to={`${getBaseApplicationURL(id)}/${
              ConsoleApplicationRoutes.APPLICATION_MESSAGES
            }`}
          >
            <ChatBubbleLeftIcon className={classes.heroIcon} />
            <ListItemText primary="Messages" />
          </ListItemButton>
          <ListItemButton
            classes={{
              root: classes.listItem,
            }}
            activeClassName={classes.selected}
            component={SidebarNavLink}
            to={`${getBaseApplicationURL(id)}/${
              ConsoleApplicationRoutes.APPLICATION_THREADS
            }`}
          >
            <ChatBubbleLeftRightIcon className={classes.heroIcon} />
            <ListItemText primary="Threads" />
          </ListItemButton>
        </>
      )}
    </div>
  );
}

export default function LayoutLoaded({
  title,
  children,
}: React.PropsWithChildren<LayoutProps>) {
  const classes = useStyles();
  const { user, isAuthenticated } = useAuth0();

  const { customerID } = useContextThrowingIfNoProvider(CustomerInfoContext);
  const isExistingCustomerUser = customerID !== null;

  const { setupProgress } = useContextThrowingIfNoProvider(ConsoleSetupContext);

  const showIssues = useFeatureFlag(
    FeatureFlags.SHOW_CUSTOMER_ISSUES_IN_CONSOLE,
  );

  const showCommunityLink = useFeatureFlag(
    FeatureFlags.SHOW_COMMUNITY_IN_CONSOLE,
  );

  const isLandingPageEnabledInConsole = useFeatureFlag(
    FeatureFlags.SHOW_CONSOLE_LANDING_PAGE,
  );
  const isDrawerHidden =
    isLandingPageEnabledInConsole && setupProgress === 'not_started';

  // Don't show layout if we're going to redirect to Auth0
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <ConsoleApplicationContextProvider>
      <ConsolePageWrapper helmetTitle={title}>
        <ConsoleAppBar>
          <div className={classes.toolbarContainer}>
            <div className={classes.logoBox}>
              <Link
                component={RouterLink}
                to={ConsoleRoutes.HOME}
                className={classes.logoLinkWrapper}
              >
                <TopLeftLogo />
              </Link>
            </div>
            <Toolbar>
              {user ? (
                <ProfilePictureWithMenu
                  name={user?.name}
                  email={user?.email}
                  pictureURL={user?.picture}
                />
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <LoginButton type="signup" />
                  <LoginButton />
                </div>
              )}
            </Toolbar>
          </div>
        </ConsoleAppBar>
        {!isDrawerHidden && (
          <ConsoleAppDrawer>
            <div className={cx(classes.logoBox, classes.logoBoxBorder)}>
              <Link
                component={RouterLink}
                to={ConsoleRoutes.HOME}
                className={classes.logoLinkWrapper}
              >
                <TopLeftLogo />
              </Link>
            </div>
            <List className={classes.list}>
              <ListItemButton
                classes={{
                  root: classes.listItem,
                }}
                activeClassName={classes.selected}
                end
                component={SidebarNavLink}
                to={ConsoleRoutes.PROJECTS}
              >
                <SquaresPlusIcon className={classes.heroIcon} />
                <ListItemText primary="Projects" />
              </ListItemButton>

              <Routes>
                <Route
                  path={`${ConsoleRoutes.PROJECT}/*`}
                  element={<ApplicationSidebarSection />}
                />
                <Route path={'*'} element={null} />
              </Routes>

              <Divider className={classes.listDivider} />

              {isExistingCustomerUser && (
                <ListItemButton
                  classes={{
                    root: classes.listItem,
                  }}
                  activeClassName={classes.selected}
                  component={SidebarNavLink}
                  to={ConsoleRoutes.SETTINGS}
                >
                  <Cog8ToothIcon className={classes.heroIcon} />
                  <ListItemText primary="Settings" />
                </ListItemButton>
              )}

              {showIssues && (
                <ListItemButton
                  classes={{
                    root: classes.listItem,
                  }}
                  activeClassName={classes.selected}
                  component={SidebarNavLink}
                  to={ConsoleRoutes.ISSUES}
                >
                  <ClipboardDocumentIcon className={classes.heroIcon} />
                  <ListItemText primary="Support" />
                </ListItemButton>
              )}

              <ListItemButton
                classes={{
                  root: classes.listItem,
                  selected: classes.selected,
                }}
                component="a"
                href={DOCS_ORIGIN}
                target="_blank"
              >
                <BookOpenIcon className={classes.heroIcon} />
                <ListItemText primary="Docs" className={classes.docsLink} />
                <ArrowTopRightOnSquareIcon
                  className={classes.externalLinkIcon}
                />
              </ListItemButton>

              {showCommunityLink && (
                <ListItemButton
                  classes={{
                    root: classes.listItem,
                    selected: classes.selected,
                  }}
                  component="a"
                  href={`${COMMUNITY_ORIGIN}?silent_login=true`}
                  target="_blank"
                >
                  <UserGroupIcon className={classes.heroIcon} />
                  <ListItemText
                    primary="Community"
                    className={classes.docsLink}
                  />
                  <ArrowTopRightOnSquareIcon
                    className={classes.externalLinkIcon}
                  />
                </ListItemButton>
              )}
            </List>
          </ConsoleAppDrawer>
        )}
        <ConsoleAppMainContent>{children}</ConsoleAppMainContent>
      </ConsolePageWrapper>
    </ConsoleApplicationContextProvider>
  );
}
