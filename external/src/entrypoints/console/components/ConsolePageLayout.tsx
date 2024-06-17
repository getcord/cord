import type { PropsWithChildren, ReactNode } from 'react';
import { Helmet } from 'react-helmet';
import { createUseStyles } from 'react-jss';
import type { AppBarProps, DrawerProps } from '@material-ui/core';
import { AppBar, Drawer } from '@material-ui/core';
import { Colors } from 'common/const/Colors.ts';
import {
  DRAWER_WIDTH,
  TOOLBAR_HEIGHT,
} from 'external/src/entrypoints/console/const.ts';
import { Sizes } from 'common/const/Sizes.ts';

const useStyles = createUseStyles({
  appBar: {
    alignItems: 'end',
    backgroundColor: Colors.WHITE,
    height: TOOLBAR_HEIGHT + 'px',
    justifyContent: 'center',
    width: `100%`,
    boxShadow: 'none',
    borderBottom: `1px solid ${Colors.GREY_LIGHT}`,
  },
  content: {
    backgroundColor: Colors.WHITE,
    flexGrow: 1,
    margin: Sizes.XLARGE,
    overflow: 'hidden',
  },
  toolbarSpacer: {
    minHeight: TOOLBAR_HEIGHT + 'px',
  },
  wrapper: {
    backgroundColor: Colors.WHITE,
    display: 'flex',
  },
  drawer: {
    flexShrink: 0,
    width: DRAWER_WIDTH + 'px',
  },
  drawerPaper: {
    backgroundColor: Colors.WHITE,
    color: Colors.BRAND_PRIMARY,
    width: DRAWER_WIDTH + 'px',
  },
});

type ConsolePageLayoutProps = {
  helmetTitle?: string;
};

export function ConsolePageWrapper({
  helmetTitle,
  children,
}: PropsWithChildren<ConsolePageLayoutProps>) {
  const classes = useStyles();
  return (
    <div className={classes.wrapper}>
      {helmetTitle && (
        <Helmet>
          <title>{helmetTitle}</title>
        </Helmet>
      )}
      {children}
    </div>
  );
}

export function ConsoleAppMainContent({ children }: { children: ReactNode }) {
  const classes = useStyles();
  return (
    <main className={classes.content}>
      <div className={classes.toolbarSpacer} />
      {children}
    </main>
  );
}

type ConsoleAppDrawerProps = {
  variant?: DrawerProps['variant'];
  anchor?: DrawerProps['anchor'];
  open?: DrawerProps['open'];
};

export function ConsoleAppDrawer({
  variant = 'permanent',
  anchor = 'left',
  open = true,
  children,
}: React.PropsWithChildren<ConsoleAppDrawerProps>) {
  const classes = useStyles();
  return (
    <Drawer
      className={classes.drawer}
      variant={variant}
      open={open}
      classes={{ paper: classes.drawerPaper }}
      anchor={anchor}
    >
      {children}
    </Drawer>
  );
}

export function ConsoleAppBar({
  position = 'fixed',
  children,
}: React.PropsWithChildren<AppBarProps>) {
  const classes = useStyles();
  return (
    <AppBar position={position} className={classes.appBar}>
      {children}
    </AppBar>
  );
}
