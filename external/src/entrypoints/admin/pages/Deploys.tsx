import { Helmet } from 'react-helmet';

import { DataTable } from 'external/src/entrypoints/admin/components/DataTable.tsx';
import { DataTableQueries } from 'common/types/index.ts';

export function Deploys() {
  return (
    <>
      <Helmet>
        <title>Cord Admin - Deploys</title>
      </Helmet>
      <DataTable title="Deploys" query={DataTableQueries.DEPLOYS} />
    </>
  );
}
