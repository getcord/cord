import { BillingProgress } from 'external/src/entrypoints/console/components/BillingProgress.tsx';
import { useUsageStatsQuery } from 'external/src/entrypoints/console/graphql/operations.ts';

export function MAUProgress({ maxValue }: { maxValue: number | undefined }) {
  const { data, loading } = useUsageStatsQuery();

  if (maxValue === undefined) {
    return null;
  }

  return (
    <BillingProgress
      name="MAU"
      currentValue={data?.usageStats.mau}
      maxValue={maxValue}
      isLoading={loading}
    />
  );
}
