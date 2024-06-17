import { createContext } from 'react';
import type { UUID } from 'common/types/index.ts';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

type FloatingThreadsContextType = {
  openThreadID: UUID | null;
  setOpenThreadID: (openThreadID: UUID | null) => void;
} | null;

export const FloatingThreadsContext = createContext<
  FloatingThreadsContextType | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);
