import cx from 'classnames';

import { stripStyleProps } from '@cord-sdk/react/common/ui/styleProps.js';
import type { UIProps } from '@cord-sdk/react/common/ui/styleProps.js';
import {
  ALL_ICONS,
  PHOSPHOR_ICONS,
} from '@cord-sdk/react/components/helpers/Icon.tsx';

import classes from 'external/src/components/ui3/icons/Icon.css.ts';

export type IconType = keyof typeof ALL_ICONS;

type IconProps = UIProps<
  'svg',
  'marginPadding' | 'color',
  {
    name: IconType;
    size?: 'small' | 'large';
  }
>;

export function Icon({
  name,
  color = 'content-emphasis',
  size = 'small',
  className,
  ...otherProps
}: IconProps) {
  const { propsExStyleProps: elementProps } = stripStyleProps({
    color,
    ...otherProps,
  });

  const IconComponent = ALL_ICONS[name];

  const isPhosphorIcon = name in PHOSPHOR_ICONS;

  return (
    <IconComponent
      className={cx(
        classes.icon,
        size === 'large' ? classes.large : classes.medium,
        className,
      )}
      weight={isPhosphorIcon ? 'light' : undefined}
      {...elementProps}
    />
  );
}

export const newIcon = {
  NewComp: Icon,
  configKey: 'icon',
} as const;
