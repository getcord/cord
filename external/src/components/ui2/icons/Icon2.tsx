import cx from 'classnames';
import { createUseStyles } from 'react-jss';

import {
  ALL_ICONS,
  PHOSPHOR_ICONS,
} from '@cord-sdk/react/components/helpers/Icon.tsx';

import { useStyleProps } from 'external/src/components/ui2/useStyleProps.ts';
import { newIcon } from 'external/src/components/ui3/icons/Icon.tsx';
import { withNewCSSComponentMaybe } from 'external/src/components/ui3/withNewComponent.tsx';

import type { UIProps } from '@cord-sdk/react/common/ui/styleProps.ts';

const useStyles = createUseStyles({
  displayBlock: {
    display: 'block',
  },
});

export type IconType = keyof typeof ALL_ICONS;

type IconProps = UIProps<
  'svg',
  'marginPadding' | 'color',
  {
    name: IconType;
    size?: 'small' | 'large';
  }
>;

/**
 * @deprecated Use ui3/Icon instead
 */
export const Icon2 = withNewCSSComponentMaybe(
  newIcon,
  function Icon2({
    name,
    color = 'content-emphasis',
    size = 'small',
    ...otherProps
  }: IconProps) {
    const {
      className,
      width: _width,
      height: _height,
      ...elementProps
    } = useStyleProps({
      color,
      width: size === 'large' ? 'l' : 'm',
      height: size === 'large' ? 'l' : 'm',
      ...otherProps,
    });

    const IconComponent = ALL_ICONS[name];

    const isPhosphorIcon = name in PHOSPHOR_ICONS;

    const classes = useStyles();

    return (
      <IconComponent
        // Display block removes line after svg
        className={cx(className, classes.displayBlock)}
        weight={isPhosphorIcon ? 'light' : undefined}
        {...elementProps}
      />
    );
  },
);
