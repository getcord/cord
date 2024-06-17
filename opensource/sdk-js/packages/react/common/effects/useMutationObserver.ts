import { useEffect, useRef } from 'react';
import { useMemoObject } from '../../hooks/useMemoObject.js';
import { useReffedFn } from '../../hooks/useReffedFn.js';

export function useMutationObserver(
  targetElement: HTMLElement | null,
  callback: MutationCallback,
  options?: MutationObserverInit,
) {
  const optionsMemo = useMemoObject(options);
  const callbackRef = useReffedFn(callback);
  const observerRef = useRef<MutationObserver | null>(null);
  if (observerRef.current === null && typeof MutationObserver !== 'undefined') {
    observerRef.current = new MutationObserver(
      (mutation: MutationRecord[], observer: MutationObserver) =>
        callbackRef(mutation, observer),
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
