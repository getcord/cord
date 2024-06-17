import { createContext, useEffect, useMemo, useState } from 'react';
import type {
  CustomerType,
  PricingTier,
  BillingType,
} from 'external/src/entrypoints/console/graphql/operations.ts';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';
import {
  useConsoleUserQuery,
  useCustomerEventsSubscription,
} from 'external/src/entrypoints/console/graphql/operations.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ConsoleAuthContext } from 'external/src/entrypoints/console/contexts/ConsoleAuthContextProvider.tsx';
import type { BillingStatus } from 'external/src/entrypoints/admin/graphql/operations.ts';
import type { Nullable } from 'common/types/index.ts';

export type CustomerInfoContextType = {
  customerID: string | null;
  customerName: string | null;
  customerType: CustomerType | null;
  enableCustomS3Bucket: boolean | null;
  enableCustomSegmentWriteKey: boolean | null;
  signupCoupon: string | null;
  refetch: (() => void) | null;
  loading: boolean;
  pendingCustomerID: string | null;
  billingInfo: BillingInfo;
  sharedSecret: string | null;
};

export const CustomerInfoContext = createContext<
  CustomerInfoContextType | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);

interface BillingInfo {
  billingStatus: BillingStatus | null;
  billingType: Nullable<BillingType>;
  pricingTier: PricingTier | null;
  renewalDate: Nullable<string>;
  addons: any;
  planDescription: string[];
}

export function CustomerInfoProvider({
  children,
}: React.PropsWithChildren<unknown>) {
  const { connected } = useContextThrowingIfNoProvider(ConsoleAuthContext);
  const { data, loading, refetch } = useConsoleUserQuery({
    skip: !connected,
  });

  const customerData = data?.consoleUser?.customer;
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    pricingTier: customerData?.pricingTier ?? null,
    billingType: customerData?.billingType ?? null,
    billingStatus: customerData?.billingStatus ?? null,
    renewalDate: customerData?.renewalDate ?? null,
    addons: customerData?.addons,
    planDescription: customerData?.planDescription ?? [],
  });

  useEffect(() => {
    const customer = data?.consoleUser?.customer;
    setBillingInfo({
      pricingTier: customer?.pricingTier ?? null,
      billingStatus: customer?.billingStatus ?? null,
      billingType: customer?.billingType ?? null,
      renewalDate: customer?.renewalDate ?? null,
      addons: customer?.addons,
      planDescription: customer?.planDescription ?? [],
    });
  }, [data]);

  const customerID = data?.consoleUser?.customer?.id ?? null;
  const customerName = data?.consoleUser?.customer?.name ?? null;
  const customerType = data?.consoleUser?.customer?.type ?? null;
  const enableCustomS3Bucket =
    data?.consoleUser?.customer?.enableCustomS3Bucket ?? null;
  const enableCustomSegmentWriteKey =
    data?.consoleUser?.customer?.enableCustomSegmentWriteKey ?? null;
  const signupCoupon = data?.consoleUser?.customer?.signupCoupon ?? null;
  const pendingCustomerID = data?.consoleUser?.pendingCustomerID ?? null;
  const sharedSecret = data?.consoleUser?.customer?.sharedSecret ?? null;

  const context = useMemo(
    () => ({
      loading,
      customerID,
      customerName,
      customerType,
      enableCustomS3Bucket,
      enableCustomSegmentWriteKey,
      signupCoupon,
      refetch,
      pendingCustomerID,
      billingInfo,
      sharedSecret,
    }),
    [
      customerID,
      customerName,
      customerType,
      enableCustomS3Bucket,
      enableCustomSegmentWriteKey,
      signupCoupon,
      loading,
      refetch,
      pendingCustomerID,
      billingInfo,
      sharedSecret,
    ],
  );

  useCustomerEventsSubscription({
    skip: !customerID,
    variables: {
      customerID: customerID!,
    },
    onData: ({ data: { data: eventData } }) => {
      if (
        eventData?.customerEvents.__typename === 'CustomerSubscriptionUpdated'
      ) {
        setBillingInfo(eventData.customerEvents.customer);
      } else {
        console.error('Unexpected event in customer subscription', {
          event: eventData?.customerEvents.__typename,
        });
      }
    },
  });

  return (
    <CustomerInfoContext.Provider value={context}>
      {children}
    </CustomerInfoContext.Provider>
  );
}
