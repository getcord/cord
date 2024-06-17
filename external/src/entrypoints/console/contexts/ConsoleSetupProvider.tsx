import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';
import { useApplicationsQuery } from 'external/src/entrypoints/console/graphql/operations.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { CustomerInfoContext } from 'external/src/entrypoints/console/contexts/CustomerInfoProvider.tsx';

type SetupProgressType = 'in_progress' | 'completed' | 'not_started';
type ConsoleSetupContextType = {
  groupID: string | null;
  setGroupID: (id: string) => void;
  userID: string | null;
  setUserID: (id: string) => void;
  clientAuthToken: string | null;
  setClientAuthToken: (token: string | null) => void;
  setupProgress: SetupProgressType | null;
  firstApplicationID: string | null;
  refetchApps: (() => void) | null;
};

export const ConsoleSetupContext = createContext<
  ConsoleSetupContextType | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);

export function ConsoleSetupProvider({
  children,
}: React.PropsWithChildren<unknown>) {
  const { customerID } = useContextThrowingIfNoProvider(CustomerInfoContext);

  const [groupID, setGroupID] = useState<string | null>(null);
  const [userID, setUserID] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [setupProgress, setSetupProgress] = useState<SetupProgressType | null>(
    null,
  );
  const {
    data: applicationsData,
    loading: applicationsLoading,
    refetch: refetchApps,
  } = useApplicationsQuery({ skip: !customerID });
  const firstApplicationID =
    applicationsData?.applications[0]?.application.id ?? null;

  // we want to use this instead of firstApplicationID so that
  // we don't have a glitch while the data is loading as we check
  // wether to show the side navbar or not
  const getSetupProgress = useCallback(() => {
    const allApps = applicationsData?.applications;

    if (applicationsLoading || !allApps) {
      return;
    }
    if (allApps.length > 0) {
      setSetupProgress('in_progress');
    } else {
      setSetupProgress('not_started');
    }
  }, [applicationsData?.applications, applicationsLoading]);

  useEffect(() => {
    getSetupProgress();
  }, [getSetupProgress]);

  const context = useMemo(
    () => ({
      groupID,
      setGroupID,
      userID,
      setUserID,
      clientAuthToken: authToken,
      refetchApps,
      setupProgress,
      firstApplicationID,
      setClientAuthToken: setAuthToken,
    }),
    [
      groupID,
      setGroupID,
      userID,
      setUserID,
      authToken,
      refetchApps,
      setupProgress,
      firstApplicationID,
      setAuthToken,
    ],
  );

  return (
    <ConsoleSetupContext.Provider value={context}>
      {children}
    </ConsoleSetupContext.Provider>
  );
}
