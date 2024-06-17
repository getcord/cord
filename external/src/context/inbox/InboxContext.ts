import { createContext } from 'react';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

type ContextState = {
  count: number;
  lastUpdateTimestamp: number;
};

export const InboxContext = createContext<
  ContextState | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);
