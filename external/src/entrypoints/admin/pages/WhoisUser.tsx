import { Helmet } from 'react-helmet';
import { useUnsafeParams } from 'external/src/effects/useUnsafeParams.ts';

import type { UUID } from 'common/types/index.ts';
import { DataTableQueries } from 'common/types/index.ts';
import { DataTable } from 'external/src/entrypoints/admin/components/DataTable.tsx';
import { ObjectInfo } from 'external/src/entrypoints/admin/components/ObjectInfo.tsx';
import { AdminRoutes } from 'external/src/entrypoints/admin/routes.ts';

export function WhoisUser() {
  const { id } = useUnsafeParams<{ id: UUID }>();

  return (
    <>
      <Helmet>
        <title>Cord Admin - Whodis User</title>
      </Helmet>

      <ObjectInfo
        query={DataTableQueries.USER_DETAILS}
        parameters={{ id }}
        dynamicLinks={{
          platformApplicationID: AdminRoutes.WHOIS + '/application',
        }}
      />

      <DataTable
        title="User is an org member in.."
        query={DataTableQueries.ORG_MEMBER_DETAILS}
        parameters={{ id }}
        dynamicLinks={{ orgID: AdminRoutes.WHOIS + '/org' }}
      />
    </>
  );
}
