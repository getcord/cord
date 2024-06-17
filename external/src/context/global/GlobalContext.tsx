import { createContext, useMemo, useState } from 'react';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

type ContextType = {
  sidebarVisible: boolean | null;
  setSidebarVisible: (value: boolean) => void;
};

// GlobalContext is used for storing data that we want to persist across
// accessToken changes.
export const GlobalContext = createContext<
  ContextType | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);

export function GlobalProvider(props: React.PropsWithChildren<unknown>) {
  const [sidebarVisible, setSidebarVisible] = useState<boolean | null>(null);

  const value = useMemo(
    () => ({
      sidebarVisible,
      setSidebarVisible,
    }),
    [sidebarVisible, setSidebarVisible],
  );

  return (
    <GlobalContext.Provider value={value}>
      {props.children}
    </GlobalContext.Provider>
  );
}
