import type { PropsWithChildren } from 'react';
import { createUseStyles } from 'react-jss';
import { ZINDEX } from 'common/ui/zIndex.ts';
import { Styles } from 'common/const/Styles.ts';
import { cssVar } from 'common/ui/cssVariables.ts';

const useStyles = createUseStyles({
  overlayOverSidebar: {
    bottom: 0,
    position: 'fixed',
    right: 0,
    top: cssVar('sidebar-top'),
    width: cssVar('sidebar-width'),
    zIndex: ZINDEX.popup,
    background: Styles.MODAL_BACKGROUND_COLOR_LIGHT,
  },
});

export function SidebarOverlay({ children }: PropsWithChildren<unknown>) {
  const classes = useStyles();

  return <div className={classes.overlayOverSidebar}>{children}</div>;
}
