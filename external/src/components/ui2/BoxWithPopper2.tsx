import { useCallback, useEffect, useMemo, useRef } from 'react';
import { createUseStyles } from 'react-jss';
import type { Placement } from '@floating-ui/react-dom';

import { Slot } from '@radix-ui/react-slot';
import type { PopperPosition } from 'common/types/index.ts';
import { ZINDEX } from 'common/ui/zIndex.ts';
import { useUpdatingRef } from 'external/src/effects/useUpdatingRef.ts';
import { usePopperCreator } from 'external/src/effects/usePopperCreator.ts';
import type { Box2Props } from 'external/src/components/ui2/Box2.tsx';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { useWidthTracker } from 'external/src/effects/useDimensionTracker.ts';
import { useClickOutside } from 'external/src/effects/useClickOutside.ts';

const DEFAULT_POSITION: PopperPosition = 'top';

const useStyles = createUseStyles({
  blockingOverlay: {
    bottom: 0,
    cursor: 'auto',
    left: 0,
    position: 'fixed',
    right: 0,
    top: 0,
    zIndex: ZINDEX.popup,
  },
});

type Props = Box2Props & {
  popperElement: JSX.Element | null;
  popperElementVisible: boolean;
  popperPosition?: PopperPosition | undefined;
  forwardRef?: React.MutableRefObject<HTMLDivElement | undefined | null>;
  popperWidth?: number | 'full';
  onShouldHide?: () => unknown;
  withBlockingOverlay?: boolean;
  offset?: number | ((placement: Placement) => number);
  asChild?: boolean;
};

/**
 * @deprecated use ui3/WithPopper instead
 */
export function BoxWithPopper2({
  children,
  popperElement,
  popperElementVisible,
  forwardRef,
  popperWidth,
  popperPosition = DEFAULT_POSITION,
  onShouldHide,
  withBlockingOverlay = false,
  offset = 0,
  asChild,
  ...divProps
}: Props) {
  const classes = useStyles();

  const [boxRef, boxWidth] = useWidthTracker<HTMLDivElement>({
    disabled: popperWidth !== 'full',
  });

  const additionalPopperStyle = useMemo(() => {
    if (!popperWidth) {
      return {};
    }
    if (popperWidth === 'full') {
      return { width: boxWidth };
    } else {
      return { width: popperWidth };
    }
  }, [popperWidth, boxWidth]);

  const {
    styles: popperStyles,
    setReferenceElement: _setReferenceElement,
    setPopperElement: _setPopperElement,
    update,
  } = usePopperCreator({ popperPosition, offset });

  const popperRef = useRef<HTMLDivElement | null>(null);
  const setPopperElement = useCallback<React.RefCallback<HTMLDivElement>>(
    (element) => {
      popperRef.current = element;
      _setPopperElement(element);
    },
    [_setPopperElement],
  );
  const setReferenceElement = useCallback<React.RefCallback<HTMLDivElement>>(
    (element) => {
      boxRef.current = element;
      if (forwardRef) {
        forwardRef.current = element;
      }
      _setReferenceElement(element);
    },
    [_setReferenceElement, boxRef, forwardRef],
  );

  // TODO should this part below, including the useClickOutside
  // be part of Dropdown2 instead of being in here?
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

  const refProps = useMemo(
    () =>
      asChild
        ? { ref: setReferenceElement }
        : { forwardRef: setReferenceElement },
    [asChild, setReferenceElement],
  );
  const Comp = asChild ? Slot : Box2;

  const PopperElement = (
    <>
      {withBlockingOverlay && (
        <div className={classes.blockingOverlay} ref={overlayRef} />
      )}
      <div
        ref={setPopperElement}
        style={{
          ...additionalPopperStyle,
          ...popperStyles,
          zIndex: ZINDEX.popup,
        }}
      >
        {popperElement}
      </div>
    </>
  );

  return (
    <>
      <Comp {...refProps} {...divProps}>
        {children}
      </Comp>
      {popperElementVisible && PopperElement}
    </>
  );
}
