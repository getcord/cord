import { useMemo, useState } from 'react';

/**
  useRef, but causing a re-render when element changes (as stored in state)
*/
export function useElementCallbackRef<E extends HTMLElement = HTMLElement>() {
  const [element, setElement] = useState<E | null>(null);

  const ref = useMemo(() => {
    return {
      get current() {
        return element;
      },
      // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      set current(element: E | null) {
        setElement(element);
      },
    };
  }, [element]);

  return ref;
}
