import { FeatureFlags } from 'common/const/FeatureFlags.ts';
import { useFeatureFlag } from 'external/src/effects/useFeatureFlag.ts';

export function usePricingPageURL() {
  const isBillingInConsoleEnabled = useFeatureFlag(
    FeatureFlags.BILLING_ENABLED_IN_CONSOLE,
  );

  if (isBillingInConsoleEnabled) {
    return 'https://cord.com/pricing-new';
  }
  return 'https://cord.com/pricing';
}
