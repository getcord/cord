import { createContext } from 'react';
import type { NavigateFn } from '@cord-sdk/types';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

type NavigationOverride = {
  navigateOverride: NavigateFn;
};

export const NavigationOverrideContext = createContext<
  NavigationOverride | typeof NO_PROVIDER_DEFINED | null
>(NO_PROVIDER_DEFINED);
