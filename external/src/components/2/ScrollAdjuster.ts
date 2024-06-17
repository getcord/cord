import type { RefObject } from 'react';
import { useCallback, useEffect, useRef } from 'react';

import { MESSAGE_BLOCK_CLASS_NAME } from 'external/src/components/2/MessageBlock2.tsx';
import { isDefined } from 'common/util/index.ts';

type Props = {
  containerRef: RefObject<HTMLElement>;
};

type ElementConfig = {
  offsetTop: number;
  offsetBottom: number;
  element: HTMLElement;
};

/*
  Auto adjust scrollTop on any change in container's scrollHeight, i.e. on any:
    1) Resize of container's descendants
    2) Addition/removal of children to container
  We adjust the scroll so that the top of the first element intersecting
  the scroll is the same distance away from the top of the scroll. 
*/
export const ScrollAdjuster = ({ containerRef }: Props) => {
  const elementConfigsRef = useRef<ElementConfig[]>([]);
  const previousScrollHeightRef = useRef(0);
  const previousOffsetHeightRef = useRef(0);
  const setPreviousScrollAndOffsetHeight = useCallback(() => {
    previousScrollHeightRef.current = containerRef.current!.scrollHeight;
    previousOffsetHeightRef.current = containerRef.current!.offsetHeight;
  }, [containerRef]);

  const onResize = useCallback(() => {
    const containerPaddingTop = parseFloat(
      getComputedStyle(containerRef.current!).paddingTop,
    );
    const getOffsetTop = (element: HTMLElement) =>
      element.offsetTop - containerPaddingTop;
    const getOffsetBottom = (element: HTMLElement) =>
      element.offsetTop + element.offsetHeight - containerPaddingTop;
    const scrollTop = containerRef.current!.scrollTop;

    // We want to compare the scroll position of the container now to the height
    // of the container before the resize to see if we should reset the scroll
    // to the bottom.  But if the scroll container got smaller, the height of
    // the container before the resize will potentially be bigger than the
    // scroll value now even if it was at the bottom.  So compare the scrollTop
    // to the smaller of the current height and the previous height.
    const prevBottomScrollPos = Math.min(
      previousScrollHeightRef.current - previousOffsetHeightRef.current,
      containerRef.current!.scrollHeight - containerRef.current!.offsetHeight,
    );

    // If we are at least as scrolled as it was possible to scroll before, we
    // were at the bottom and should stay there. Note: scrollTop can be in
    // fractional pixels when using display scaling (e.g. chrome on 90% zoom),
    // so give 2 pixels of margin
    const scrollAtBottom = scrollTop >= prevBottomScrollPos - 2;
    if (scrollAtBottom) {
      containerRef.current!.scrollTop = containerRef.current!.scrollHeight;
    } else if (elementConfigsRef.current.length) {
      const firstElementIntersectingScroll = elementConfigsRef.current.find(
        (config) => {
          return config.offsetBottom > scrollTop;
        },
      );
      if (firstElementIntersectingScroll) {
        const adjustment = firstElementIntersectingScroll.offsetTop - scrollTop;
        containerRef.current!.scrollTop =
          getOffsetTop(firstElementIntersectingScroll.element) - adjustment;
      }
    }
    const newElementConfigs: ElementConfig[] = [];
    const elements = containerRef.current!.querySelectorAll(
      `.${MESSAGE_BLOCK_CLASS_NAME} > *`,
    );
    for (const element of elements) {
      if (isDefined((element as any).offsetTop)) {
        newElementConfigs.push({
          offsetTop: getOffsetTop(element as HTMLElement),
          offsetBottom: getOffsetBottom(element as HTMLElement),
          element: element as HTMLElement,
        });
      }
    }
    elementConfigsRef.current = newElementConfigs;
    setPreviousScrollAndOffsetHeight();
  }, [containerRef, setPreviousScrollAndOffsetHeight]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(onResize);

    // On any child added/removed from container, ensure all children are added to resizeObserver
    const mutationObserver = new MutationObserver(() => {
      for (const child of containerRef.current!.children) {
        resizeObserver.observe(child);
      }
    });

    // Add container to resizeObserver (capturing when it shrinks when composer goes multiline)
    resizeObserver.observe(containerRef.current!);
    // Add all children to resize observer. Observer fires when child first added
    for (const child of containerRef.current!.children) {
      resizeObserver.observe(child);
    }
    // Listen for any children added/removed from container
    mutationObserver.observe(containerRef.current!, {
      childList: true,
    });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [containerRef, onResize]);

  return null;
};
