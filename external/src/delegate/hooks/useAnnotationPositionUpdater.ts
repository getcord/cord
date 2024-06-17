import { useCallback, useEffect, useMemo, useRef } from 'react';
import { debounce } from 'radash';
import type { DelegateState } from 'external/src/context/delegate/DelegateContext.ts';
import { DelegateContext } from 'external/src/context/delegate/DelegateContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import {
  addEmbedXFrameMessageListener,
  removeEmbedXFrameMessageListener,
} from 'external/src/embed/embedXFrame/index.ts';
import { isDocument } from 'external/src/delegate/location/util.ts';

/**
 * Runs the `updateAnnotationPosition` fn you pass to it  whenever the page
 * gets resized/scrolled; taking care of update both pointers and arrow (if any).
 */
export function useAnnotationPositionUpdater(
  updateAnnotationPosition: () => Promise<void>,
  annotationArrow: DelegateState['annotationArrow'],
) {
  const { dispatch } = useContextThrowingIfNoProvider(DelegateContext);

  const hideArrow = useCallback(() => {
    if (annotationArrow) {
      dispatch({
        type: 'HIDE_ANNOTATION_ARROW',
        arrow: annotationArrow,
      });
    }
  }, [annotationArrow, dispatch]);

  const updateAnnotationPositionAndHideArrow = useMemo(
    () =>
      debounce({ delay: 10 }, () =>
        updateAnnotationPosition().then(() => {
          // Remove arrow on scroll/resize if one exists
          // This can happen with the arrow that points from the annotation in composer when added
          hideArrow();
        }),
      ),
    [hideArrow, updateAnnotationPosition],
  );

  const updateAnnotationPositionAndHideArrowRef = useRef(
    updateAnnotationPositionAndHideArrow,
  );
  updateAnnotationPositionAndHideArrowRef.current =
    updateAnnotationPositionAndHideArrow;

  useEffect(() => {
    return () => {
      updateAnnotationPositionAndHideArrowRef.current.cancel();
    };
  }, []);

  // Only run onScroll if scroll position has changed. Firefox can trigger >1
  // onScrolls for a single scroll value, meaning onScroll can run after our
  // annotation onScrollEnd callback (which runs when we reach the end scroll
  // value). This previously caused annotation arrows to not show after
  // scrolling to an annotation (onScrollEnd showed the arrow, but the extra
  // onScroll hid it via updateAnnotationPositions)
  const prevScrollPositionsRef = useRef(
    new WeakMap<HTMLElement | Window, { left: number; top: number }>(),
  );
  const onScroll = useCallback(
    (event: Event) => {
      const target = event.target as Element | Document | null;
      if (!target) {
        return;
      }
      const scroller = (
        isDocument(target)
          ? target.scrollingElement ?? target.documentElement
          : target
      ) as HTMLElement;
      const scrollHasChanged =
        scroller.scrollTop !==
          prevScrollPositionsRef.current.get(scroller)?.top ||
        scroller.scrollLeft !==
          prevScrollPositionsRef.current.get(scroller)?.left;
      if (scrollHasChanged) {
        void updateAnnotationPositionAndHideArrow();
        prevScrollPositionsRef.current.set(scroller, {
          top: scroller.scrollTop,
          left: scroller.scrollLeft,
        });
      }
    },
    [updateAnnotationPositionAndHideArrow],
  );

  useEffect(() => {
    window.addEventListener('scroll', onScroll, {
      capture: true,
    });
    // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    window.addEventListener('resize', updateAnnotationPositionAndHideArrow, {
      capture: true,
    });
    window.addEventListener('wheel', hideArrow, {
      capture: true,
    });
    addEmbedXFrameMessageListener(
      'CORD_SCROLL',
      updateAnnotationPositionAndHideArrow as any,
    );

    return () => {
      window.removeEventListener('scroll', onScroll, {
        capture: true,
      });
      window.removeEventListener(
        'resize',
        // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
        updateAnnotationPositionAndHideArrow,
        {
          capture: true,
        },
      );
      window.removeEventListener('wheel', hideArrow, {
        capture: true,
      });
      removeEmbedXFrameMessageListener(
        'CORD_SCROLL',
        updateAnnotationPositionAndHideArrow as any,
      );
    };
  }, [hideArrow, onScroll, updateAnnotationPositionAndHideArrow]);
}
