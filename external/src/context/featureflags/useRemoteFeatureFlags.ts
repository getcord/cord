import { useMemo } from 'react';
import { useFeatureFlagsQuery } from 'external/src/graphql/operations.ts';
import {
  featureFlagDefaults,
  FeatureFlags,
} from 'common/const/FeatureFlags.ts';

export function useRemoteFeatureFlags() {
  const flags = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    const flags = [];
    for (const key in FeatureFlags) {
      flags.push(FeatureFlags[key as keyof typeof FeatureFlags]);
    }
    return flags;
  }, []);

  const { data: flagData } = useFeatureFlagsQuery({
    variables: {
      keys: flags.map((f) => f.key),
    },
  });

  return useMemo(() => {
    if (!flagData) {
      return undefined;
    } else {
      // Start with the defaults so if any flag didn't come back from the backend,
      // we use the default value and so featureFlags gets the right type.
      const featureFlags = { ...featureFlagDefaults() };
      for (const flag of flags) {
        const returnedValue = flagData.featureFlags.find(
          (fd) => fd.key === flag.key,
        );
        if (returnedValue) {
          // We have to cast featureFlags to any here because the type of the
          // value from the backend is just string | number | boolean.  It will be
          // right as long as the FeatureFlag typing matches up with the flag
          // values declared in LaunchDarkly, but the type system can't prove that
          // was done correctly.
          (featureFlags as any)[returnedValue.key] = returnedValue.value;
        }
      }
      return featureFlags;
    }
  }, [flagData, flags]);
}
