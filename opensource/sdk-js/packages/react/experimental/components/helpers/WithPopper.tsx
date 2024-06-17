import * as React from 'react';
import type {
  DetailedHTMLProps,
  ForwardedRef,
  HTMLAttributes,
  PropsWithChildren,
} from 'react';
import { forwardRef, useEffect, useRef } from 'react';
import type { Placement } from '@floating-ui/react-dom';

import { Slot } from '@radix-ui/react-slot';
import type { PopperPosition } from '../../../types.js';
import { usePopperCreator } from '../../../hooks/usePopperCreator.js';
import { useClickOutside } from '../../../common/effects/useClickOutside.js';
import { useUpdatingRef } from '../../../common/effects/useUpdatingRef.js';
import classes from '../../../components/helpers/WithPopper.css.js';
import { ZINDEX } from '../../../common/ui/zIndex.js';
import { useComposedRefs } from '../../../common/lib/composeRefs.js';

const DEFAULT_POSITION: PopperPosition = 'top';

export type WithPopperProps = PropsWithChildren<
  {
    popperElement: JSX.Element | null;
    popperElementVisible: boolean;
    popperPosition?: PopperPosition | undefined;
    popperWidth?: number | 'full';
    onShouldHide?: () => unknown;
    withBlockingOverlay?: boolean;
    offset?: number | ((placement: Placement) => number);
  } & DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
>;

export const WithPopper = forwardRef(function WithPopper(
  {
    children,
    popperElement,
    popperElementVisible,
    popperWidth,
    popperPosition = DEFAULT_POSITION,
    onShouldHide,
    withBlockingOverlay = false,
    offset = 0,
    ...divProps
  }: WithPopperProps,
  ref: ForwardedRef<unknown>,
) {
  const {
    styles: popperStyles,
    setReferenceElement,
    setPopperElement,
    update,
  } = usePopperCreator({ popperPosition, offset, popperWidth });
  const popperRef = useRef<HTMLDivElement | null>(null);
  const setPopperElementRef = useComposedRefs<HTMLDivElement | null>(
    setPopperElement,
    popperRef,
  );
  const setPopperTargetElementRef = useComposedRefs(ref, setReferenceElement);

  const onHidePopperRef = useUpdatingRef(onShouldHide);
  useEffect(() => {
    if (!popperElementVisible) {
      return;
    }

    const handleEscapePress = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onHidePopperRef.current) {
        onHidePopperRef.current();
      }
    };
    document.addEventListener('keydown', handleEscapePress);
    return () => {
      document.removeEventListener('keydown', handleEscapePress);
    };
  }, [onHidePopperRef, popperElementVisible, update]);

  const overlayRef = useRef<HTMLDivElement>(null);
  useClickOutside({
    onMouseDown: (event) => {
      event.stopPropagation();
      // Chromium has a bug https://bugs.chromium.org/p/chromium/issues/detail?id=276329
      // DOM changes (such as the overlayRef disappearing) do not trigger `mouseleave/out` events.
      // So we trigger an event manually. We'll catch this event in callsites (e.g. ThreadList).
      // `mouseleave` does not bubble, hence why firing a `mouseout`.
      overlayRef.current?.dispatchEvent(
        new CustomEvent('mouseout', {
          bubbles: true,
          detail:
            // TODO: We should also handle the CustomEvent fired when the `event` happens
            // in an iframe.
            event instanceof MouseEvent
              ? { clientX: event.clientX, clientY: event.clientY }
              : undefined,
        }),
      );
      onShouldHide?.();
    },
    elementRef: popperRef,
    disabled: !popperElementVisible,
    capture: true,
  });

  const PopperElement = (
    <>
      {withBlockingOverlay && (
        <div className={classes.blockingOverlay} ref={overlayRef} />
      )}
      <div
        ref={setPopperElementRef}
        style={{
          ...popperStyles,
          zIndex: ZINDEX.popup,
        }}
        className={classes.popperContainer}
      >
        {popperElement}
      </div>
    </>
  );

  return (
    <>
      <Slot {...divProps} ref={setPopperTargetElementRef}>
        {children}
      </Slot>
      {popperElementVisible && PopperElement}
    </>
  );
});
