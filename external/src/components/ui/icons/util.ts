import { createUseStyles } from 'react-jss';
import { useMemo } from 'react';
import cx from 'classnames';

import type { Color } from 'common/const/Colors.ts';
import { cssColorFromColorArgument } from 'common/const/Colors.ts';
import type { BaseSvgIconProps } from 'external/src/components/ui/icons/SvgIcon.tsx';

export type SvgIconProps = BaseSvgIconProps &
  SvgIconStyleProps & { part?: string };

type SvgIconStyleProps = {
  color?: Color | string;
  colorHover?: Color | string;
  secondaryColor?: Color | string;
  secondaryColorHover?: Color | string;
  forceHoverEffects?: boolean;
};

const getHoverStyles = (
  { color, colorHover, secondaryColor, secondaryColorHover }: SvgIconStyleProps,
  pseudo = '',
) => {
  return {
    [`&${pseudo} $fillPrimary`]: {
      fill: cssColorFromColorArgument(colorHover ?? color, 'GREY'),
    },
    [`&${pseudo} $strokePrimary`]: {
      stroke: cssColorFromColorArgument(colorHover ?? color, 'GREY'),
    },
    [`&${pseudo} $fillSecondary`]: {
      fill: cssColorFromColorArgument(
        secondaryColorHover ?? secondaryColor,
        'GREY_DARK',
      ),
    },
    [`&${pseudo} $strokeSecondary`]: {
      stroke: cssColorFromColorArgument(
        secondaryColorHover ?? secondaryColor,
        'GREY_DARK',
      ),
    },
  };
};

// Apply hover effects to elements when svg is hovered
// Can also apply the effects via 'forceHoverEffects' prop - e.g. to use hover state of an ancestor
const useSvgStyles = createUseStyles({
  svg: (styleProps: SvgIconStyleProps) => getHoverStyles(styleProps, ':hover'),
  svgHover: getHoverStyles,

  fillPrimary: ({ color }: SvgIconStyleProps) => ({
    fill: cssColorFromColorArgument(color, 'GREY'),
  }),
  fillSecondary: ({ secondaryColor }: SvgIconStyleProps) => ({
    fill: cssColorFromColorArgument(secondaryColor, 'GREY_DARK'),
  }),
  strokePrimary: ({ color }: SvgIconStyleProps) => ({
    stroke: cssColorFromColorArgument(color, 'GREY'),
  }),
  strokeSecondary: ({ secondaryColor }: SvgIconStyleProps) => ({
    stroke: cssColorFromColorArgument(secondaryColor, 'GREY_DARK'),
  }),
});

// Not expanding
export function useSvgIcon({
  color,
  colorHover,
  secondaryColor,
  secondaryColorHover,
  forceHoverEffects,
  className,
  ...propsToPass
}: SvgIconProps) {
  const styleProps: SvgIconStyleProps = useMemo(
    () => ({
      color,
      colorHover,
      secondaryColor,
      secondaryColorHover,
    }),
    [secondaryColor, secondaryColorHover, color, colorHover],
  );

  const classes = useSvgStyles(styleProps);

  const svgClassName = cx(classes.svg, className, {
    [classes.svgHover]: forceHoverEffects,
  });

  return {
    classes,
    svgIconProps: { ...propsToPass, className: svgClassName },
  };
}
