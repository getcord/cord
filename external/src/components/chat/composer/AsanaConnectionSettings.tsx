/* eslint-disable i18next/no-literal-string */
import type {
  AsanaConnectionPreferences,
  AsanaProject,
} from 'common/types/index.ts';
import { ASANA_CONNECTION_PREFERENCES } from 'common/const/UserPreferenceKeys.ts';
import { usePreference } from 'external/src/effects/usePreference.ts';
import { useThirdPartyConnectionConfigurationQuery } from 'external/src/graphql/operations.ts';
import { SelectRow } from 'external/src/components/ui/inputs/SelectRow.tsx';
import { ExternalTaskSettingsContainer } from 'external/src/components/chat/composer/ExternalTaskSettingsContainer.tsx';
import { ExternalTaskSettingsLoading2 } from 'external/src/components/2/ExternalTaskSettingsLoading2.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { Thread2Context } from 'external/src/context/thread2/Thread2Context.ts';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';

const NO_PROJECT_CONNECTED = 'no_project_connected';

export function AsanaConnectionSettings() {
  const [asanaConnectionPreferences, setAsanaConnectionPreferences] =
    usePreference<AsanaConnectionPreferences>(ASANA_CONNECTION_PREFERENCES);

  const { thread } = useContextThrowingIfNoProvider(Thread2Context);
  const { organization } = useContextThrowingIfNoProvider(OrganizationContext);

  const extGroupID = thread?.externalOrgID ?? organization?.externalID;

  const { data, loading } = useThirdPartyConnectionConfigurationQuery({
    skip: !extGroupID,
    variables: { type: 'asana', _externalOrgID: extGroupID },
  });

  const projects = data?.viewer.thirdPartyConnection.configuration as
    | AsanaProject[]
    | null
    | undefined;

  const preferredProjectID =
    asanaConnectionPreferences?.projectID ?? NO_PROJECT_CONNECTED;

  if (loading) {
    return <ExternalTaskSettingsLoading2 />;
  }

  if (!projects) {
    return null;
  }
  return (
    <ExternalTaskSettingsContainer>
      <SelectRow
        label="Project:"
        value={preferredProjectID}
        options={[
          ...projects.map((project) => ({
            value: project.gid,
            label: project.name,
          })),
          { value: NO_PROJECT_CONNECTED, label: 'No project' },
        ]}
        onSelect={(value) =>
          setAsanaConnectionPreferences({
            projectID: value === NO_PROJECT_CONNECTED ? undefined : value,
          })
        }
      />
    </ExternalTaskSettingsContainer>
  );
}
