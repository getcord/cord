import { useCallback, useEffect, useState } from 'react';
import cx from 'classnames';

import {
  SUCCESS_POP_UP_TIMEOUT_MS,
  SUCCESS_POP_UP_TRANSITION_MS,
} from 'common/const/Timing.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import { Toast } from 'external/src/components/ui3/Toast.tsx';
import { useUpdatingRef } from 'external/src/effects/useUpdatingRef.ts';
import { ComponentContext } from 'external/src/context/component/ComponentContext.tsx';
import {
  FULL_PAGE_MODAL_TOP_OFFSET,
  NAV_IN_FULL_PAGE_MODAL_SIDEBAR_ID,
} from 'external/src/common/strings.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

import * as classes from 'external/src/components/ui3/ToastPopup.css.ts';
import { MODIFIERS } from 'common/ui/modifiers.ts';

export type ToastSize = 's' | 'l';

type Props = {
  label: string | null;
  setLabel: (label: string | null) => void;
  updateCount: number;
  topNavElement: HTMLDivElement | null;
  size: ToastSize;
};

export function ToastPopup({
  label,
  setLabel,
  updateCount,
  topNavElement,
  size = 'l',
}: Props) {
  const [visible, setVisible] = useState(label !== null);
  const [verticalOffset, setVerticalOffset] = useState(0);

  const name = useContextThrowingIfNoProvider(ComponentContext)?.name;

  const topNavRef = useUpdatingRef(topNavElement);

  useEffect(() => {
    let startAnimatingOutTimeout: null | NodeJS.Timeout = null;
    let endAnimatingTimeout: null | NodeJS.Timeout = null;

    // Start animating popup off screen after 3 seconds
    // Set label to null (and opacity to 0) after transition finished
    if (label) {
      setVisible(true);
      const isFullPageModalInSidebar =
        (!name || name === 'cord-sidebar') &&
        topNavRef.current?.id === NAV_IN_FULL_PAGE_MODAL_SIDEBAR_ID;

      if (topNavRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
        const verticalOffset = isFullPageModalInSidebar
          ? topNavRef.current.offsetHeight + FULL_PAGE_MODAL_TOP_OFFSET
          : topNavRef.current.offsetHeight;

        setVerticalOffset(verticalOffset);
      }
      startAnimatingOutTimeout = setTimeout(() => {
        setVisible(false);
        endAnimatingTimeout = setTimeout(() => {
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
  }, [label, name, setLabel, topNavRef, updateCount]);

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

export const newToastPopup = {
  NewComp: ToastPopup,
  configKey: 'toastPopup',
} as const;
