import { useMemo } from 'react';
import type { PropsWithChildren } from 'react';
import { ConfigurationContext } from 'external/src/context/config/ConfigurationContext.ts';
import { useFeatureFlag } from 'external/src/effects/useFeatureFlag.ts';
import { FeatureFlags } from 'common/const/FeatureFlags.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

export function TasksRemovalProvider({ children }: PropsWithChildren<unknown>) {
  // If this feature flag is true, disable tasks no matter what the current
  // setting is
  const removeTasks = useFeatureFlag(FeatureFlags.REMOVE_TASKS_FEATURE);
  const existingConfig = useContextThrowingIfNoProvider(ConfigurationContext);
  const contextValue = useMemo(
    () => ({
      ...existingConfig,
      ...(removeTasks && { enableTasks: false }),
    }),
    [existingConfig, removeTasks],
  );
  return (
    <ConfigurationContext.Provider value={contextValue}>
      {children}
    </ConfigurationContext.Provider>
  );
}
