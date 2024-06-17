import { useMemo } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import type {
  CSSVariable,
  WithCSSVariableOverrides,
} from 'common/ui/cssVariables.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';

const BADGE_TEXT_SIZE = '10px';

type BadgeOnly = {
  style: 'badge';
  count?: number;
  className?: string;
};

type BadgeWithCount = {
  style: 'badge_with_count';
  count: number;
  className?: string;
};

export type BadgeProps = WithCSSVariableOverrides<
  BadgeOnly | BadgeWithCount,
  Badge2CSSVariablesOverride
>;

const useStyles = createUseStyles({
  baseBadgeContainer: {
    alignItems: 'center',
    display: 'inline-flex',
    justifyContent: 'center',
  },
  badgeWithSingleDigitCountContainer: {
    width: cssVar('space-m'),
  },
  badgeWithCountContainer: {
    minWidth: cssVar('space-m'),
  },
  badgeOnlyContainer: {
    minWidth: cssVar('space-xs'),
  },
  badgeCount: {
    fontSize: BADGE_TEXT_SIZE,
    lineHeight: BADGE_TEXT_SIZE,
  },
});

export type Badge2CSSVariablesOverride = Partial<{
  backgroundColor: CSSVariable;
  textColor: CSSVariable;
}>;

/**
 * @deprecated use ui3/WithBadge instead
 */
export function Badge2(props: BadgeProps) {
  const classes = useStyles();

  const { style } = props;

  const isSingleDigit = useMemo(() => {
    if (props.count) {
      return props.count <= 9;
    }
    return false;
  }, [props.count]);

  if (props.count !== undefined && props.count < 1) {
    return null;
  }

  return (
    <Box2
      className={cx(classes.baseBadgeContainer, props.className, {
        [classes.badgeOnlyContainer]: style === 'badge',
        [classes.badgeWithCountContainer]: style === 'badge_with_count',
        [classes.badgeWithSingleDigitCountContainer]:
          style === 'badge_with_count' && isSingleDigit,
      })}
      backgroundColor="notification"
      borderColor="base"
      height={style === 'badge' ? 'xs' : 'm'}
      paddingHorizontal={'3xs'}
      borderRadius="large"
      cssVariablesOverride={{
        backgroundColor: props.cssVariablesOverride?.backgroundColor,
      }}
    >
      {style === 'badge_with_count' && props.count && (
        <Text2
          color="base"
          className={classes.badgeCount}
          cssVariablesOverride={{
            color: props.cssVariablesOverride?.textColor,
          }}
        >
          {isSingleDigit ? props.count : '9+'}
        </Text2>
      )}
    </Box2>
  );
}
