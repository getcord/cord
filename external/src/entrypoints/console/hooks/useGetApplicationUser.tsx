import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ServerListUser } from '@cord-sdk/types';
import { API_ORIGIN } from 'common/const/Urls.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ConsoleApplicationContext } from 'external/src/entrypoints/console/contexts/ConsoleApplicationContextProvider.tsx';

export function useGetApplicationUser(
  userID: string,
): ServerListUser | undefined {
  const { application } = useContextThrowingIfNoProvider(
    ConsoleApplicationContext,
  );

  const fetchUser = useCallback(async (): Promise<
    ServerListUser | undefined
  > => {
    const response = await fetch(`${API_ORIGIN}/v1/users/${userID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${application!.serverAccessToken}`,
        'X-Cord-Source': 'console',
      },
    });

    const user = (await response.json()) as ServerListUser;
    return user;
  }, [application, userID]);

  const query = useQuery({
    queryKey: ['user', application?.id || 'noapp', userID],
    queryFn: fetchUser,
  });

  return query.data;
}
