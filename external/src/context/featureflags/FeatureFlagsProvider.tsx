import { useMemo } from 'react';

import { FeatureFlagsContext } from 'external/src/context/featureflags/FeatureFlagsContext.ts';
import { useLoadingTimeLogger } from 'external/src/effects/useLoadingTimeLogger.ts';
import { useRemoteFeatureFlags } from 'external/src/context/featureflags/useRemoteFeatureFlags.ts';

export function FeatureFlagsProvider(props: React.PropsWithChildren<any>) {
  const remoteFeatureFlags = useRemoteFeatureFlags();

  const contextValue = useMemo(
    () =>
      remoteFeatureFlags ? { featureFlags: remoteFeatureFlags } : undefined,
    [remoteFeatureFlags],
  );

  useLoadingTimeLogger('<FeatureFlagsProvider>', !!contextValue);

  if (!contextValue) {
    return null;
  }

  return (
    <FeatureFlagsContext.Provider value={contextValue}>
      {props.children}
    </FeatureFlagsContext.Provider>
  );
}
