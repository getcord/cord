/* eslint-disable i18next/no-literal-string */
import { useMemo } from 'react';
import type {
  AtlassianProject,
  JiraConnectionPreferences,
} from 'common/types/index.ts';
import { JIRA_CONNECTION_PREFERENCES } from 'common/const/UserPreferenceKeys.ts';
import { usePreference } from 'external/src/effects/usePreference.ts';
import { useThirdPartyConnectionConfigurationQuery } from 'external/src/graphql/operations.ts';
import { SelectRow } from 'external/src/components/ui/inputs/SelectRow.tsx';
import { ExternalTaskSettingsContainer } from 'external/src/components/chat/composer/ExternalTaskSettingsContainer.tsx';
import { ExternalTaskSettingsLoading2 } from 'external/src/components/2/ExternalTaskSettingsLoading2.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';
import { Thread2Context } from 'external/src/context/thread2/Thread2Context.ts';

export function JiraConnectionSettings() {
  const [jiraConnectionPreferences, setJiraConnectionPreferences] =
    usePreference<JiraConnectionPreferences>(JIRA_CONNECTION_PREFERENCES);

  const { thread } = useContextThrowingIfNoProvider(Thread2Context);
  const { organization } = useContextThrowingIfNoProvider(OrganizationContext);

  const extGroupID = thread?.externalOrgID ?? organization?.externalID;

  const { data, loading } = useThirdPartyConnectionConfigurationQuery({
    skip: !extGroupID,
    variables: { type: 'jira', _externalOrgID: extGroupID },
  });

  const projects = data?.viewer.thirdPartyConnection.configuration as
    | AtlassianProject[]
    | null
    | undefined;

  const project = useMemo(
    () =>
      projects?.find(
        // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
        (project) => project.id === jiraConnectionPreferences?.projectID,
      ),
    [projects, jiraConnectionPreferences?.projectID],
  );

  const issueTypes = useMemo(
    () =>
      project
        ? project.issueTypes
            .filter((issue) => !issue.subtask)
            .map((issue) => ({ value: issue.id, label: issue.name }))
        : [],
    [project],
  );

  const subissueTypes = useMemo(
    () =>
      project
        ? project.issueTypes
            .filter((issue) => issue.subtask)
            .map((issue) => ({ value: issue.id, label: issue.name }))
        : [],
    [project],
  );

  if (loading) {
    <ExternalTaskSettingsLoading2 />;
  }

  if (!data) {
    return null;
  }

  return (
    <ExternalTaskSettingsContainer>
      {projects && (
        <SelectRow
          label="Project:"
          value={jiraConnectionPreferences?.projectID}
          // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
          options={projects.map((project) => ({
            value: project.id,
            label: project.name,
          }))}
          onSelect={(value) => {
            // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
            const project = projects.find((project) => project.id === value);
            if (project) {
              setJiraConnectionPreferences({
                projectID: value,
                issueType: project.issueTypes.find((type) => !type.subtask)!.id,
                subissueType: project.issueTypes.find((type) => type.subtask)
                  ?.id,
              });
            }
          }}
        />
      )}

      {issueTypes.length > 0 && (
        <SelectRow
          label="Task type:"
          value={jiraConnectionPreferences?.issueType}
          options={issueTypes}
          onSelect={(value) =>
            setJiraConnectionPreferences({
              ...jiraConnectionPreferences!,
              issueType: value,
            })
          }
        />
      )}

      {subissueTypes.length > 0 && (
        <SelectRow
          label="TODO type"
          value={jiraConnectionPreferences?.subissueType}
          options={subissueTypes}
          onSelect={(value) =>
            setJiraConnectionPreferences({
              ...jiraConnectionPreferences!,
              subissueType: value,
            })
          }
        />
      )}
    </ExternalTaskSettingsContainer>
  );
}
