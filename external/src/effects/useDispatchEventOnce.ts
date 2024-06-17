import { useRef, useCallback } from 'react';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ComponentContext } from 'external/src/context/component/ComponentContext.tsx';

export function useDispatchEventOnce(event: string) {
  const dispatchedAlready = useRef<boolean>(false);
  const componentCtx = useContextThrowingIfNoProvider(ComponentContext);

  return useCallback(() => {
    if (componentCtx && !dispatchedAlready.current) {
      componentCtx.element.dispatchCordEvent(
        new CustomEvent(`${componentCtx.name}:${event}`, {
          bubbles: false,
          detail: [],
        }),
      );
      dispatchedAlready.current = true;
    }
  }, [componentCtx, event]);
}
