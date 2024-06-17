import { createContext, useCallback, useMemo, useState } from 'react';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

type ThirdPartyAuthDataModal =
  | {
      teamName?: string;
      title?: string;
      body?: string;
    }
  | undefined;

type ThirdPartyAuthDataModalContextType = {
  thirdPartyAuthData: ThirdPartyAuthDataModal | null;
  showThirdPartyAuthDataModal: (
    thirdPartyAuthData?: ThirdPartyAuthDataModal,
  ) => unknown;
  hideThirdPartyAuthDataModal: () => unknown;
};

export const ThirdPartyAuthDataModalContext = createContext<
  ThirdPartyAuthDataModalContextType | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);

export function ThirdPartyAuthDataModalProvider({
  children,
}: React.PropsWithChildren<unknown>) {
  const [thirdPartyAuthData, setThirdPartyAuthData] =
    useState<ThirdPartyAuthDataModal | null>(null);

  const hideThirdPartyAuthDataModal = useCallback(() => {
    if (thirdPartyAuthData) {
      setThirdPartyAuthData(null);
    }
  }, [thirdPartyAuthData]);

  const contextValue = useMemo(
    () => ({
      thirdPartyAuthData,
      showThirdPartyAuthDataModal: setThirdPartyAuthData,
      hideThirdPartyAuthDataModal,
    }),
    [hideThirdPartyAuthDataModal, thirdPartyAuthData],
  );

  return (
    <ThirdPartyAuthDataModalContext.Provider value={contextValue}>
      {children}
    </ThirdPartyAuthDataModalContext.Provider>
  );
}
