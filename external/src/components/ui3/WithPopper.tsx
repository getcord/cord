import type {
  DetailedHTMLProps,
  ForwardedRef,
  HTMLAttributes,
  PropsWithChildren,
} from 'react';
import { forwardRef, useEffect, useMemo, useRef } from 'react';
import type { Placement } from '@floating-ui/react-dom';

import { Slot } from '@radix-ui/react-slot';
import type { PopperPosition } from 'common/types/index.ts';
import { ZINDEX } from 'common/ui/zIndex.ts';
import { useUpdatingRef } from 'external/src/effects/useUpdatingRef.ts';
import { usePopperCreator } from 'external/src/effects/usePopperCreator.ts';
import { useWidthTracker } from 'external/src/effects/useDimensionTracker.ts';
import { useClickOutside } from 'external/src/effects/useClickOutside.ts';
import { useComposedRefs } from '@cord-sdk/react/common/lib/composeRefs.ts';

import classes from 'external/src/components/ui3/WithPopper.css.ts';

const DEFAULT_POSITION: PopperPosition = 'top';

type Props = PropsWithChildren<
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
  }: Props,
  ref: ForwardedRef<unknown>,
) {
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
    setReferenceElement,
    setPopperElement,
    update,
  } = usePopperCreator({ popperPosition, offset });
  const popperRef = useRef<HTMLDivElement | null>(null);
  const setPopperElementRef = useComposedRefs<HTMLDivElement | null>(
    setPopperElement,
    popperRef,
  );
  const setPopperTargetElementRef = useComposedRefs(
    ref,
    setReferenceElement,
    boxRef,
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

  const PopperElement = (
    <>
      {withBlockingOverlay && (
        <div className={classes.blockingOverlay} ref={overlayRef} />
      )}
      <div
        ref={setPopperElementRef}
        style={{
          ...additionalPopperStyle,
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
