import type { PropsWithChildren } from 'react';
import { createContext } from 'react';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';
import { useViewerIdentityLiveQuerySubscription } from 'external/src/graphql/operations.ts';
import type { OrganizationFragment } from 'external/src/graphql/operations.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ThreadsProvider2 } from 'external/src/context/threads2/ThreadsProvider2.tsx';

type OrganizationContextProps = {
  organization: OrganizationFragment | null;
};

export const OrganizationContext = createContext<
  OrganizationContextProps | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);

export function OrgOverrideProvider({
  externalOrgID,
  children,
}: PropsWithChildren<{ externalOrgID: string | undefined }>) {
  const { organization } = useContextThrowingIfNoProvider(OrganizationContext);

  // Don't do anything if we aren't actually overriding anything.
  const skip =
    externalOrgID === undefined || organization?.externalID === externalOrgID;

  // - TODO: this should probably use some sort of cache since we'll likely be
  //   overriding to the same org in lots of places.
  // - TODO: should we split the org stuff out of the viewer identity live query?
  const { data, error } = useViewerIdentityLiveQuerySubscription({
    skip,
    variables: { _externalOrgID: externalOrgID },
  });

  if (error) {
    console.error(error.message);
  }

  if (skip) {
    return <>{children}</>;
  }

  if (!data) {
    return null;
  }

  // TODO: we are applying some new provider(s) here to temporarily dodge some
  // annoying issues around providers not understanding multiple orgs. The list
  // is likely to grow.
  //
  // Especially for ThreadsProvider2, this is bad and we should fix it -- having
  // a global cache of threads is pretty nice and makes a lot of UX a lot more
  // smooth, and we're totally busting it here. But for now, this will allow us
  // to make progress on the privacy model work.
  //
  // When they are updated, this should also provide: UsersContext2
  return (
    <OrganizationContext.Provider
      value={{
        organization: data?.viewerIdentityLiveQuery.organization ?? null,
      }}
    >
      <ThreadsProvider2 location="elsewhere">{children}</ThreadsProvider2>
    </OrganizationContext.Provider>
  );
}
