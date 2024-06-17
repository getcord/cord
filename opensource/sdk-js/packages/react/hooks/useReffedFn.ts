import { useCallback } from 'react';
import { useUpdatingRef } from '../common/effects/useUpdatingRef.js';

/**
 * Returns an identity-stable function that will call the most recently-provided
 * version of the function whenever it is called.  This is useful for cases
 * where a function's identity might change (eg, because of a need to close over
 * different objects) but we don't want users of the function to rerender
 * because of it.
 */
export function useReffedFn<F extends (...args: any) => any>(f: F): F {
  const ref = useUpdatingRef(f);
  return useCallback((...args: any) => ref.current(...args), [ref]) as F;
}
