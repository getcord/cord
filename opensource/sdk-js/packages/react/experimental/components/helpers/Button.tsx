import * as React from 'react';
import cx from 'classnames';
import { forwardRef } from 'react';

import { Icon } from '../../../components/helpers/Icon.js';
import type { IconType } from '../../../components/helpers/Icon.js';
import withCord from '../hoc/withCord.js';
import { MODIFIERS } from '../../../common/ui/modifiers.js';
import type { StyleProps } from '../../../betaV2.js';
import type { MandatoryReplaceableProps } from '../replacements.js';
import classes from './Button.css.js';

export type CommonButtonProps = {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  onMouseEnter?: React.MouseEventHandler<HTMLButtonElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLButtonElement>;
  onFocus?: React.FocusEventHandler<HTMLButtonElement>;
  onBlur?: React.FocusEventHandler<HTMLButtonElement>;
  children?: React.ReactNode;
  id?: string;
};

export type GeneralButtonProps = {
  buttonAction: string;
  icon?: IconType | URL;
} & StyleProps &
  MandatoryReplaceableProps &
  CommonButtonProps;

export const Button = withCord<React.PropsWithChildren<GeneralButtonProps>>(
  forwardRef(function Button(
    props: GeneralButtonProps,
    ref: React.Ref<HTMLButtonElement>,
  ) {
    const { buttonAction, icon, children, className, ...otherProps } = props;

    if (!children && !icon) {
      return null;
    }

    return (
      <button
        data-cord-button={buttonAction}
        aria-label={buttonAction.replaceAll('-', ' ')}
        type="button"
        {...otherProps}
        className={cx(
          className,
          {
            [MODIFIERS.disabled]: otherProps.disabled,
            [classes.icon]: !!icon,
            [classes.text]: !!children,
          },
          classes.button,
        )}
        ref={ref}
      >
        {icon instanceof URL ? (
          <img className={classes.buttonIcon} src={icon.toString()} />
        ) : (
          icon && <Icon name={icon} />
        )}
        {children && <p className={cx(classes.buttonLabel)}>{children}</p>}
      </button>
    );
  }),
  'Button',
);
