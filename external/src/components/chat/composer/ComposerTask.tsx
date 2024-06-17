import { useMemo, useCallback, useState, useEffect } from 'react';
import { createUseStyles } from 'react-jss';

import { assert, capitalizeFirstLetter } from 'common/util/index.ts';
import { ComposerTaskTypeMenu } from 'external/src/components/chat/composer/ComposerTaskTypeMenu.tsx';
import { AsanaConnectionSettings } from 'external/src/components/chat/composer/AsanaConnectionSettings.tsx';
import { LinearConnectionSettings } from 'external/src/components/chat/composer/LinearConnectionSettings.tsx';
import { JiraConnectionSettings } from 'external/src/components/chat/composer/JiraConnectionSettings.tsx';
import { Sizes } from 'common/const/Sizes.ts';
import { ComposerContext } from 'external/src/context/composer/ComposerContext.ts';
import { TASK_PROVIDER_NAMES } from 'external/src/common/strings.ts';
import { useThirdPartyConnections } from 'external/src/effects/useThirdPartyConnections.ts';
import type {
  TaskInputType,
  ThirdPartyConnectionType,
} from 'external/src/graphql/operations.ts';
import { useComposerTask } from 'external/src/components/chat/composer/hooks/useComposerTask.ts';
import { Button2 } from 'external/src/components/ui2/Button2.tsx';
import type { IconType } from 'external/src/components/ui2/icons/Icon2.tsx';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';
import { WithTooltip2 } from 'external/src/components/ui2/WithTooltip2.tsx';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { ButtonGroup2 } from 'external/src/components/ui2/ButtonGroup2.tsx';
import { Thread2Context } from 'external/src/context/thread2/Thread2Context.ts';
import { BoxWithPopper2 } from 'external/src/components/ui2/BoxWithPopper2.tsx';
import { Pill2 } from 'external/src/components/ui2/Pill2.tsx';
import { Row2 } from 'external/src/components/ui2/Row2.tsx';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { MondayConnectionSettings } from 'external/src/components/chat/composer/MondayConnectionSettings.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';

const useStyles = createUseStyles({
  text: {
    flex: 1,
  },
  active: {
    backgroundColor: cssVar('secondary-button-background-color--hover'),
    color: cssVar('secondary-button-content-color--hover'),
  },
});

function ExternalTaskPreference({ type }: { type: TaskInputType }) {
  if (type === 'cord') {
    return null;
  }

  switch (type) {
    case 'asana':
      return <AsanaConnectionSettings />;
    case 'jira':
      return <JiraConnectionSettings />;
    case 'linear':
      return <LinearConnectionSettings />;
    case 'trello':
      return null;
    case 'monday':
      return <MondayConnectionSettings />;
  }
}

export function ComposerTask() {
  const classes = useStyles();

  const composerTask = useComposerTask();
  const { removeTask, setTaskType } = composerTask;
  const task = composerTask.task;
  assert(!!task, 'No task provided to ComposerTask');

  const {
    byInternalID: { usersByID },
  } = useContextThrowingIfNoProvider(UsersContext);
  const assignees = useMemo(
    () => usersByID(...task.assigneeIDs),
    [usersByID, task.assigneeIDs],
  );
  const {
    state: { editingMessageID },
  } = useContextThrowingIfNoProvider(ComposerContext);
  const { thread } = useContextThrowingIfNoProvider(Thread2Context);

  const existingTaskHasExternalTask = useMemo(() => {
    const threadData = thread;

    if (!threadData) {
      return false;
    }

    const existingTask = threadData?.messages.find(
      (message) => message.id === editingMessageID,
    )?.task;

    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    return existingTask?.thirdPartyReferences?.some((task) => !!task.type);
  }, [editingMessageID, thread]);

  // When editing a message, you can only change a Cord task
  // to be an external one.
  const allowChangesToExternalTask =
    editingMessageID === null || !existingTaskHasExternalTask;

  const [taskTypeMenuVisible, setTaskTypeMenuVisible] = useState(false);
  const [taskPreferencesVisible, setTaskPreferencesVisible] = useState(false);

  const [waitForConnection, setWaitForConnection] =
    useState<ThirdPartyConnectionType>();

  const thirdPartyConnections = useThirdPartyConnections(waitForConnection);

  const onTypeSelected = useCallback(
    (type: TaskInputType) => {
      if (type !== 'cord' && !thirdPartyConnections.connected(type)) {
        setWaitForConnection(type);
        setTaskPreferencesVisible(false);
        thirdPartyConnections.startConnectFlow(type);
      } else {
        setWaitForConnection(undefined);
        setTaskType(type);
        setTaskPreferencesVisible(false);
      }
    },
    [setTaskType, thirdPartyConnections],
  );

  useEffect(() => {
    if (
      waitForConnection &&
      thirdPartyConnections.connected(waitForConnection)
    ) {
      setTaskType(waitForConnection);
      setWaitForConnection(undefined);
      setTaskPreferencesVisible(true);
    }
  }, [thirdPartyConnections, waitForConnection, setTaskType]);

  const toggleTaskTypeMenu = useCallback(
    () => setTaskTypeMenuVisible((show) => !show),
    [],
  );

  const closeTaskTypeMenu = useCallback(
    () => setTaskTypeMenuVisible(false),
    [],
  );

  const taskIconName = useMemo(() => {
    switch (task.type) {
      case 'cord':
        return 'Clipboard';
      case 'trello':
        return null;
      default:
        return capitalizeFirstLetter(task.type) as IconType;
    }
  }, [task.type]);

  // ideally task.type should never be of type of an unconnected task manager -
  // but just in case
  const taskTypeIsExternalAndConnected =
    task.type !== 'cord' && thirdPartyConnections.connected(task.type);

  const getTaskName = () => {
    if (task.type === 'cord') {
      return 'Task';
    } else {
      return `${TASK_PROVIDER_NAMES[task.type]} task`;
    }
  };

  return (
    <>
      <BoxWithPopper2
        popperElement={
          <ComposerTaskTypeMenu
            type={task.type}
            onTypeSelected={onTypeSelected}
            onClose={closeTaskTypeMenu}
            thirdPartyConnections={thirdPartyConnections}
          />
        }
        popperPosition="top-start"
        popperElementVisible={taskTypeMenuVisible}
        offset={Sizes.SMALL}
        onShouldHide={closeTaskTypeMenu}
        popperWidth="full"
        marginLeft={'2xs'}
        marginRight={'2xs'}
      >
        <Pill2
          backgroundColor="base-strong"
          onClick={toggleTaskTypeMenu}
          leftElement={
            !taskIconName ? null : <Icon2 name={taskIconName} size="large" />
          }
          middleElement={
            <Row2>
              <Text2
                ellipsis={true}
                font="small"
                marginRight="4xs"
                color="content-emphasis"
              >
                {getTaskName()}
                {assignees.length > 0 &&
                  (assignees.length === 1 ? (
                    <>: assigned to {assignees[0].displayName}</>
                  ) : (
                    <>: assigned to {assignees.length} people</>
                  ))}
              </Text2>
              <Icon2 name={'DownSolid'} size="small" />
            </Row2>
          }
          rightElement={
            <ButtonGroup2>
              {taskTypeIsExternalAndConnected && allowChangesToExternalTask && (
                <WithTooltip2
                  label={
                    taskPreferencesVisible
                      ? 'Close task settings'
                      : 'Open task settings'
                  }
                >
                  <Button2
                    icon="Faders"
                    buttonType="secondary"
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      setTaskPreferencesVisible((visible) => !visible);
                    }}
                    additionalClassName={
                      taskPreferencesVisible ? classes.active : undefined
                    }
                  />
                </WithTooltip2>
              )}
              <WithTooltip2 label="Remove task">
                <Button2
                  icon="X"
                  buttonType="secondary"
                  size="small"
                  onClick={removeTask}
                />
              </WithTooltip2>
            </ButtonGroup2>
          }
        />
      </BoxWithPopper2>
      {taskPreferencesVisible && <ExternalTaskPreference type={task.type} />}
    </>
  );
}
