import { Helmet } from 'react-helmet';
import { DataTableQueries } from 'common/types/index.ts';
import type { UUID } from 'common/types/index.ts';
import { useUnsafeParams } from 'external/src/effects/useUnsafeParams.ts';
import { ObjectInfo } from 'external/src/entrypoints/admin/components/ObjectInfo.tsx';
import { AdminRoutes } from 'external/src/entrypoints/admin/routes.ts';

export function WhoisThread() {
  const { id } = useUnsafeParams<{ id: UUID }>();
  return (
    <>
      <Helmet>
        <title>{"Cord Admin - What'd y'all say?"}</title>
      </Helmet>

      <ObjectInfo
        query={DataTableQueries.THREAD_DETAILS}
        parameters={{ id }}
        dynamicLinks={{
          platformApplicationID: AdminRoutes.WHOIS + '/application',
          orgID: AdminRoutes.WHOIS + '/org',
          messageIDs: AdminRoutes.WHOIS + '/message',
        }}
      />
    </>
  );
}
