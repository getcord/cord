import { createContext } from 'react';

import type { PageContext as PageContextType } from 'common/types/index.ts';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

export const PageContext = createContext<
  PageContextType | typeof NO_PROVIDER_DEFINED | null
>(NO_PROVIDER_DEFINED);
