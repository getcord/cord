import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { useHeightTracker } from 'external/src/effects/useDimensionTracker.ts';
import { ScrollContainerContext } from 'external/src/context/scrollContainer/ScrollContainerContext.ts';
import { ScrollAdjuster } from 'external/src/components/2/ScrollAdjuster.ts';
import { useUpdatingRef } from 'external/src/effects/useUpdatingRef.ts';
import { ComponentContext } from 'external/src/context/component/ComponentContext.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import { doNothing } from 'external/src/lib/util.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { withNewCSSComponentMaybe } from 'external/src/components/ui3/withNewComponent.tsx';
import { newScrollContainerConfig } from 'external/src/components/ui3/ScrollContainer.tsx';

const useStyles = createUseStyles({
  inboxScrollContainer: {
    backgroundColor: cssVar('inbox-background-color'),
  },
  defaultScrollContainer: {
    backgroundColor: cssVar('color-base'),
  },
  //TODO (notifications) add notifications list CSS variable
});

type ScrollListener = () => void;

type Props = {
  className: string;
  useScrollAdjuster?: boolean;
  onScroll?: (scrollTop: number) => void;
};

export const ScrollContainerProvider2 = withNewCSSComponentMaybe(
  newScrollContainerConfig,
  forwardRef<HTMLDivElement | null, React.PropsWithChildren<Props>>(
    (
      {
        children,
        useScrollAdjuster = false,
        onScroll: onScrollProp,
        className,
      },
      ref,
    ) => {
      const classes = useStyles();

      const scrollListeners = useRef<Set<ScrollListener>>(new Set());

      const addScrollListener = useCallback(
        (scrollListener: ScrollListener) => {
          scrollListeners.current.add(scrollListener);
        },
        [],
      );

      const removeScrollListener = useCallback(
        (scrollListener: ScrollListener) => {
          scrollListeners.current.delete(scrollListener);
        },
        [],
      );

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

      const name = useContextThrowingIfNoProvider(ComponentContext)?.name;

      const isSDKSidebarComponent =
        name === 'cord-sidebar' || name === 'cord-sidebar-launcher';

      const isSDKInboxComponent =
        name === 'cord-inbox' || name === 'cord-inbox-launcher';

      return (
        <ScrollContainerContext.Provider value={contextValue}>
          <Box2
            scrollable={true}
            forwardRef={scrollContainerRef}
            onScroll={onScroll}
            className={cx(className, {
              [classes.inboxScrollContainer]: isSDKInboxComponent,
              [classes.defaultScrollContainer]:
                !isSDKInboxComponent && !isSDKSidebarComponent,
            })}
          >
            {children}
          </Box2>
          {loaded && useScrollAdjuster && (
            <ScrollAdjuster containerRef={scrollContainerRef} />
          )}
        </ScrollContainerContext.Provider>
      );
    },
  ),
);

export function DisabledScrollContainerProvider({
  children,
}: React.PropsWithChildren<unknown>) {
  const contextValue = useMemo(
    () => ({
      scrollContainerRef: { current: null },
      addScrollListener: doNothing,
      removeScrollListener: doNothing,
      scrollContainerHeight: undefined,
      scrollToTop: doNothing,
    }),
    [],
  );

  return (
    <ScrollContainerContext.Provider value={contextValue}>
      {children}
    </ScrollContainerContext.Provider>
  );
}
