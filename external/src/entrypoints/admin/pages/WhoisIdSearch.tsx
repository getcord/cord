import { Helmet } from 'react-helmet';
import { useUnsafeParams } from 'external/src/effects/useUnsafeParams.ts';
import type { UUID } from 'common/types/index.ts';
import { DataTableQueries } from 'common/types/index.ts';
import { ObjectInfo } from 'external/src/entrypoints/admin/components/ObjectInfo.tsx';
import { AdminRoutes } from 'external/src/entrypoints/admin/routes.ts';

export function WhoisIdSearch() {
  const { id } = useUnsafeParams<{ id: UUID }>();
  return (
    <>
      <Helmet>
        <title>{'Cord Admin - What Rolo Found'}</title>
      </Helmet>

      <img src="https://i.imgur.com/NjoPt4U.jpeg" />

      <h1>Here is what I sniffed out...</h1>

      <ObjectInfo
        query={DataTableQueries.ID_SEARCH}
        parameters={{ id }}
        dynamicLinks={{
          applicationsInternal: AdminRoutes.WHOIS + '/application',
          orgsInternal: AdminRoutes.WHOIS + '/org',
          orgsExternal: AdminRoutes.WHOIS + '/org',
          usersInternal: AdminRoutes.WHOIS + '/user',
          usersExternal: AdminRoutes.WHOIS + '/user',
          threadsInternal: AdminRoutes.WHOIS + '/thread',
          threadsExternal: AdminRoutes.WHOIS + '/thread',
          messagesInternal: AdminRoutes.WHOIS + '/message',
          messagesExternal: AdminRoutes.WHOIS + '/message',
        }}
      />
    </>
  );
}
