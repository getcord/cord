/* eslint-disable i18next/no-literal-string */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Transforms } from 'slate';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { isNotNull, capitalizeFirstLetter } from 'common/util/index.ts';
import type { MessageWithTask } from 'external/src/graphql/custom.ts';
import { useMessageUpdater } from 'external/src/effects/useMessageUpdater.ts';
import { MessageTaskMenu } from 'external/src/components/chat/message/MessageTaskMenu.tsx';
import { useUpdatingRef } from 'external/src/effects/useUpdatingRef.ts';
import { createEditor } from 'external/src/editor/createEditor.ts';
import { EditorCommands } from 'external/src/editor/commands.ts';
import { isUserAuthorOfMessage, taskHasTodos } from 'external/src/lib/util.ts';
import { TaskReassigner } from 'external/src/components/chat/messageReassigner/TaskReassigner.tsx';
import type { ThirdPartyConnectionType } from 'external/src/graphql/operations.ts';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import { BoxWithPopper2 } from 'external/src/components/ui2/BoxWithPopper2.tsx';
import { WithTooltip2 } from 'external/src/components/ui2/WithTooltip2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import type { IconType } from 'external/src/components/ui2/icons/Icon2.tsx';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';
import { Pill2 } from 'external/src/components/ui2/Pill2.tsx';
import { Button2 } from 'external/src/components/ui2/Button2.tsx';
import type { TaskPreviewData, UUID } from 'common/types/index.ts';
import {
  isJiraTask,
  isLinearTask,
} from 'external/src/components/chat/message/MessageExternalTask.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { BasicButtonWithUnderline2 } from 'external/src/components/ui2/BasicButtonWithUnderline2.tsx';
import { useCanEditExternalTask } from 'external/src/components/chat/message/useCanEditExternalTask.ts';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { Row2 } from 'external/src/components/ui2/Row2.tsx';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { CheckboxAndLabel2 } from 'external/src/components/2/CheckboxAndLabel2.tsx';

const CORD_TWO_MENU_OFFSET = 4;

const useStyles = createUseStyles({
  checkBoxContainer2: {
    padding: cssVar('space-4xs'),
  },
  flexOne: {
    flex: 1,
  },
  minWidth: {
    minWidth: 0,
  },
  taskTextButton2: {
    textAlign: 'left',
    width: '100%',
  },
  deepLinked: {
    backgroundColor: cssVar('message-highlight-pill-background-color'),
  },
});

type Props = {
  message: MessageWithTask;
  isMessageBeingEdited: boolean;
  deepLinked?: boolean;
};

export function MessageTask2({
  message,
  isMessageBeingEdited,
  deepLinked,
}: Props) {
  const classes = useStyles();
  const {
    byInternalID: { userByID, usersByID },
  } = useContextThrowingIfNoProvider(UsersContext);

  const [taskMenuOpen, setTaskMenuOpen] = useState(false);
  const [reassigning, setReassigning] = useState(false);

  const { removeTask, setTaskDoneStatus, setAssigneeIDs } = useMessageUpdater();

  const todosExist = useMemo(() => taskHasTodos(message.task), [message.task]);

  const setDone = useCallback(
    (done: boolean, eventLogMethod?: string) => {
      setTaskDoneStatus(message, done, eventLogMethod);
    },
    [message, setTaskDoneStatus],
  );

  const messageContentRef = useUpdatingRef(message.content);

  const removeTaskAndAmendMessageContent = useCallback(() => {
    const temporaryEditor = createEditor();
    Transforms.insertNodes(temporaryEditor, messageContentRef.current as any);
    EditorCommands.convertTodosToBullets(temporaryEditor);
    EditorCommands.convertAssigneesToText(temporaryEditor);
    removeTask(message.id, temporaryEditor.children as any);
  }, [removeTask, message.id, messageContentRef]);

  const assignees = usersByID(
    ...message.task.assignees.filter(isNotNull).map((user) => user.id),
  );

  const taskStatusText = useMemo(() => {
    const assigneesText = !assignees.length
      ? 'Task'
      : assignees.length === 1
      ? `Assigned to ${assignees[0].displayName}`
      : `Assigned to ${assignees.length} people`;

    if (!todosExist) {
      if (!message.task.done) {
        return assigneesText;
      } else {
        const doneBy = message.task.doneStatusLastUpdatedBy
          ? userByID(message.task.doneStatusLastUpdatedBy.id)
          : null;
        return doneBy
          ? `${doneBy.displayName} marked as done`
          : 'Marked as done';
      }
    }

    const todos = message.task.todos;
    const doneCount = todos.reduce(
      // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      (doneCount, todo) => (todo.done ? (doneCount += 1) : doneCount),
      0,
    );
    if (doneCount === 0) {
      return assigneesText;
    }
    // if some checkboxes are marked
    if (doneCount > 0 && doneCount < todos.length) {
      return `${doneCount}/${todos.length} marked as done`;
    }
    // If all are marked
    return 'Marked as done';
  }, [
    assignees,
    userByID,
    todosExist,
    message.task.todos,
    message.task.done,
    message.task.doneStatusLastUpdatedBy,
  ]);

  const assigneeNames = useMemo(() => {
    const allTodosNotDone = message.task.todos.every((todo) => !todo.done);
    if (assignees.length > 1 && !message.task.done && allTodosNotDone) {
      return assignees.map((user) => user.displayName).join(', ');
    }

    return null;
  }, [assignees, message]);

  const { user } = useContextThrowingIfNoProvider(IdentityContext);
  const viewerIsAuthorOfMessage = isUserAuthorOfMessage(
    message,
    user.externalID,
  );

  const externalTaskData = message.task.thirdPartyReferences?.[0] ?? null;

  const externalTaskType = useMemo(() => {
    if (!externalTaskData?.type) {
      return null;
    }
    return capitalizeFirstLetter(externalTaskData.type.toString());
  }, [externalTaskData?.type]);

  const externalTaskTitle = useMemo(() => {
    if (!externalTaskData) {
      return null;
    }
    const previewData = externalTaskData.previewData as TaskPreviewData | null;
    if (!previewData) {
      return `Creating task in ${externalTaskType}...`;
    }

    if (isJiraTask(previewData)) {
      return `${previewData.key}: ${previewData.title}`;
    }

    if (isLinearTask(previewData)) {
      return `${previewData.identifier}: ${previewData.title}`;
    }

    return previewData.title;
  }, [externalTaskData, externalTaskType]);

  const [canEditExternalTask, setCanEditExternalTask] = useState<boolean>();
  const taskEditable = !externalTaskData || canEditExternalTask !== false;

  return (
    <>
      <BoxWithPopper2
        popperElement={
          <MessageTaskMenu
            task={message.task}
            setDone={setDone}
            canRemoveTask={viewerIsAuthorOfMessage}
            removeTask={removeTaskAndAmendMessageContent}
            closeMenu={() => setTaskMenuOpen(false)}
            onClickReassign={() => setReassigning(true)}
          />
        }
        popperElementVisible={taskMenuOpen}
        withBlockingOverlay={true}
        popperPosition="bottom-start"
        onShouldHide={() => setTaskMenuOpen(false)}
        popperWidth="full"
        offset={CORD_TWO_MENU_OFFSET}
        marginTop="2xs"
      >
        {reassigning ? (
          <Pill2
            className={cx([{ [classes.deepLinked]: deepLinked }])}
            backgroundColor="base-strong"
            leftElement={
              <TaskReassigner
                message={message}
                stopReassigning={() => setReassigning(false)}
                setAssigneeIDs={setAssigneeIDs}
              />
            }
            middleElement={null}
            rightElement={null}
          />
        ) : (
          <Pill2
            backgroundColor={
              isMessageBeingEdited ? 'base-x-strong' : 'base-strong'
            }
            className={cx([{ [classes.deepLinked]: deepLinked }])}
            onClick={
              externalTaskData
                ? undefined
                : (event) => {
                    event.stopPropagation();
                    setTaskMenuOpen(true);
                  }
            }
            leftElement={
              !taskHasTodos(message.task) ? (
                <WithTooltip2
                  className={classes.checkBoxContainer2}
                  label={message.task.done ? 'Mark not done' : 'Mark done'}
                  tooltipDisabled={!taskEditable}
                >
                  <CheckboxAndLabel2
                    checked={message.task.done}
                    onChange={() => setDone(!message.task.done, 'checked-task')}
                    ariaLabel="message task checkbox"
                  />
                </WithTooltip2>
              ) : null
            }
            middleElement={
              <Row2 className={classes.minWidth}>
                <WithTooltip2
                  label={assigneeNames}
                  className={cx(classes.flexOne, classes.minWidth)}
                  marginRight="4xs"
                >
                  <Text2 font="small" ellipsis color="content-emphasis">
                    {externalTaskData ? externalTaskTitle : taskStatusText}
                  </Text2>
                </WithTooltip2>
                {!externalTaskData && <Icon2 name="DownSolid" size="small" />}
              </Row2>
            }
            rightElement={
              externalTaskData?.previewData?.url ? (
                <WithTooltip2 label={`Open in ${externalTaskType}`}>
                  <Button2
                    icon={externalTaskType as IconType}
                    size="small"
                    buttonType="secondary"
                    onClick={(event) => {
                      event.stopPropagation();
                      window.open(
                        (externalTaskData.previewData as TaskPreviewData).url,
                      );
                    }}
                  />
                </WithTooltip2>
              ) : (
                <Box2 padding="3xs">
                  <Icon2 name="Clipboard" />
                </Box2>
              )
            }
          />
        )}
      </BoxWithPopper2>
      {externalTaskData && (
        <ExternalTaskConnector
          taskID={message.task.id}
          taskType={externalTaskData.type}
          setCanEditExternalTask={setCanEditExternalTask}
        />
      )}
    </>
  );
}

function ExternalTaskConnector({
  taskID,
  taskType,
  setCanEditExternalTask,
}: {
  taskID: UUID;
  taskType: ThirdPartyConnectionType;
  setCanEditExternalTask: (canEdit: boolean | undefined) => void;
}) {
  const { canEdit, reconnect } = useCanEditExternalTask(taskID, taskType);

  useEffect(() => {
    setCanEditExternalTask(canEdit);
  }, [canEdit, setCanEditExternalTask]);

  if (canEdit === false) {
    return (
      <Text2 marginTop="2xs" font="small-light" color="content-secondary">
        To edit,{' '}
        <BasicButtonWithUnderline2
          label={`connect your ${capitalizeFirstLetter(taskType)} account`}
          onClick={reconnect}
        />
      </Text2>
    );
  }
  return null;
}
