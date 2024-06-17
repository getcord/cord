import { createContext } from 'react';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

export const SidebarWidthContext = createContext<
  number | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);
