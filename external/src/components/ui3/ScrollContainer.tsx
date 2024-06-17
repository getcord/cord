import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useHeightTracker } from 'external/src/effects/useDimensionTracker.ts';
import { ScrollContainerContext } from 'external/src/context/scrollContainer/ScrollContainerContext.ts';
import { ScrollAdjuster } from 'external/src/components/2/ScrollAdjuster.ts';
import { useUpdatingRef } from 'external/src/effects/useUpdatingRef.ts';
import * as classes from 'external/src/components/ui3/ScrollContainer.css.ts';

type ScrollListener = () => void;

type Props = {
  useScrollAdjuster?: boolean;
  onScroll?: (scrollTop: number) => void;
};
// This gets rid of props (className) this new version of ScrollContainerProvider does not need, but the are needed by the old one.
const ScrollContainerProviderOldToNew = forwardRef<
  HTMLDivElement | null,
  React.PropsWithChildren<Props & { className: string }>
>(({ className: _, ...restProps }: Props & { className: string }, ref) => (
  <ScrollContainerProvider {...restProps} ref={ref} />
));

export const ScrollContainerProvider = forwardRef<
  HTMLDivElement | null,
  React.PropsWithChildren<Props>
>(({ children, useScrollAdjuster = false, onScroll: onScrollProp }, ref) => {
  const scrollListeners = useRef<Set<ScrollListener>>(new Set());

  const addScrollListener = useCallback((scrollListener: ScrollListener) => {
    scrollListeners.current.add(scrollListener);
  }, []);

  const removeScrollListener = useCallback((scrollListener: ScrollListener) => {
    scrollListeners.current.delete(scrollListener);
  }, []);

  const [scrollContainerRef, scrollContainerHeight] =
    useHeightTracker<HTMLDivElement>();

  const onScrollPropRef = useUpdatingRef(onScrollProp);

  const onScroll = useCallback(() => {
    if (!onScrollPropRef.current && !scrollListeners.current.size) {
      return;
    }
    onScrollPropRef.current?.(scrollContainerRef.current!.scrollTop);
    scrollListeners.current.forEach((listener) => listener());
  }, [onScrollPropRef, scrollContainerRef]);

  const contextValue = useMemo(
    () => ({
      scrollContainerRef,
      addScrollListener,
      removeScrollListener,
      scrollContainerHeight,
      scrollToTop: () =>
        scrollContainerRef.current?.scrollTo({
          top: 0,
          behavior: 'smooth',
        }),
    }),
    [
      addScrollListener,
      removeScrollListener,
      scrollContainerHeight,
      scrollContainerRef,
    ],
  );

  // Expose scrollContainerRef via ref for when we need to access it in same
  // component (as accessing via useContext wouldn't work)
  useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(
    ref,
    () => scrollContainerRef.current,
  );

  const [loaded, setLoaded] = useState(false);
  useEffect(() => setLoaded(true), []);

  return (
    <ScrollContainerContext.Provider value={contextValue}>
      <div
        ref={scrollContainerRef}
        onScroll={onScroll}
        className={classes.scrollContainer}
      >
        {children}
      </div>
      {loaded && useScrollAdjuster && (
        <ScrollAdjuster containerRef={scrollContainerRef} />
      )}
    </ScrollContainerContext.Provider>
  );
});

export const newScrollContainerConfig = {
  NewComp: ScrollContainerProviderOldToNew,
  configKey: 'scrollContainer',
} as const;
