import { useMemo, useEffect } from 'react';

import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import { useViewerIdentityLiveQuerySubscription } from 'external/src/graphql/operations.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { useLoadingTimeLogger } from 'external/src/effects/useLoadingTimeLogger.ts';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';

// TODO(flooey): Move this into BootstrapProvider
export function IdentityProvider(props: React.PropsWithChildren<unknown>) {
  const { addUsers } = useContextThrowingIfNoProvider(UsersContext);

  const { data } = useViewerIdentityLiveQuerySubscription({
    variables: { _externalOrgID: undefined },
  });

  useEffect(() => {
    if (data?.viewerIdentityLiveQuery.user) {
      addUsers(data.viewerIdentityLiveQuery.user);
    }
  }, [addUsers, data]);

  const [identityContextValue, organizationContextValue] = useMemo(
    () =>
      data?.viewerIdentityLiveQuery.user
        ? [
            {
              user: data.viewerIdentityLiveQuery.user,
              email: data.viewerIdentityLiveQuery.email ?? null,
              isSlackConnected: data.viewerIdentityLiveQuery.isSlackConnected,
              organizations: data.viewerIdentityLiveQuery.organizations,
            },
            { organization: data.viewerIdentityLiveQuery.organization },
          ]
        : [undefined, undefined],
    [data],
  );

  useLoadingTimeLogger('<IdentityProvider>', !!identityContextValue);

  if (!identityContextValue || !organizationContextValue) {
    return null;
  }

  return (
    <IdentityContext.Provider value={identityContextValue}>
      <OrganizationContext.Provider value={organizationContextValue}>
        {props.children}
      </OrganizationContext.Provider>
    </IdentityContext.Provider>
  );
}
