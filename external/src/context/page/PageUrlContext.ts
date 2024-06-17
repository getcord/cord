import { createContext } from 'react';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

export const PageUrlContext = createContext<
  string | typeof NO_PROVIDER_DEFINED | null
>(NO_PROVIDER_DEFINED);
