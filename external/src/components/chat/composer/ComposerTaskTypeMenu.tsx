import { useMemo } from 'react';
import { ClipboardTaskIcon } from 'external/src/components/ui/icons/ClipboardTask.tsx';
import JiraIcon from 'external/src/static/provider-icons/jira.svg';
import AsanaIcon from 'external/src/static/provider-icons/asana.svg';
import LinearIcon from 'external/src/static/provider-icons/linear.svg';
import type {
  TaskInputType,
  ThirdPartyConnectionType,
} from 'external/src/graphql/operations.ts';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';
import type { IconType } from 'external/src/components/ui2/icons/Icon2.tsx';
import { Menu2 } from 'external/src/components/ui2/Menu2.tsx';
import { MenuItem2 } from 'external/src/components/ui2/MenuItem2.tsx';
import { MondayIcon } from '@cord-sdk/react/common/icons/customIcons/MondayIcon.tsx';
import { FeatureFlags } from 'common/const/FeatureFlags.ts';
import { useFeatureFlag } from 'external/src/effects/useFeatureFlag.ts';

type Props = {
  type: TaskInputType;
  onTypeSelected: (type: TaskInputType) => void;
  onClose: () => void;
  width?: number;
  thirdPartyConnections: {
    connected: (type: ThirdPartyConnectionType) => boolean;
  };
};

export function ComposerTaskTypeMenu({
  onTypeSelected,
  onClose,
  thirdPartyConnections,
}: Props) {
  const mondayTasks = useFeatureFlag(FeatureFlags.MONDAY_TASKS);

  const menuItems = useMemo(
    () => [
      {
        id: 'cord' as const,
        title: 'Task',
        icon: <ClipboardTaskIcon size={16} color={'GREY_DARK'} />,
        icon2: 'Clipboard',
        onClick: () => onTypeSelected('cord'),
      },
      {
        id: 'jira' as const,
        title: thirdPartyConnections.connected('jira')
          ? 'Jira'
          : 'Connect Jira',
        icon: <JiraIcon style={{ width: 16, height: 16, display: 'block' }} />,

        icon2: 'Jira',
        onClick: () => onTypeSelected('jira'),
      },
      {
        id: 'asana' as const,
        title: thirdPartyConnections.connected('asana')
          ? 'Asana'
          : 'Connect Asana',
        icon: <AsanaIcon style={{ width: 16, height: 16, display: 'block' }} />,
        icon2: 'Asana',

        onClick: () => onTypeSelected('asana'),
      },
      {
        id: 'linear' as const,
        title: thirdPartyConnections.connected('linear')
          ? 'Linear'
          : 'Connect Linear',
        icon: (
          <LinearIcon style={{ width: 16, height: 16, display: 'block' }} />
        ),
        icon2: 'Linear',
        onClick: () => onTypeSelected('linear'),
      },
      ...(mondayTasks
        ? [
            {
              id: 'monday' as const,
              title: thirdPartyConnections.connected('monday')
                ? 'Monday'
                : 'Connect Monday',
              icon: (
                <MondayIcon
                  style={{ width: 16, height: 16, display: 'block' }}
                />
              ),
              icon2: 'Monday',
              onClick: () => onTypeSelected('monday'),
            },
          ]
        : []),
    ],
    [onTypeSelected, thirdPartyConnections, mondayTasks],
  );

  return (
    <Menu2 fullWidth={true}>
      {menuItems.map((menuItem) => {
        return (
          <MenuItem2
            key={menuItem.id}
            leftItem={<Icon2 name={menuItem.icon2 as IconType} />}
            label={menuItem.title}
            onClick={() => {
              onClose();
              menuItem.onClick();
            }}
          />
        );
      })}
    </Menu2>
  );
}
