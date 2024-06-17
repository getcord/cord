import * as React from 'react';
import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import cx from 'classnames';

import type { IconType } from '../../../components/helpers/Icon.js';
import { Icon } from '../../../components/helpers/Icon.js';
import classes from './ButtonWithUnderline.css.js';
import { Button } from './Button.js';

type ButtonWithUnderlineProps = {
  /** This helps writing CSS selectors to target the right buttons */
  buttonAction: string;
  label: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => unknown;
  className?: string;
  iconName?: IconType;
  iconPosition?: 'start' | 'end';
} & HTMLAttributes<HTMLButtonElement>;

export const ButtonWithUnderline = forwardRef(function ButtonWithUnderline(
  {
    buttonAction,
    label,
    onClick,
    className,
    iconName,
    iconPosition = 'end',
    ...restProps
  }: ButtonWithUnderlineProps,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  return (
    <Button
      canBeReplaced
      ref={ref}
      buttonAction={buttonAction}
      onClick={onClick}
      className={cx(className, classes.buttonWithUnderline)}
      {...restProps}
    >
      {iconName && iconPosition === 'start' && <Icon name={iconName} />}
      <span className={classes.buttonText}>{label}</span>
      {iconName && iconPosition === 'end' && <Icon name={iconName} />}
    </Button>
  );
});
