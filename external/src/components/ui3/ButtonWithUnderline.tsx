import cx from 'classnames';

import type { IconType } from 'external/src/components/ui3/icons/Icon.tsx';
import { Icon } from 'external/src/components/ui3/icons/Icon.tsx';

import classes from 'external/src/components/ui3/ButtonWithUnderline.css.ts';

type ButtonProps = {
  /** This helps writing CSS selectors to target the right buttons */
  buttonAction: string;
  label: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => unknown;
  className?: string;
  iconName?: IconType;
  iconPosition?: 'start' | 'end';
  disabled?: boolean;
};

export function ButtonWithUnderline({
  buttonAction,
  label,
  onClick,
  className,
  iconName,
  iconPosition = 'end',
  disabled,
}: ButtonProps) {
  return (
    <button
      data-cord-button={buttonAction}
      onClick={(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.stopPropagation();
        onClick?.(event);
      }}
      className={cx(className, classes.buttonWithUnderline)}
      disabled={disabled}
      type="button"
    >
      {iconName && iconPosition === 'start' && <Icon name={iconName} />}
      <p className={classes.buttonText}>{label}</p>
      {iconName && iconPosition === 'end' && <Icon name={iconName} />}
    </button>
  );
}
