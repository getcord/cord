import { useMemo } from 'react';
import type { PropsWithChildren } from 'react';
import { ConfigurationContext } from 'external/src/context/config/ConfigurationContext.ts';
import { useFeatureFlag } from 'external/src/effects/useFeatureFlag.ts';
import { FeatureFlags } from 'common/const/FeatureFlags.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

export function SlackRemovalProvider({ children }: PropsWithChildren<unknown>) {
  // If this feature flag is false, disable Slack no matter what the current
  // setting is
  const disableSlack = !useFeatureFlag(FeatureFlags.ENABLE_SLACK_FEATURES);
  const existingConfig = useContextThrowingIfNoProvider(ConfigurationContext);
  const contextValue = useMemo(
    () => ({
      ...existingConfig,
      ...(disableSlack && { enableSlack: false }),
    }),
    [disableSlack, existingConfig],
  );
  return (
    <ConfigurationContext.Provider value={contextValue}>
      {children}
    </ConfigurationContext.Provider>
  );
}
