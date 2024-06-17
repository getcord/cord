import { useEffect, useMemo } from 'react';

import { FeatureFlagsContext } from 'external/src/context/featureflags/FeatureFlagsContext.ts';
import { useLoadingTimeLogger } from 'external/src/effects/useLoadingTimeLogger.ts';
import {
  featureFlagDefaults,
  FeatureFlags,
} from 'common/const/FeatureFlags.ts';
import {
  useBootstrapQuery,
  useViewerIdentityLiveQuerySubscription,
} from 'external/src/graphql/operations.ts';
import type { PreferencesContextValue } from 'external/src/context/preferences/PreferencesContext.ts';
import { PreferencesContext } from 'external/src/context/preferences/PreferencesContext.ts';
import { useRemotePreferences } from 'external/src/context/preferences/useRemotePreferences.ts';
import type { ApplicationContextType } from 'external/src/context/embed/ApplicationContext.tsx';
import { ApplicationContext } from 'external/src/context/embed/ApplicationContext.tsx';
import { createApplicationPreferences } from 'external/src/context/embed/ApplicationProvider.tsx';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';

export function BootstrapProvider(props: React.PropsWithChildren<any>) {
  const flags = useMemo(() => {
    const f = [];
    for (const key in FeatureFlags) {
      f.push(FeatureFlags[key as keyof typeof FeatureFlags]);
    }
    return f;
  }, []);

  const { data } = useBootstrapQuery({
    variables: {
      featureFlagKeys: flags.map((f) => f.key),
    },
  });

  // Feature flags

  const featureFlagsContextValue = useMemo(() => {
    if (!data) {
      return undefined;
    }
    // Start with the defaults so if any flag didn't come back from the backend,
    // we use the default value and so featureFlags gets the right type.
    const featureFlags = { ...featureFlagDefaults() };
    for (const flag of flags) {
      const returnedValue = data.featureFlags.find((fd) => fd.key === flag.key);
      if (returnedValue) {
        // We have to cast featureFlags to any here because the type of the
        // value from the backend is just string | number | boolean.  It will be
        // right as long as the FeatureFlag typing matches up with the flag
        // values declared in LaunchDarkly, but the type system can't prove that
        // was done correctly.
        (featureFlags as any)[returnedValue.key] = returnedValue.value;
      }
    }
    return { featureFlags };
  }, [data, flags]);

  // Application

  const applicationContextValue = useMemo<ApplicationContextType | null>(() => {
    return createApplicationPreferences(data);
  }, [data]);

  // Preferences

  const [remotePreferences, setRemotePreference] = useRemotePreferences();

  const preferencesContextValue = useMemo<
    PreferencesContextValue | undefined
  >(() => {
    if (!remotePreferences) {
      return undefined;
    }

    return {
      preferences: remotePreferences,
      setPreference: setRemotePreference,
    };
  }, [remotePreferences, setRemotePreference]);

  // Identity

  const { addUsers } = useContextThrowingIfNoProvider(UsersContext);

  const { data: identityData } = useViewerIdentityLiveQuerySubscription({
    variables: { _externalOrgID: undefined },
  });

  useEffect(() => {
    if (identityData?.viewerIdentityLiveQuery.user) {
      addUsers(identityData.viewerIdentityLiveQuery.user);
    }
  }, [addUsers, identityData]);

  const [identityContextValue, organizationContextValue] = useMemo(
    () =>
      identityData?.viewerIdentityLiveQuery.user
        ? [
            {
              user: identityData.viewerIdentityLiveQuery.user,
              email: identityData.viewerIdentityLiveQuery.email ?? null,
              isSlackConnected:
                identityData.viewerIdentityLiveQuery.isSlackConnected,
              organizations: identityData.viewerIdentityLiveQuery.organizations,
            },
            {
              organization: identityData.viewerIdentityLiveQuery.organization,
            },
          ]
        : [undefined, undefined],
    [identityData],
  );

  const ready =
    featureFlagsContextValue &&
    applicationContextValue &&
    preferencesContextValue &&
    identityContextValue &&
    organizationContextValue;

  useLoadingTimeLogger('<BootstrapProvider>', !!ready);

  if (!ready) {
    return null;
  }

  return (
    <FeatureFlagsContext.Provider value={featureFlagsContextValue}>
      <PreferencesContext.Provider value={preferencesContextValue}>
        <ApplicationContext.Provider value={applicationContextValue}>
          <IdentityContext.Provider value={identityContextValue}>
            <OrganizationContext.Provider value={organizationContextValue}>
              {props.children}
            </OrganizationContext.Provider>
          </IdentityContext.Provider>
        </ApplicationContext.Provider>
      </PreferencesContext.Provider>
    </FeatureFlagsContext.Provider>
  );
}
