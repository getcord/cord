import { FeatureFlagsContext } from 'external/src/context/featureflags/FeatureFlagsContext.ts';
import { usePreference } from 'external/src/effects/usePreference.ts';
import type { FeatureFlag, FeatureFlags } from 'common/const/FeatureFlags.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

/**
 * Returns the current value for this user of the given feature flag.
 */
export function useFeatureFlag<
  K extends (typeof FeatureFlags)[keyof typeof FeatureFlags]['key'],
  T,
>(feature: FeatureFlag<K, T>): T {
  const { featureFlags } = useContextThrowingIfNoProvider(FeatureFlagsContext);

  // Temporary: Allow preferences to override the flag value from the backend
  // until we stop using preferences to support the hacks panel.
  const [enabledInPrefs] = usePreference(feature.key);

  // We have to use `as any` here because TypeScript doesn't support correlated
  // union types.  Basically, in this function, TS only knows K is some valid
  // key and T is some valid value type, but not that every K has a specific
  // associated T.  See https://github.com/microsoft/TypeScript/issues/30581 for
  // more detail.
  return enabledInPrefs ? true : (featureFlags[feature.key] as any);
}
