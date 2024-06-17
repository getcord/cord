import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ResizeObserverContext } from 'external/src/context/resizeObserver/ResizeObserverContext.ts';

type ResizeFunctionMap = Map<Element, (entry: ResizeObserverEntry) => void>;

export const ResizeObserverProvider = ({
  children,
}: React.PropsWithChildren<any>) => {
  // Store functions map in ref because we don't need a re-render when it changes
  const resizeFunctionsByElementRef = useRef<ResizeFunctionMap>(new Map());

  const onResize = useCallback((entries: readonly ResizeObserverEntry[]) => {
    for (const entry of entries) {
      const resizeFn = resizeFunctionsByElementRef.current.get(entry.target);
      if (resizeFn) {
        resizeFn(entry);
      }
    }
  }, []);

  // ResizeObserver: https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
  const observerRef = useRef(new ResizeObserver(onResize));

  const observeElement = useCallback(
    (element: HTMLElement, resizeFn: (entry: ResizeObserverEntry) => void) => {
      resizeFunctionsByElementRef.current.set(element, resizeFn);
      observerRef.current.observe(element);
    },
    [],
  );

  const unobserveElement = useCallback((element: HTMLElement) => {
    resizeFunctionsByElementRef.current.delete(element);
    observerRef.current.unobserve(element);
  }, []);

  useEffect(() => {
    const observer = observerRef.current;
    return () => observer.disconnect();
  }, []);

  const contextValue = useMemo(
    () => ({
      observeElement,
      unobserveElement,
    }),
    [observeElement, unobserveElement],
  );

  return (
    <ResizeObserverContext.Provider value={contextValue}>
      {children}
    </ResizeObserverContext.Provider>
  );
};
