import * as React from 'react';
import cx from 'classnames';
import { Icon } from '../../../components/helpers/Icon.js';

import classes from '../../../components/helpers/Icon.css.js';

type Props = {
  size?: 'small' | 'large';
  className?: string;
};

export function SpinnerIcon({ size, className }: Props) {
  return (
    <Icon
      className={cx(className, classes.spinnerIcon, classes.icon)}
      name="CircleNotch"
      size={size ?? 'large'}
      aria-label="loading"
      aria-busy="true"
      aria-live="polite"
    />
  );
}
