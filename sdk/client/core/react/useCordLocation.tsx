import { useMemo } from 'react';

import type { Location } from '@cord-sdk/types';

import { PageContext } from 'external/src/context/page/PageContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

// TODO: should this be allowed to return null?
export function useCordLocation(location?: Location): Location {
  const pageContext = useContextThrowingIfNoProvider(PageContext);

  return useMemo(() => {
    if (location) {
      return location;
    }

    if (pageContext?.data) {
      return pageContext.data;
    }

    // TODO: this seems wrong
    return {
      location: window.location.toString(),
    };
  }, [location, pageContext]);
}
