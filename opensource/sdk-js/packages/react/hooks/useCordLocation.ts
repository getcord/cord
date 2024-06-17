import { useEffect } from 'react';

import { isEqualLocation } from '@cord-sdk/types';
import type { Location } from '@cord-sdk/types';

import { useCordContext as useCordReactContext } from '../contexts/CordContext.js';

export function useCordLocation(newLocation?: Location) {
  const { location, setLocation } = useCordReactContext('useCordLocation');

  useEffect(() => {
    if (newLocation && !isEqualLocation(location, newLocation)) {
      setLocation(newLocation);
    }
  }, [newLocation, location, setLocation]);

  useEffect(() => {
    return () => {
      setLocation(undefined);
    };
  }, [setLocation]);

  return newLocation ?? location;
}

// For backwards compatibility, will be removed along with the deprecated context prop
export const useCordContext = useCordLocation;
