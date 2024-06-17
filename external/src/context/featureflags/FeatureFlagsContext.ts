import { createContext } from 'react';

import type { featureFlagDefaults } from 'common/const/FeatureFlags.ts';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

type FeatureFlagsContextValue = {
  featureFlags: ReturnType<typeof featureFlagDefaults>;
};

export const FeatureFlagsContext = createContext<
  FeatureFlagsContextValue | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);
