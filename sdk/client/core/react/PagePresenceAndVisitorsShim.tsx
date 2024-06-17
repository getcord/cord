import { useMemo } from 'react';

import type { PresenceReducerOptions } from '@cord-sdk/react';

import type { PresenceUser } from '@cord-sdk/react/common/lib/presence.ts';
import PresenceReducer from 'sdk/client/core/react/PresenceReducer.tsx';
import { PagePresenceContext } from 'external/src/context/presence/PagePresenceContext.ts';
import { PageVisitorsContext } from 'external/src/context/page/PageVisitorsContext.ts';
import type { NonNullableKeys } from 'common/types/index.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';

export function PagePresenceAndVisitorsShim({
  context,
  location,
  partialMatch,
  excludeViewer,
  onlyPresentUsers,
  children,
}: React.PropsWithChildren<Omit<PresenceReducerOptions, 'exactMatch'>>) {
  return (
    <PresenceReducer
      location={location ?? context}
      partialMatch={partialMatch}
      excludeViewer={excludeViewer}
      onlyPresentUsers={onlyPresentUsers}
    >
      {(users) => (
        <PresenceProviders users={users}>{children}</PresenceProviders>
      )}
    </PresenceReducer>
  );
}

function PresenceProviders({
  users,
  children,
}: React.PropsWithChildren<{ users: PresenceUser[] }>) {
  const {
    byExternalID: { users: userData },
  } = useContextThrowingIfNoProvider(UsersContext);

  const pagePresenceContextValue = useMemo(
    () =>
      users
        .filter((u) => u.present && u.user.id in userData)
        .map((u) => ({
          ...userData[u.user.id],
        })),
    [users, userData],
  );

  const pageVisitorsContextValue = useMemo(
    () => ({
      visitors: users
        .filter(
          (u): u is NonNullableKeys<typeof u, 'lastPresentTime'> =>
            u.lastPresentTime !== null,
        )
        .filter((u) => u.user.id in userData)
        .map((u) => ({
          user: userData[u.user.id],
          lastSeen: new Date(u.lastPresentTime),
        })),
    }),
    [users, userData],
  );

  return (
    <PagePresenceContext.Provider value={pagePresenceContextValue}>
      <PageVisitorsContext.Provider value={pageVisitorsContextValue}>
        {children}
      </PageVisitorsContext.Provider>
    </PagePresenceContext.Provider>
  );
}
