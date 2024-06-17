/* eslint-disable i18next/no-literal-string */
import type {
  MondayBoard,
  MondayConnectionPreferences,
} from 'common/types/index.ts';
import { MONDAY_CONNECTION_PREFERENCES } from 'common/const/UserPreferenceKeys.ts';
import { usePreference } from 'external/src/effects/usePreference.ts';
import { useThirdPartyConnectionConfigurationQuery } from 'external/src/graphql/operations.ts';
import { SelectRow } from 'external/src/components/ui/inputs/SelectRow.tsx';
import { ExternalTaskSettingsContainer } from 'external/src/components/chat/composer/ExternalTaskSettingsContainer.tsx';
import { ExternalTaskSettingsLoading2 } from 'external/src/components/2/ExternalTaskSettingsLoading2.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { Thread2Context } from 'external/src/context/thread2/Thread2Context.ts';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';

export function MondayConnectionSettings() {
  const [mondayConnectionPreferences, setMondayConnectionPreferences] =
    usePreference<MondayConnectionPreferences>(MONDAY_CONNECTION_PREFERENCES);

  const { thread } = useContextThrowingIfNoProvider(Thread2Context);
  const { organization } = useContextThrowingIfNoProvider(OrganizationContext);

  const extGroupID = thread?.externalOrgID ?? organization?.externalID;

  const { data, loading } = useThirdPartyConnectionConfigurationQuery({
    skip: !extGroupID,
    variables: { type: 'monday', _externalOrgID: extGroupID },
  });

  const boards = data?.viewer.thirdPartyConnection.configuration as
    | MondayBoard[]
    | null
    | undefined;
  const board = boards?.find(
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    (board) => board.id === mondayConnectionPreferences?.boardID,
  );
  if (loading) {
    return <ExternalTaskSettingsLoading2 />;
  }

  if (!data) {
    return null;
  }

  return (
    <ExternalTaskSettingsContainer>
      {boards && (
        <>
          <SelectRow
            label="Board:"
            name="mondayBoard"
            value={mondayConnectionPreferences?.boardID}
            // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
            options={boards.map((board) => ({
              value: board.id,
              label: board.name,
            }))}
            onSelect={(value) =>
              setMondayConnectionPreferences({
                boardID: value,
              })
            }
          />
          {board && board.groups.length > 0 && (
            <SelectRow
              label="Group:"
              name="mondayGroup"
              value={mondayConnectionPreferences?.groupID}
              options={[
                { value: '', label: 'No group' },
                ...board.groups.map((group) => ({
                  value: group.id,
                  label: group.title,
                })),
              ]}
              onSelect={(value) =>
                setMondayConnectionPreferences({
                  ...mondayConnectionPreferences!,
                  groupID: value,
                })
              }
            />
          )}
        </>
      )}
    </ExternalTaskSettingsContainer>
  );
}
