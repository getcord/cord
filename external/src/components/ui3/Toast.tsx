import type { CSSProperties } from 'react';
import cx from 'classnames';
import { Button } from 'external/src/components/ui3/Button.tsx';

import * as classes from 'external/src/components/ui3/Toast.css.ts';
import { fontSmall } from 'common/ui/atomicClasses/fonts.css.ts';

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
        buttonType="primary"
        size="small"
        onClick={onClose}
      />
    </div>
  );
}
