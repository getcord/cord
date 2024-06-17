/* eslint-disable no-console */
import { useEffect, useRef } from 'react';

let shouldLogLoadingTime = false;
try {
  shouldLogLoadingTime = !!localStorage.getItem('__cord_log_loading_times__');
} catch {
  // localStorage for some reason not available
}

export function useLoadingTimeLogger(label: string, loaded: boolean) {
  const startTimeRef = useRef<number>();

  useEffect(() => {
    if (!shouldLogLoadingTime) {
      return;
    }

    const now = Date.now();
    if (!loaded) {
      startTimeRef.current = now;
    } else {
      const startTime = startTimeRef.current;
      if (startTime === undefined) {
        console.log(
          `${label}: ready from the start (${new Date().toISOString()})`,
        );
      } else {
        const duration = now - startTime;
        console.log(
          `${label}: ${duration}ms (${new Date(
            startTime,
          ).toISOString()} -> ${new Date(now).toISOString()})`,
        );
      }
    }
  }, [label, loaded]);
}
