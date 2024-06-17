import { useMemo } from 'react';
import type { Location } from '@cord-sdk/types';
import { locationJson } from '@cord-sdk/types';

export function useMemoizedLocation<L extends Location = Location>(
  location: Partial<L>,
) {
  // these two useMemo ensure that if the location argument instance changes,
  // if it's the same shape (keys and values) then we still return the same
  // (memoized) instance, so that uses of useEffect won't run again.
  const locationString = useMemo(() => locationJson(location), [location]);
  return useMemo<L>(() => JSON.parse(locationString), [locationString]);
}
