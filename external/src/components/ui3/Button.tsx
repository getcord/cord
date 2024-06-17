import { forwardRef } from 'react';
import cx from 'classnames';

import { MODIFIERS } from 'common/ui/modifiers.ts';
import type { IconType } from 'external/src/components/ui2/icons/Icon2.tsx';
import { Icon } from 'external/src/components/ui3/icons/Icon.tsx';
import { SpinnerIcon } from '@cord-sdk/react/common/icons/customIcons/SpinnerIcon.tsx';

import classes, { hiddenText } from 'external/src/components/ui3/Button.css.ts';
import { fontBody, fontSmall } from 'common/ui/atomicClasses/fonts.css.ts';

type ButtonType = 'primary' | 'secondary' | 'tertiary';
type ButtonSize = 'small' | 'medium' | 'large';

type ButtonTypeProps = {
  icon?: IconType | URL;
  children?: string;
};

type GeneralButtonProps = {
  buttonType: ButtonType;
  /** This helps writing CSS selectors to target the right buttons */
  buttonAction: string;
  disabled?: boolean;
  isLoading?: boolean;
  isSubmit?: boolean;
  size: ButtonSize;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => unknown;
  onMouseLeave?: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => unknown;
  onMouseDown?: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => unknown;
  className?: string;
};

export const Button = forwardRef(function Button(
  props: GeneralButtonProps & ButtonTypeProps,
  ref: React.Ref<HTMLButtonElement>,
) {
  const {
    buttonAction,
    icon,
    children,
    buttonType,
    disabled,
    isLoading = false,
    isSubmit = false,
    size,
    className,
    onClick,
    onMouseDown,
    onMouseLeave,
    ...restProps
  } = props;

  if (!children && !icon) {
    return null;
  }

  return (
    <button
      data-cord-button={buttonAction}
      aria-label={buttonAction.replaceAll('-', ' ')}
      {...restProps}
      className={cx(
        className,
        {
          [classes.colorsPrimary]: buttonType === 'primary',
          [classes.colorsSecondary]: buttonType === 'secondary',
          [classes.colorsTertiary]: buttonType === 'tertiary',
          [MODIFIERS.loading]: isLoading,
          [MODIFIERS.disabled]: disabled,
          [classes.icon]: !!icon,
          [classes.text]: !!children,
        },
        classes.button,
        classes[size],
      )}
      disabled={disabled || isLoading}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseLeave={onMouseLeave}
      part="button"
      ref={ref}
      type={isSubmit ? 'submit' : 'button'}
    >
      {isLoading && <SpinnerIcon size={size === 'small' ? 'small' : 'large'} />}
      {icon instanceof URL ? (
        <img className={classes.buttonIcon} src={icon.toString()} />
      ) : (
        icon && <Icon name={icon} size={size === 'small' ? 'small' : 'large'} />
      )}
      {children && (
        <p
          className={cx(classes.buttonLabel, {
            [hiddenText]: isLoading,
            [fontBody]: size === 'large',
            [fontSmall]: size !== 'large',
          })}
        >
          {children}
        </p>
      )}
    </button>
  );
});
