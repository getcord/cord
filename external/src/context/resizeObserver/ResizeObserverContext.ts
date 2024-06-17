import { createContext } from 'react';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

type ResizeObserverContextType = {
  observeElement: (
    element: HTMLElement,
    onResize: (entry: ResizeObserverEntry) => void,
  ) => void;
  unobserveElement: (element: HTMLElement) => void;
};

export const ResizeObserverContext = createContext<
  ResizeObserverContextType | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);
