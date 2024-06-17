import { useEffect, useMemo, useState } from 'react';

import { ResizeObserverContext } from 'external/src/context/resizeObserver/ResizeObserverContext.ts';
import { useElementCallbackRef } from 'external/src/effects/useElementCallbackRef.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

function useDimensionTracker<E extends HTMLElement = HTMLElement>(args?: {
  disabled: boolean;
}) {
  const ref = useElementCallbackRef<E>();

  const { observeElement, unobserveElement } = useContextThrowingIfNoProvider(
    ResizeObserverContext,
  );
  const [width, setWidth] = useState<number>();
  const [height, setHeight] = useState<number>();

  useEffect(() => {
    const element: E | null = ref.current;
    if (!element || args?.disabled) {
      return;
    }
    observeElement(element, () => {
      setWidth(element.clientWidth);
      setHeight(element.clientHeight);
    });
    return () => {
      unobserveElement(element);
    };
  }, [args?.disabled, observeElement, ref, unobserveElement]);

  return useMemo(() => ({ ref, width, height }), [ref, width, height]);
}

export function useWidthTracker<E extends HTMLElement = HTMLElement>(args?: {
  disabled: boolean;
}) {
  const { width, ref } = useDimensionTracker<E>(args);
  return useMemo(() => [ref, width] as const, [ref, width]);
}

export function useHeightTracker<E extends HTMLElement = HTMLElement>(args?: {
  disabled: boolean;
}) {
  const { height, ref } = useDimensionTracker<E>(args);
  return useMemo(() => [ref, height] as const, [ref, height]);
}
