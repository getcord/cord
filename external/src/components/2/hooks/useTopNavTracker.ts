import { useEffect, useRef } from 'react';
import { GlobalElementContext } from 'external/src/context/globalElement/GlobalElementContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

export function useTopNavTracker() {
  const globalElementCtx = useContextThrowingIfNoProvider(GlobalElementContext);

  const topNavRef = useRef<HTMLDivElement>(null);

  // So that we can position success popup below topNav
  // Hide popup if it exists on unmount (i.e. when navigating back)
  useEffect(() => {
    const topNav = topNavRef.current!;
    globalElementCtx?.addTopNav(topNav);
    return () => globalElementCtx?.removeTopNav(topNav);
  }, [globalElementCtx]);

  return topNavRef;
}
