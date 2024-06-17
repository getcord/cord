import { Helmet } from 'react-helmet';
import { Spinner } from 'external/src/components/ui/Spinner.tsx';
import { HeimdallSwitchCard } from 'external/src/entrypoints/admin/components/HeimdallSwitchCard.tsx';
import { useHeimdallSwitchAdminQuery } from 'external/src/entrypoints/admin/graphql/operations.ts';
import { useUnsafeParams } from 'external/src/effects/useUnsafeParams.ts';

type Params = {
  key: string;
};

export function HeimdallKey() {
  const { key } = useUnsafeParams<Params>();
  const { data, refetch } = useHeimdallSwitchAdminQuery({ variables: { key } });
  return (
    <>
      <Helmet>
        <title>Cord Admin - Heimdall</title>
      </Helmet>
      {data?.heimdallSwitchAdmin ? (
        <HeimdallSwitchCard
          heimdallSwitch={data.heimdallSwitchAdmin}
          refetch={async () => {
            await refetch();
          }}
        />
      ) : (
        <Spinner />
      )}
    </>
  );
}
