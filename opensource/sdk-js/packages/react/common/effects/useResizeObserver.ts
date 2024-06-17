import { useEffect, useRef } from 'react';
import { useMemoObject } from '../../hooks/useMemoObject.js';
import { useReffedFn } from '../../hooks/useReffedFn.js';

export function useResizeObserver(
  targetElement: HTMLElement | null,
  callback: ResizeObserverCallback,
  options?: ResizeObserverOptions,
) {
  const optionsMemo = useMemoObject(options);
  const callbackRef = useReffedFn(callback);
  const observerRef = useRef<ResizeObserver | null>(null);
  if (observerRef.current === null && typeof ResizeObserver !== 'undefined') {
    observerRef.current = new ResizeObserver(
      (entries: ResizeObserverEntry[], observer: ResizeObserver) =>
        callbackRef(entries, observer),
    );
  }

  useEffect(() => {
    const observer = observerRef.current;
    if (targetElement && observer) {
      observer.observe(targetElement, optionsMemo);
    }

    return () => observer?.disconnect();
  }, [optionsMemo, targetElement]);
}
