import { Link, useLocation, useMatch } from 'react-router-dom';
import { Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { createUseStyles } from 'react-jss';

import {
  NotificationListLauncher,
  PresenceFacepile,
  SidebarLauncher,
} from '@cord-sdk/react';

import { AdminRoutes } from 'external/src/entrypoints/admin/routes.ts';
import { Sizes } from 'common/const/Sizes.ts';

const ITEMS = {
  [AdminRoutes.HOME]: 'Dashboard',
  [AdminRoutes.CUSTOMERS]: 'Customers',
  [AdminRoutes.APPLICATIONS]: 'Applications',
  [AdminRoutes.ISSUES]: 'Issues',
  [AdminRoutes.WHOIS]: 'Who dis?',
  [AdminRoutes.THREADS]: 'Threads',
  [AdminRoutes.GO]: 'Go',
  [AdminRoutes.BROADCAST_TO_CUSTOMERS]: 'Broadcast',
};

const MORE_ITEMS = {
  [AdminRoutes.ADMIN_USERS]: 'Admins',
  [AdminRoutes.HEIMDALL]: 'Heimdall',
  [AdminRoutes.DEPLOYS]: 'Deploys',
  [AdminRoutes.AUTOMATED_TESTS_TOKEN]: 'e2e Test Repro',
};

const useStyles = createUseStyles({
  pagePresence: {
    '&::part(profile-picture)': {
      width: 32,
      height: 32,
    },
    '&::part(presence-extra-users-label)': {
      color: 'white',
    },
    '--cord-facepile-background-color': '#343a40',
  },
  cordButtonsWrapper: {
    display: 'flex',
    gap: Sizes.MEDIUM,
    marginLeft: 'auto',
    zIndex: 1,
  },
  moreDropdown: {
    // The NavDropdown doesn't properly inherit the dark variant we specify on
    // the Navbar, so we have to override the background colors manually to make
    // it look right
    '& .dropdown-menu': {
      backgroundColor: '#343a40',
    },
    '& .dropdown-item:hover': {
      backgroundColor: '#343a40',
    },
  },
});

export function Navigation() {
  const location = useLocation();
  const issuePageMatch = useMatch(AdminRoutes.ISSUE);

  const classes = useStyles();

  return (
    <Navbar bg="dark" variant="dark">
      <Navbar.Brand href="/">Cord</Navbar.Brand>
      <Nav>
        {Object.entries(ITEMS).map(([route, name]) => (
          <Nav.Link
            as={Link}
            key={route}
            to={route}
            active={location.pathname.startsWith(route)}
          >
            {name}
          </Nav.Link>
        ))}
        <NavDropdown
          title="More"
          id="nav-more"
          className={classes.moreDropdown}
          active={location.pathname in MORE_ITEMS}
        >
          {Object.entries(MORE_ITEMS).map(([route, name]) => (
            <NavDropdown.Item key={route}>
              <Nav.Link
                as={Link}
                to={route}
                active={location.pathname.startsWith(route)}
              >
                {name}
              </Nav.Link>
            </NavDropdown.Item>
          ))}
        </NavDropdown>
      </Nav>
      <div className={classes.cordButtonsWrapper}>
        <NotificationListLauncher />
        {
          // Issues page has a dedicated Cord ThreadList UI
          issuePageMatch ? <></> : <SidebarLauncher />
        }
        <PresenceFacepile className={classes.pagePresence} exactMatch />
      </div>
    </Navbar>
  );
}
