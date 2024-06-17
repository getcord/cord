import { createContext } from 'react';
import type {
  PreferencesType,
  PreferencesValueType,
} from 'common/types/index.ts';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

export type PreferencesContextValue = {
  preferences: PreferencesType;
  setPreference: (key: string, value: PreferencesValueType) => void;
};

// NOTE: Preferences are provided by BootstrapProvider

export const PreferencesContext = createContext<
  PreferencesContextValue | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);
