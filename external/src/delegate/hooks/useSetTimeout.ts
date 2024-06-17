import { useCallback, useRef } from 'react';

import { useUpdatingRef } from 'external/src/effects/useUpdatingRef.ts';

/**
 * Just like a setTimeout, but the timer is reset every time you
 * call the function returned by the hook.
 * @example
 * const startTimer = useSetTimeout(() => console.log('hello'), DELAY_MS);
 * startTimer(); // Starts the timer.
 * startTimer(); // Reset the timer and start it again.
 */
export function useSetTimeout(
  callback: (...args: unknown[]) => unknown,
  timeoutMS: number,
) {
  const callbackRef = useUpdatingRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleSetTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(callbackRef.current, timeoutMS);
  }, [callbackRef, timeoutMS]);

  return handleSetTimeout;
}
