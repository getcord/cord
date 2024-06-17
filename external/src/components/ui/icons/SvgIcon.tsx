import * as React from 'react';
import { useMemo } from 'react';
import cx from 'classnames';
import { createUseStyles } from 'react-jss';

import { Sizes } from 'common/const/Sizes.ts';
import type { SpacingSize } from 'common/const/Spacing.ts';
import { spacingToCssString } from 'common/const/Spacing.ts';

// SvgIcon is used as the base component that our icon components call
// To add an icon:
// - Export the icon from figma. Check that it is 24x24 and the svg fill is transparent
//   - If icon isn't 24x24, preferable solution is to get 24x24 one from Tom
//   - In meantime can just pass the different viewbox via props
// - Run it through https://react-svgr.com/playground/?typescript=true to
//   react-ify property names and shorten
// - Create the Icon using <SvgIcon>[what you got from react-svgr]</SvgIcon>
// - You should set fill and stroke using classes from useSvgIcon
// See existing icons for examples
// For material icons, you can also use the MaterialIcon component but we are
// trending away from that

type IconSize = 'default' | 'small' | 'x-small' | number;

type StyleProps = {
  margin?: SpacingSize;
  padding?: SpacingSize;
  size?: IconSize;
};

const useStyles = createUseStyles({
  svg: ({ margin, padding, size }: StyleProps) => {
    const iconSize =
      size === 'default'
        ? Sizes.DEFAULT_ICON_SIZE
        : size === 'small'
        ? Sizes.SMALL_ICON_SIZE
        : size === 'x-small'
        ? Sizes.X_SMALL_ICON_SIZE
        : size;
    return {
      display: 'block',
      ...(margin && { margin: spacingToCssString(margin) }),
      ...(padding && { padding: spacingToCssString(padding) }),
      ...(size && { width: iconSize, height: iconSize }),
    };
  },
  svgCursorPointer: {
    cursor: 'pointer',
  },
});

export type BaseSvgIconProps = StyleProps & React.SVGProps<SVGSVGElement>;

export function SvgIcon({
  size = 'default',
  margin,
  padding,
  className,
  children,
  ...otherProps
}: BaseSvgIconProps) {
  const styleProps: StyleProps = useMemo(
    () => ({
      size,
      margin,
      padding,
    }),
    [margin, padding, size],
  );
  const classes = useStyles(styleProps);

  // We use vectorEffect to stop strokeWidths scaling with size
  // We add via clone so we don't have to always remember to provide it
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cx(
        classes.svg,
        {
          [classes.svgCursorPointer]: Boolean(otherProps.onClick),
        },
        className,
      )}
      {...otherProps}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as any, {
              // eslint-disable-next-line i18next/no-literal-string
              vectorEffect: 'non-scaling-stroke',
            })
          : child,
      )}
    </svg>
  );
}
