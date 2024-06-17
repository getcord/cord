import { useMemo, useCallback, useState } from 'react';

import type { PreferencesContextValue } from 'external/src/context/preferences/PreferencesContext.ts';
import { PreferencesContext } from 'external/src/context/preferences/PreferencesContext.ts';
import type { JsonObject, PreferencesValueType } from 'common/types/index.ts';

export function LoggedOutPreferencesProvider(
  props: React.PropsWithChildren<unknown>,
) {
  const [preferences, setPreferences] = useState<JsonObject>({});

  const setPreference = useCallback(
    (key: string, value: PreferencesValueType) => {
      // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      setPreferences((preferences) => ({
        ...preferences,
        [key]: value,
      }));
    },
    [],
  );

  const contextValue = useMemo<PreferencesContextValue>(
    () => ({ preferences, setPreference }),
    [preferences, setPreference],
  );

  return (
    <PreferencesContext.Provider value={contextValue}>
      {props.children}
    </PreferencesContext.Provider>
  );
}
