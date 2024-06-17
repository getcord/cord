import { Helmet } from 'react-helmet';

import { DataTableQueries } from 'common/types/index.ts';
import { DataTable } from 'external/src/entrypoints/admin/components/DataTable.tsx';
import { AdminRoutes } from 'external/src/entrypoints/admin/routes.ts';

export function Applications() {
  return (
    <>
      <Helmet>
        <title>Cord Admin - Home</title>
      </Helmet>
      <DataTable
        title="Prod Applications"
        query={DataTableQueries.PROD_APPLICATIONS}
        dynamicLinks={{
          id: AdminRoutes.APPLICATIONS,
          customerID: AdminRoutes.CUSTOMERS,
        }}
      />
      <DataTable
        title="Staging Applications"
        query={DataTableQueries.STAGING_APPLICATIONS}
        dynamicLinks={{
          id: AdminRoutes.APPLICATIONS,
          customerID: AdminRoutes.CUSTOMERS,
        }}
      />
      <DataTable
        title="Sample Applications"
        query={DataTableQueries.SAMPLE_APPLICATIONS}
        dynamicLinks={{
          id: AdminRoutes.APPLICATIONS,
          customerID: AdminRoutes.CUSTOMERS,
        }}
      />
    </>
  );
}
