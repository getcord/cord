import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { CustomerInfoContext } from 'external/src/entrypoints/console/contexts/CustomerInfoProvider.tsx';
import type { BillingStatus } from 'external/src/entrypoints/admin/graphql/operations.ts';
import {
  FREE_APP_LIMIT,
  FREE_MAU_LIMIT,
  FREE_SEATS_LIMIT,
  PRO_APP_LIMIT,
  PRO_MAU_LIMIT,
  PRO_SEATS_LIMIT,
} from 'common/const/Billing.ts';
import type { BillingType } from 'external/src/entrypoints/console/graphql/operations.ts';
import type { Nullable } from 'common/types/index.ts';

export type Plan = 'Starter' | 'Pro' | 'Premium';

export type Addon = { key: string; value: boolean };

export interface PlanConfig {
  seats: number | 'unlimited';
  applications: number | 'unlimited';
  mau?: number;
}

export interface PlanDetails {
  planName: Plan;
  isPaymentPending: boolean;
  planConfig: PlanConfig;
  billingType: Nullable<BillingType>;
  renewalDate: Nullable<string>;
  addons: Addon[];
  planDescription: string[];
}

export function usePlan(): PlanDetails | null {
  const {
    loading,
    billingInfo: {
      billingStatus,
      pricingTier,
      billingType,
      renewalDate,
      addons,
      planDescription,
    },
  } = useContextThrowingIfNoProvider(CustomerInfoContext);

  if (loading || !pricingTier) {
    return null;
  }

  const planName = getPlanName(pricingTier, billingStatus);

  return {
    planName,
    isPaymentPending: isPaymentPending(pricingTier, billingStatus),
    planConfig: getPlanConfig(planName),
    billingType: billingType,
    renewalDate,
    addons: planName === 'Starter' ? [] : addons,
    planDescription: planName === 'Starter' ? [] : planDescription,
  };
}

function isPaymentPending(
  billingTier: string,
  billingStatus: BillingStatus | null,
): boolean {
  if (billingTier === 'free') {
    return false;
  }

  return billingStatus === 'unpaid';
}

function getPlanName(
  billingTier: string,
  billingStatus: BillingStatus | null,
): Plan {
  if (billingTier === 'free') {
    return 'Starter';
  }

  if (billingStatus === 'active' || billingStatus === 'unpaid') {
    switch (billingTier) {
      case 'pro':
        return 'Pro';
      case 'scale':
        return 'Premium';
    }
  }

  return 'Starter';
}

function getPlanConfig(plan: Plan): PlanConfig {
  switch (plan) {
    case 'Starter':
      return {
        seats: FREE_SEATS_LIMIT,
        applications: FREE_APP_LIMIT,
        mau: FREE_MAU_LIMIT,
      };
    case 'Pro':
      return {
        seats: PRO_SEATS_LIMIT,
        applications: PRO_APP_LIMIT,
        mau: PRO_MAU_LIMIT,
      };
    case 'Premium':
      return { seats: 'unlimited', applications: 'unlimited' };
  }
}
