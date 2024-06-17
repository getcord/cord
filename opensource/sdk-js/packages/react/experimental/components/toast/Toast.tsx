import * as React from 'react';
import type { CSSProperties } from 'react';

import cx from 'classnames';

import { fontSmall } from '../../../common/ui/atomicClasses/fonts.css.js';
import { Button } from '../helpers/Button.js';
import { colorsPrimary } from '../../../../react/components/helpers/Button.classnames.js';
import * as classes from './Toast.css.js';

type Props = {
  label: string | null;
  className?: string;
  onClose?: () => unknown;
  style?: CSSProperties;
};

export function Toast({ label, className, onClose, style }: Props) {
  return (
    <div className={cx(className, classes.toast)} style={style}>
      <p className={cx(classes.label, fontSmall)}>{label}</p>
      <Button
        buttonAction="dismiss-toast"
        icon="X"
        onClick={onClose}
        className={colorsPrimary}
      />
    </div>
  );
}
