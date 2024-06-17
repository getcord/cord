import { createUseStyles } from 'react-jss';
import cx from 'classnames';
import type { BadgeProps } from 'external/src/components/ui2/Badge2.tsx';
import { Badge2 } from 'external/src/components/ui2/Badge2.tsx';
import { addSpaceVars, cssVar } from 'common/ui/cssVariables.ts';

const useStyles = createUseStyles({
  withBadgeContainer: {
    display: 'inline-block',
    position: 'relative',
  },
  badgeBasePosition: {
    lineHeight: 0,
    pointerEvents: 'none',
    position: 'absolute',
  },
  badgeCountBorderPosition: {
    right: `calc(${addSpaceVars('3xs', '4xs')} * -1)`, // calculates to half the size of badge
    top: `calc(${addSpaceVars('3xs', '4xs')} * -1)`, // calculates to half the size of badge
  },
  badgeOnlyBorderPosition: {
    right: `calc(${cssVar('space-3xs')} * -1)`,
    top: `calc(${cssVar('space-3xs')} * -1)`,
  },
  badgeCountWithinPosition: {
    right: `calc(${cssVar('space-3xs')} - 1px)`,
    top: '-1px', // being 0px - 1px to line up with inner badge rather than border
  },
  badgeOnlyWithinPosition: {
    right: cssVar('space-3xs'),
    top: cssVar('space-3xs'),
  },
});

type BadgePosition = 'bordering_child' | 'within_child';

type Props = BadgeProps & {
  children: JSX.Element;
  badgePosition?: BadgePosition;
};

/**
 * @deprecated use ui3/WithBadge instead
 */
export function WithBadge2({
  children,
  badgePosition = 'bordering_child',
  ...badgeProps
}: Props) {
  const classes = useStyles();

  function getBadgePositionClassName(
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    badgePosition: BadgePosition,
    badgePropsStyle: 'badge' | 'badge_with_count',
  ) {
    if (badgePropsStyle === 'badge_with_count') {
      if (badgePosition === 'bordering_child') {
        return classes.badgeCountBorderPosition;
      } else {
        return classes.badgeCountWithinPosition;
      }
    } else {
      if (badgePosition === 'bordering_child') {
        return classes.badgeOnlyBorderPosition;
      } else {
        return classes.badgeOnlyWithinPosition;
      }
    }
  }

  return (
    <div className={classes.withBadgeContainer}>
      {children}
      <div
        className={cx(
          classes.badgeBasePosition,
          getBadgePositionClassName(badgePosition, badgeProps.style),
        )}
      >
        <Badge2 {...badgeProps} />
      </div>
    </div>
  );
}
