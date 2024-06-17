import { createContext } from 'react';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

type ScrollContainerContextValue = {
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  scrollContainerHeight: number | undefined;
  scrollToTop: () => void;
  addScrollListener: (scrollListener: () => void) => void;
  removeScrollListener: (scrollListener: () => void) => void;
};

export const ScrollContainerContext = createContext<
  ScrollContainerContextValue | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);
