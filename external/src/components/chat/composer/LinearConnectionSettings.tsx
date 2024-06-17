/* eslint-disable i18next/no-literal-string */
import type {
  LinearConnectionPreferences,
  LinearTeam,
} from 'common/types/index.ts';
import { LINEAR_CONNECTION_PREFERENCES } from 'common/const/UserPreferenceKeys.ts';
import { usePreference } from 'external/src/effects/usePreference.ts';
import { useThirdPartyConnectionConfigurationQuery } from 'external/src/graphql/operations.ts';
import { SelectRow } from 'external/src/components/ui/inputs/SelectRow.tsx';
import { ExternalTaskSettingsContainer } from 'external/src/components/chat/composer/ExternalTaskSettingsContainer.tsx';
import { ExternalTaskSettingsLoading2 } from 'external/src/components/2/ExternalTaskSettingsLoading2.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { Thread2Context } from 'external/src/context/thread2/Thread2Context.ts';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';

export function LinearConnectionSettings() {
  const [linearConnectionPreferences, setLinearConnectionPreferences] =
    usePreference<LinearConnectionPreferences>(LINEAR_CONNECTION_PREFERENCES);

  const { thread } = useContextThrowingIfNoProvider(Thread2Context);
  const { organization } = useContextThrowingIfNoProvider(OrganizationContext);

  const extGroupID = thread?.externalOrgID ?? organization?.externalID;

  const { data, loading } = useThirdPartyConnectionConfigurationQuery({
    skip: !extGroupID,
    variables: { type: 'linear', _externalOrgID: extGroupID },
  });

  const teams = data?.viewer.thirdPartyConnection.configuration as
    | LinearTeam[]
    | null
    | undefined;

  const team = teams?.find(
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    (team) => team.id === linearConnectionPreferences?.teamID,
  );

  if (loading) {
    <ExternalTaskSettingsLoading2 />;
  }

  if (!data) {
    return null;
  }

  return (
    <ExternalTaskSettingsContainer>
      {teams && (
        <>
          <SelectRow
            label="Team:"
            name="linearTeam"
            value={linearConnectionPreferences?.teamID}
            // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
            options={teams.map((team) => ({
              value: team.id,
              label: team.name,
            }))}
            onSelect={(value) =>
              setLinearConnectionPreferences({
                teamID: value,
                projectID: undefined,
              })
            }
          />
          {team && team.projects.nodes.length > 0 && (
            <SelectRow
              label="Project:"
              name="linearProject"
              value={linearConnectionPreferences?.projectID}
              options={[
                { value: '', label: 'No project' },
                ...team.projects.nodes.map((project) => ({
                  value: project.id,
                  label: project.name,
                })),
              ]}
              onSelect={(value) =>
                setLinearConnectionPreferences({
                  ...linearConnectionPreferences!,
                  projectID: value,
                })
              }
            />
          )}
        </>
      )}
    </ExternalTaskSettingsContainer>
  );
}
