import { useMemo } from 'react';

import { useUpdatingRef } from 'external/src/effects/useUpdatingRef.ts';

// eslint-disable-next-line @typescript-eslint/ban-types
export function useReffedFns<O extends { [fnName: string]: Function }>(
  fns: O,
): O {
  const fnsRef = useUpdatingRef(fns);
  return useMemo(
    () =>
      Object.fromEntries(
        Object.entries(fnsRef.current).map(([fnName]) => [
          fnName,
          (...args: any) => fnsRef.current[fnName](...args),
        ]),
      ) as any,
    [fnsRef],
  );
}
