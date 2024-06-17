import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import cx from 'classnames';

import { cssVar } from '../../../common/ui/cssVariables.js';
import { MODIFIERS } from '../../../common/ui/modifiers.js';
import { Toast } from './Toast.jsx';
import {
  SUCCESS_POP_UP_TRANSITION_MS,
  SUCCESS_POP_UP_TIMEOUT_MS,
} from './const.js';
import * as classes from './ToastPopup.css.js';

export type ToastSize = 's' | 'l';

type Props = {
  label: string | null;
  setLabel: (label: string | null) => void;
  updateCount: number;
  size: ToastSize;
};

export function ToastPopup({
  label,
  setLabel,
  updateCount,
  size = 'l',
}: Props) {
  const [visible, setVisible] = useState(label !== null);
  const [verticalOffset, setVerticalOffset] = useState(0);

  useEffect(() => {
    let startAnimatingOutTimeout: null | number = null;
    let endAnimatingTimeout: null | number = null;

    // Start animating popup off screen after 3 seconds
    // Set label to null (and opacity to 0) after transition finished
    if (label) {
      setVisible(true);

      startAnimatingOutTimeout = window.setTimeout(() => {
        setVisible(false);
        endAnimatingTimeout = window.setTimeout(() => {
          setLabel(null);
        }, SUCCESS_POP_UP_TRANSITION_MS);
      }, SUCCESS_POP_UP_TIMEOUT_MS);
    } else {
      setVisible(false);
      setVerticalOffset(0);
    }

    // If label is updated (even to same value), clear existing timeouts
    return () => {
      if (startAnimatingOutTimeout) {
        clearTimeout(startAnimatingOutTimeout);
      }
      if (endAnimatingTimeout) {
        clearTimeout(endAnimatingTimeout);
      }
    };
  }, [label, setLabel, updateCount]);

  const onClose = useCallback(() => {
    setVisible(false);
    setLabel(null);
  }, [setLabel]);

  return (
    <Toast
      className={cx(classes.popup, {
        [MODIFIERS.hidden]: !label,
        [classes.smallToast]: size === 's',
      })}
      label={label}
      onClose={onClose}
      style={{
        transform: !visible
          ? undefined
          : `translateY(calc(${verticalOffset}px + ${cssVar('space-m')}))`,
      }}
    />
  );
}
