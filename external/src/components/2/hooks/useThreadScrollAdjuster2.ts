import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';

import { ScrollContainerContext } from 'external/src/context/scrollContainer/ScrollContainerContext.ts';
import type { ThreadMode } from 'common/types/index.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

// How much gap to show above top thread when scrolling it into view on expand
const GAP_ABOVE_TOP_THREAD = 8;

// When expanding a thread, any other expanded thread above will collapse
// We adjust the scroll so that the top of the clicked thread remains at
// the same scroll position, or so that the whole thread appears if it was
// off the screen
export function useThreadScrollAdjuster2({
  threadContainerRef,
  mode,
}: {
  mode: ThreadMode;
  threadContainerRef: React.RefObject<HTMLDivElement>;
}) {
  const scrollContainerContext = useContextThrowingIfNoProvider(
    ScrollContainerContext,
  );

  const prevScrollPositionRef = useRef<null | number>(null);

  const getScrollPosition = useCallback(() => {
    const threadElement = threadContainerRef.current;
    const scrollContainer = scrollContainerContext?.scrollContainerRef.current;
    if (threadElement && scrollContainer) {
      return threadElement.offsetTop - scrollContainer.scrollTop;
    }
    return null;
  }, [scrollContainerContext?.scrollContainerRef, threadContainerRef]);

  const onClickThread = useMemo(() => {
    if (mode === 'collapsed') {
      return () => {
        prevScrollPositionRef.current = getScrollPosition();
      };
    }
    return undefined;
  }, [getScrollPosition, mode]);

  const prevModeRef = useRef(mode);
  useLayoutEffect(() => {
    if (prevModeRef.current === 'collapsed' && mode === 'inline') {
      const scrollContainer =
        scrollContainerContext?.scrollContainerRef.current;
      const scrollPos = getScrollPosition();
      if (
        scrollContainer &&
        scrollPos !== null &&
        prevScrollPositionRef.current !== null
      ) {
        scrollContainer.scrollTop +=
          scrollPos -
          Math.max(prevScrollPositionRef.current, GAP_ABOVE_TOP_THREAD);
      }
    }
  }, [getScrollPosition, mode, scrollContainerContext?.scrollContainerRef]);

  return { onClickThread };
}
