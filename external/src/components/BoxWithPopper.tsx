import { useEffect, useState, useMemo } from 'react';
import { createUseStyles } from 'react-jss';
import { usePopper } from 'react-popper';
import type { PopperPosition } from 'common/types/index.ts';
import type { BoxProps } from 'external/src/components/ui/Box.tsx';
import { Box } from 'external/src/components/ui/Box.tsx';
import { Portal } from 'external/src/components/Portal.tsx';
import { ZINDEX } from 'common/ui/zIndex.ts';
import { useUpdatingRef } from 'external/src/effects/useUpdatingRef.ts';
import { useClickOutside } from 'external/src/effects/useClickOutside.ts';

const useStyles = createUseStyles({
  modal: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: ZINDEX.popup,
  },
});

const DEFAULT_POSITION: PopperPosition = 'top';

type Props<IsModal extends boolean> = Omit<BoxProps, 'forwardRef'> & {
  popperElement: JSX.Element;
  popperElementVisible: boolean;
  popperPosition?: PopperPosition | undefined;
  additionalPopperStyle?: React.CSSProperties;
  forwardRef?: React.MutableRefObject<HTMLDivElement | undefined | null>;
  gap?: number | ((placement: PopperPosition) => number);
  isModal?: IsModal;
  positioningStrategy?: 'fixed' | 'absolute';
  // React portal seems to be able to create problems in host webpages
  // Current use case for not using it is the tooltip at end of annotation arrow
  // The exact problem was on Datadog: https://radical.phacility.com/D2066#inline-10098
  withoutPortal?: boolean;
  // Conditional props if isModal is true:
} & (IsModal extends true
    ? { closeModal: () => void; blockBackground?: boolean }
    : { closeModal?: undefined; blockBackground?: false });

/**
 * @deprecated use ui3/WithPopper instead
 */
export function BoxWithPopper<IsModal extends boolean = false>({
  children,
  popperElement,
  popperElementVisible,
  additionalPopperStyle,
  forwardRef,
  popperPosition = DEFAULT_POSITION,
  blockBackground = false,
  isModal,
  closeModal,
  gap,
  positioningStrategy = 'fixed',
  withoutPortal,
  ...divProps
}: Props<IsModal>) {
  const classes = useStyles();
  const [reference, _setReference] = useState<HTMLDivElement | null>(null);

  const setReference = (element: HTMLDivElement) => {
    _setReference(element);
    if (forwardRef) {
      forwardRef.current = element;
    }
  };

  const [popper, setPopper] = useState<HTMLDivElement | null>(null);
  const popperRef = useUpdatingRef(popper);

  const customModifier = useMemo(
    () => ({
      name: 'offset',
      options: {
        offset:
          typeof gap !== 'number' && gap
            ? ({ placement }: { placement: PopperPosition }) => [
                0,
                gap(placement),
              ]
            : [0, gap],
      },
    }),
    [gap],
  );

  const { styles, attributes, update } = usePopper(reference, popper, {
    strategy: positioningStrategy,
    placement: popperPosition,
    modifiers: [customModifier],
  });

  useEffect(() => {
    // update the popper if additionalPopperStyles have changed
    if (update) {
      void update();
    }
  }, [update, additionalPopperStyle]);

  const addCloseListeners = Boolean(
    isModal && closeModal && popperElementVisible,
  );
  const closeModalRef = useUpdatingRef(closeModal);
  useEffect(() => {
    if (!addCloseListeners) {
      return;
    }
    const handleEscapePress = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeModalRef.current) {
        closeModalRef.current();
      }
    };
    document.addEventListener('keydown', handleEscapePress);
    return () => {
      document.removeEventListener('keydown', handleEscapePress);
    };
  }, [closeModalRef, addCloseListeners]);

  useClickOutside({
    onMouseDown: (event) => {
      closeModal?.();
      if (blockBackground) {
        event.stopPropagation();
      }
    },
    elementRef: popperRef,
    disabled: !addCloseListeners,
    capture: true,
  });

  const PopperElement = (
    <>
      {isModal && blockBackground && (
        <div data-cord-hide-element className={classes.modal} />
      )}
      <div
        data-cord-hide-element
        ref={setPopper}
        style={{
          ...additionalPopperStyle,
          ...styles.popper,
          zIndex: ZINDEX.popup,
        }}
        {...attributes.popper}
      >
        {popperElement}
      </div>
    </>
  );

  return (
    <>
      <Box {...divProps} forwardRef={setReference}>
        {children}
      </Box>
      {popperElementVisible &&
        (!withoutPortal ? <Portal>{PopperElement}</Portal> : PopperElement)}
    </>
  );
}
