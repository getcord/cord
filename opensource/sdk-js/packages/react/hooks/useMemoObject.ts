import { useRef } from 'react';
import { isEqual as libIsEqual } from '../common/lib/fast-deep-equal.js';

/**
 * Returns a memoized version of the given complex JS object (such as an array
 * or object).  You can use this to ensure customers passing object or array
 * literals to hooks don't cause unnecessary rerenders.
 */
export function useMemoObject<T>(
  obj: T,
  isEqual: (a: T, b: T) => boolean = libIsEqual,
) {
  const ref = useRef(obj);
  if (ref.current !== obj && !isEqual(ref.current, obj)) {
    ref.current = obj;
  }
  return ref.current;
}
