import { useMemo } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';
import type { Color } from 'common/const/Colors.ts';
import { Colors } from 'common/const/Colors.ts';
import { Sizes } from 'common/const/Sizes.ts';
import type { SpacingSize } from 'common/const/Spacing.ts';
import { spacingToCssString } from 'common/const/Spacing.ts';
import { Styles } from 'common/const/Styles.ts';

type StyleProps = {
  backgroundColor?: Color;
  borderColor?: Color;
  margin?: SpacingSize;
  padding?: SpacingSize;
  rounded?: boolean | 'large' | 'small';
  scrollable?: boolean;
  shadow?: boolean;
};

const useStyles = createUseStyles({
  box: ({ backgroundColor, borderColor, margin, padding }: StyleProps) => ({
    ...(backgroundColor && { backgroundColor: Colors[backgroundColor] }),
    ...(borderColor && {
      border: `${Sizes.DEFAULT_BORDER_WIDTH}px solid ${Colors[borderColor]}`,
    }),
    ...(margin && { margin: spacingToCssString(margin) }),
    ...(padding && { padding: spacingToCssString(padding) }),
  }),
  shadow: {
    boxShadow: Styles.DEFAULT_SHADOW,
  },
  scrollable: {
    overflow: 'auto',
  },
  rounded: {
    borderRadius: Sizes.DEFAULT_BORDER_RADIUS,
  },
  roundedLarge: {
    borderRadius: Sizes.LARGE_BORDER_RADIUS,
  },
  roundedSmall: {
    borderRadius: Sizes.SMALL_BORDER_RADIUS,
  },
});

export type BoxProps = Partial<StyleProps> &
  Omit<JSX.IntrinsicElements['div'], 'ref'> & {
    forwardRef?: JSX.IntrinsicElements['div']['ref'];
  };

export function Box(props: React.PropsWithChildren<BoxProps>) {
  const {
    rounded = false,
    scrollable = false,
    shadow = false,
    backgroundColor,
    borderColor,
    margin,
    padding,
    className,
    children,
    forwardRef: ref,
    ...propsToPassDirectly
  } = props;

  const styleProps = useMemo<StyleProps>(
    () => ({
      backgroundColor,
      borderColor,
      margin,
      padding,
    }),
    [backgroundColor, borderColor, margin, padding],
  );

  const classes = useStyles(styleProps);

  return (
    <div
      {...propsToPassDirectly}
      ref={ref}
      className={cx(className, classes.box, {
        [classes.scrollable]: scrollable,
        [classes.shadow]: shadow,
        [classes.roundedLarge]: rounded === 'large',
        [classes.roundedSmall]: rounded === 'small',
        [classes.rounded]: rounded === true,
      })}
    >
      {children}
    </div>
  );
}
