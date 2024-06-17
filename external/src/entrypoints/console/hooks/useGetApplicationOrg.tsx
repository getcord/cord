import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ServerGetGroup } from '@cord-sdk/types';
import { API_ORIGIN } from 'common/const/Urls.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ConsoleApplicationContext } from 'external/src/entrypoints/console/contexts/ConsoleApplicationContextProvider.tsx';

export function useGetApplicationOrg(orgID: string) {
  const { application } = useContextThrowingIfNoProvider(
    ConsoleApplicationContext,
  );

  const fetchOrg = useCallback(async (): Promise<
    ServerGetGroup | undefined | null
  > => {
    const response = await fetch(`${API_ORIGIN}/v1/groups/${orgID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${application!.serverAccessToken}`,
        'X-Cord-Source': 'console',
      },
    });

    const org = (await response.json()) as ServerGetGroup;

    if ('error' in org) {
      return null;
    }
    return org;
  }, [application, orgID]);

  const query = useQuery({
    queryKey: ['org', application?.id || 'noapp', orgID],
    queryFn: fetchOrg,
  });

  return { org: query.data, refetch: query.refetch };
}
