import { useCallback, useState } from 'react';
import { Helmet } from 'react-helmet';

import type { JsonObject } from 'common/types/index.ts';
import { DataTableQueries } from 'common/types/index.ts';
import { DataTable } from 'external/src/entrypoints/admin/components/DataTable.tsx';
import { CustomerCreateForm } from 'external/src/entrypoints/admin/components/CustomerCreateForm.tsx';
import { AdminRoutes } from 'external/src/entrypoints/admin/routes.ts';

export function Customers() {
  const [showingCustomerForm, setShowingCustomerForm] =
    useState<boolean>(false);
  const [includeInactive, setIncludeInactive] = useState<boolean>(false);
  const filterFunction = useCallback(
    (row: JsonObject) => {
      if (includeInactive) {
        return true;
      }
      return row['implementationStage'] !== 'inactive';
    },
    [includeInactive],
  );

  return (
    <>
      <Helmet>
        <title>Cord Admin - Customers</title>
      </Helmet>

      <h3
        style={{ cursor: 'pointer' }}
        onClick={() => setShowingCustomerForm((x) => !x)}
      >
        {showingCustomerForm ? '▼' : '▶'} Create Customer
      </h3>
      <div style={{ display: showingCustomerForm ? 'block' : 'none' }}>
        <CustomerCreateForm />
      </div>

      <div>
        <label>Include inactive customers</label>
        <input
          type="checkbox"
          checked={includeInactive}
          onChange={(e) => setIncludeInactive(e.target.checked)}
        />
      </div>
      <DataTable
        title="Verified Customers"
        query={DataTableQueries.VERIFIED_CUSTOMERS}
        dynamicLinks={{ id: AdminRoutes.CUSTOMERS }}
        filter={filterFunction}
      />
      <DataTable
        title="Sample Customers"
        query={DataTableQueries.SAMPLE_CUSTOMERS}
        dynamicLinks={{ id: AdminRoutes.CUSTOMERS }}
      />
    </>
  );
}
