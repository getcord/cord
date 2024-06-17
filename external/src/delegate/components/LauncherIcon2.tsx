import { createUseStyles } from 'react-jss';
import cx from 'classnames';
import { cssVar } from 'common/ui/cssVariables.ts';
import { Badge2 } from 'external/src/components/ui2/Badge2.tsx';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';

const useStyles = createUseStyles({
  launcherIconWrapper: {
    alignItems: 'center',
    backgroundColor: cssVar('launcher-background-color'),
    borderRadius: 16,
    boxShadow: '0 2px 6px 0 rgba(0, 0, 0, 10%)',
    cursor: 'pointer',
    display: 'flex',
    padding: 10,
    position: 'relative',
    '&:hover': {
      backgroundColor: cssVar('launcher-background-color--hover'),
    },
    '&:hover $launcher': {
      color: cssVar('launcher-content-color--hover'),
    },
    '&:active': {
      backgroundColor: cssVar('launcher-background-color--active'),
    },
    '&:active $launcher': {
      color: cssVar('launcher-content-color--active'),
    },
  },
  launcher: {
    color: cssVar('launcher-content-color'),
    width: 40,
    height: 40,
  },
  launcherIconWrapperWithChildren: {
    paddingLeft: 16,
  },
  launcherIcon: {
    display: 'block',
  },
  badge: {
    alignItems: 'center',
    border: 0,
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    height: cssVar('space-xl'),
    justifyContent: 'center',
    padding: 0,
    position: 'absolute',
    right: -6,
    top: -6,
    width: cssVar('space-xl'),
  },
});

type Props = {
  badgeCount?: number;
};

export function LauncherIcon2({
  badgeCount,
  children,
}: React.PropsWithChildren<Props>) {
  const classes = useStyles();

  return (
    <div
      className={cx(
        classes.launcherIconWrapper,
        Boolean(children) && classes.launcherIconWrapperWithChildren,
      )}
    >
      {children}
      <Icon2 name="Launcher" className={classes.launcher} />
      {badgeCount !== undefined && badgeCount > 0 && (
        <Badge2
          style="badge_with_count"
          count={badgeCount}
          className={classes.badge}
        />
      )}
    </div>
  );
}
