import { createUseStyles } from 'react-jss';
import cx from 'classnames';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import type { IconType } from 'external/src/components/ui2/icons/Icon2.tsx';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';

const useStyles = createUseStyles({
  emptyStateContainer: {
    overflow: 'auto',
    flexShrink: 0,
    margin: 'auto 0',
  },
  iconSize: {
    height: cssVar('space-2xl'),
    width: cssVar('space-2xl'),
  },
});

type Props = {
  title: string;
  subtext: string;
  iconName: IconType;
  className?: string;
};

/**
 * @deprecated Please use `ui3/EmptyStateWithIcon.tsx` instead.
 */
export function EmptyStateWithIcon({
  title,
  subtext,
  iconName,
  className,
}: Props) {
  const classes = useStyles();

  return (
    <Box2 padding="xs" className={cx(classes.emptyStateContainer, className)}>
      <Icon2
        name={iconName}
        color="brand-primary"
        marginBottom="2xs"
        className={classes.iconSize}
      />
      <Text2 font="body-emphasis" color="content-emphasis" marginBottom="2xs">
        {title}
      </Text2>
      <Text2 font="body" color="content-primary">
        {subtext}
      </Text2>
    </Box2>
  );
}
