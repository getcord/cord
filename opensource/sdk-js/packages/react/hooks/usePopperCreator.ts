import {
  autoUpdate,
  flip,
  offset as offsetMiddleware,
  shift,
  useFloating,
  size,
} from '@floating-ui/react-dom';
import type { Placement } from '@floating-ui/react-dom';
import { useMemo, useRef } from 'react';
import type { PopperPosition } from '../types.js';

const DEFAULT_POSITION: PopperPosition = 'top';
const DEFAULT_OFFSET = 0;

export type UsePopperCreatorProps = {
  popperPosition?: PopperPosition;
  offset?: number | ((placement: Placement) => number);
  allowFlip?: boolean;
  popperWidth?: number | 'full';
};

type Props = UsePopperCreatorProps;

export function usePopperCreator({
  popperPosition = DEFAULT_POSITION,
  offset = DEFAULT_OFFSET,
  allowFlip = true,
  popperWidth,
}: Props) {
  // offset variables are not correctly updated when used inside a function without using a ref.
  // https://floating-ui.com/docs/react#variable-freshness
  const offsetRef = useRef(offset);
  offsetRef.current = offset;

  const {
    x,
    y,
    strategy,
    reference: setReferenceElement,
    floating: setPopperElement,
    update,
  } = useFloating({
    strategy: 'fixed',
    whileElementsMounted: autoUpdate,
    placement: popperPosition,
    middleware: [
      offsetMiddleware(({ placement }) =>
        typeof offsetRef.current === 'number'
          ? offsetRef.current
          : offsetRef.current(placement),
      ),
      shift({
        padding: 2,
      }),
      ...(allowFlip ? [flip()] : []),
      size({
        apply({ rects, elements }) {
          if (popperWidth) {
            if (popperWidth === 'full') {
              elements.floating.style.setProperty(
                'width',
                `${rects.reference.width}px`,
              );
            } else {
              elements.floating.style.setProperty('width', `${popperWidth}px`);
            }
          }
        },
      }),
    ],
  });
  const styles = useMemo(
    () => ({
      position: strategy,
      top: y ?? '',
      left: x ?? '',
    }),
    [strategy, x, y],
  );

  return { styles, setReferenceElement, setPopperElement, update };
}
