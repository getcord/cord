import { useCallback, useMemo } from 'react';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import type {
  UpdateMessageMutationVariables,
  TaskInput,
  AnnotationAttachmentInput,
  TaskFragment,
} from 'external/src/graphql/operations.ts';
import { useUpdateMessageMutation } from 'external/src/graphql/operations.ts';
import type {
  FileAttachmentInput,
  MessageContent,
  ReferencedUserData,
  UUID,
} from 'common/types/index.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import {
  taskFragmentToInput,
  updateTaskDoneStatus,
} from 'external/src/lib/util.ts';
import type { MessageWithTask } from 'external/src/graphql/custom.ts';
import { ThreadsContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { Thread2Context } from 'external/src/context/thread2/Thread2Context.ts';
import { UsersContext } from 'external/src/context/users/UsersContext.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';
import type { UpdateMessageFields } from 'external/src/context/threads2/actions/UpdateMessage.ts';

export function useMessageUpdater() {
  const { organization } = useContextThrowingIfNoProvider(OrganizationContext);
  const threadsContext = useContextThrowingIfNoProvider(ThreadsContext2);
  const threadContext = useContextThrowingIfNoProvider(Thread2Context);
  const { user } = useContextThrowingIfNoProvider(IdentityContext);
  const {
    byInternalID: { usersByID },
  } = useContextThrowingIfNoProvider(UsersContext);

  const { logEvent } = useLogger();

  const [updateMessageMutation] = useUpdateMessageMutation();

  const updateMessage = useCallback(
    (
      localVariables: Partial<UpdateMessageFields>,
      mutationVariables: Omit<UpdateMessageMutationVariables, '_externalOrgID'>,
    ) => {
      // local optimistic message rendering
      threadsContext.updateMessage(threadContext.threadID, localVariables);
      // send message to api through updateMessage mutation
      void updateMessageMutation({
        variables: {
          ...mutationVariables,
          _externalOrgID: organization?.externalID ?? null,
        },
      });
    },
    [
      organization?.externalID,
      threadContext.threadID,
      threadsContext,
      updateMessageMutation,
    ],
  );

  const editMessage = useCallback(
    (variables: {
      id: UUID;
      content: MessageContent;
      fileAttachments: FileAttachmentInput[];
      annotationAttachments: AnnotationAttachmentInput[];
      task: TaskFragment | null;
      taskInput: TaskInput | null | undefined;
      referencedUsers: ReferencedUserData[];
    }) => {
      logEvent('message-updated');
      const lastUpdatedTimestamp = new Date().toISOString();
      const { taskInput } = variables;
      updateMessage(
        {
          ...variables,
          lastUpdatedTimestamp,
          referencedUserData: variables.referencedUsers,
        },
        {
          ...variables,
          task: taskInput,
          deleted: undefined,
        },
      );
    },
    [logEvent, updateMessage],
  );

  const deleteMessage = useCallback(
    (id: UUID) => {
      logEvent('message-deleted');
      const deletedTimestamp = new Date().toISOString();
      updateMessage(
        { id, deletedTimestamp },
        {
          id,
          deleted: true,
          content: undefined,
          fileAttachments: undefined,
          annotationAttachments: undefined,
          task: undefined,
        },
      );
    },
    [logEvent, updateMessage],
  );

  const undoDeleteMessage = useCallback(
    (id: UUID) => {
      logEvent('message-delete-undone');
      updateMessage(
        { id, deletedTimestamp: null },
        {
          id,
          deleted: false,
          content: undefined,
          annotationAttachments: undefined,
          fileAttachments: undefined,
          task: undefined,
        },
      );
    },
    [logEvent, updateMessage],
  );

  // Private method called by exposed task methods
  const updateTask = useCallback(
    (id: UUID, task: TaskFragment, taskInput: TaskInput) => {
      updateMessage(
        { id, task },
        {
          id,
          task: taskInput,
          content: undefined,
          annotationAttachments: undefined,
          fileAttachments: undefined,
          deleted: undefined,
        },
      );
    },
    [updateMessage],
  );

  // Set task and todos to done / not done
  const setTaskDoneStatus = useCallback(
    (message: MessageWithTask, done: boolean, eventLogMethod?: string) => {
      const task = updateTaskDoneStatus(message.task, done, user);
      logEvent('update-task', {
        method: eventLogMethod,
        task_done: done,
        num_todos: task.todos.length,
      });
      const taskInput = taskFragmentToInput(task, 'update');
      updateTask(message.id, task, taskInput);
    },
    [updateTask, user, logEvent],
  );

  // Set done status of a todo, updating the task done status (calculated from todos) too
  // Set doneStatusLastUpdatedBy to null, as that refers to the Task
  // (It would be confusing if you marked the 10th todo done and
  //  it says you marked the whole task as done)
  const setTodoDoneStatus = useCallback(
    (message: MessageWithTask, todoID: UUID, done: boolean) => {
      const todos = message.task.todos.map((todo) =>
        todo.id === todoID ? { ...todo, done } : todo,
      );
      const allTodosDone = todos.every((todo) => todo.done);

      const task = {
        ...message.task,
        todos,
        done: allTodosDone,
        doneStatusLastUpdatedBy: null,
      };
      logEvent('update-task', {
        method: 'checked-todo',
        task_done: allTodosDone,
        num_todos: todos.length,
        to_do_id: todoID,
        todo_done: done,
      });
      const taskInput = taskFragmentToInput(task, 'remove');

      updateTask(message.id, task, taskInput);
    },
    [updateTask, logEvent],
  );

  const setAssigneeIDs = useCallback(
    (message: MessageWithTask, assigneeIDs: UUID[]) => {
      // Input to send to server
      const taskInput = taskFragmentToInput(message.task);
      taskInput.assigneeIDs = assigneeIDs;

      // New task for local optimistic rendering
      const task: TaskFragment = {
        ...message.task,
        assignees: usersByID(...assigneeIDs),
      };

      logEvent('update-task', {
        method: 'task-menu',
        assignees: assigneeIDs,
      });
      updateTask(message.id, task, taskInput);
    },
    [usersByID, updateTask, logEvent],
  );

  // Remove task from message
  const removeTask = useCallback(
    (id: UUID, content: MessageContent) => {
      logEvent('remove-task', { method: 'task-menu' });
      updateMessage(
        { id, task: null, content },
        {
          id,
          task: null,
          content,
          fileAttachments: undefined,
          annotationAttachments: undefined,
          deleted: undefined,
        },
      );
    },
    [updateMessage, logEvent],
  );

  return useMemo(
    () => ({
      editMessage,
      deleteMessage,
      undoDeleteMessage,
      removeTask,
      setTaskDoneStatus,
      setTodoDoneStatus,
      setAssigneeIDs,
    }),
    [
      deleteMessage,
      editMessage,
      undoDeleteMessage,
      removeTask,
      setTaskDoneStatus,
      setTodoDoneStatus,
      setAssigneeIDs,
    ],
  );
}
