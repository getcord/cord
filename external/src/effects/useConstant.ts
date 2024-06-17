import { useRef } from 'react';

const UNINITIALIZED = Symbol('UNINITIALIZED');

/**
 * This will call the init function exactly once, always on the first render,
 * and then return that value for all renders.
 */
export function useConstant<T>(init: () => T): T {
  const ref = useRef<T | typeof UNINITIALIZED>(UNINITIALIZED);
  if (ref.current === UNINITIALIZED) {
    ref.current = init();
  }
  return ref.current;
}
