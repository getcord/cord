import * as React from 'react';
import cx from 'classnames';
import type { ForwardedRef } from 'react';
import { Portal } from 'external/src/components/Portal.tsx';
import * as classes from 'external/src/components/ui3/Overlay.css.ts';
import { imageModalOverlay } from '@cord-sdk/react/components/MediaModal.classnames.ts';

type OverlayProps = React.PropsWithChildren<{
  onClick?: () => void;
}>;

export const Overlay = React.forwardRef(function Overlay(
  { children, onClick }: OverlayProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  return (
    <Portal>
      <div
        className={cx(classes.overlay, imageModalOverlay)}
        onClick={onClick}
        ref={ref}
      >
        {children}
      </div>
    </Portal>
  );
});
