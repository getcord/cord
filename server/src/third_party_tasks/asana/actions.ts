import { QueryTypes } from 'sequelize';

import type {
  AsanaConnectionPreferences,
  AsanaTaskPreviewData,
  UUID,
} from 'common/types/index.ts';
import type { AsanaUserInfo } from 'server/src/third_party_tasks/asana/api.ts';
import {
  addAsanaTaskFollowers,
  addCommentOnAsanaTask,
  attachFile,
  createTask,
  getAccessToken,
  getAsanaProjects,
  getAsanaUsers,
  getTask,
  setAsanaTaskAsignee,
  getUserInfo,
  setTaskClosed,
  subscribeToUpdates,
} from 'server/src/third_party_tasks/asana/api.ts';
import {
  assertViewerHasIdentity,
  assertViewerHasOrg,
  assertViewerHasUser,
  Viewer,
} from 'server/src/auth/index.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { TaskEntity } from 'server/src/entity/task/TaskEntity.ts';
import { TaskThirdPartyReference } from 'server/src/entity/task_third_party_reference/TaskThirdPartyReferenceEntity.ts';
import { ThirdPartyConnectionEntity } from 'server/src/entity/third_party_connection/ThirdPartyConnectionEntity.ts';
import { userDisplayName } from 'server/src/entity/user/util.ts';
import {
  taskTitleFromMessageContent,
  textFromNodeRecursive,
  todoNodesFromMessage,
} from '@cord-sdk/react/common/lib/messageNode.ts';
import {
  getExternalAuthData,
  getTaskFooterText,
  handleThirdPartyException,
  publishMessageUpdateForTask,
  removeExternalConnection,
} from 'server/src/third_party_tasks/util.ts';
import type { TaskTodoEntity } from 'server/src/entity/task_todo/TaskTodoEntity.ts';
import { cache, cacheKey } from 'server/src/util/cache.ts';
import type { FileEntity } from 'server/src/entity/file/FileEntity.ts';
import { UserPreferenceEntity } from 'server/src/entity/user_preference/UserPreferenceEntity.ts';
import { ASANA_CONNECTION_PREFERENCES } from 'common/const/UserPreferenceKeys.ts';
import { messageContentToAsanaHtml } from 'server/src/third_party_tasks/asana/util.ts';
import { TaskAssigneeEntity } from 'server/src/entity/task_assignee/TaskAssigneeEntity.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { S3BucketLoader } from 'server/src/entity/s3_bucket/S3BucketLoader.ts';
import { anonymousLogger, Logger } from 'server/src/logging/Logger.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { UserLoader } from 'server/src/entity/user/UserLoader.ts';

type CachedAsanaCredentials = {
  accessToken: string;
  workspace: string;
};
async function getAsanaCredentials(viewer: Viewer) {
  try {
    const { userID, orgID } = assertViewerHasIdentity(viewer);

    const key = cacheKey({ type: 'asana_credentials', userID, orgID });

    let credentials = cache.get<CachedAsanaCredentials>(key);
    if (credentials !== undefined) {
      return credentials;
    }
    const externalData = await getExternalAuthData(viewer, 'asana');
    if (externalData === null) {
      return null;
    }
    const response = await getAccessToken(externalData.refreshToken);
    if (!response.success) {
      if (response.error === 'invalid_grant') {
        cache.del(key);
        await removeExternalConnection(viewer, 'asana');
      }
      throw new Error(response.error);
    }
    credentials = {
      accessToken: response.access_token,
      workspace: externalData.workspace,
    };
    cache.set<CachedAsanaCredentials>(
      key,
      credentials,
      // subtract a small amount of time (30 seconds) to avoid the risk of the
      // action happening between when the token expires as determined by the
      // remote server versus when we receive and store it here (probably a
      // couple of seconds).
      response.expires_in - 30,
    );
    return credentials;
  } catch (e) {
    handleThirdPartyException(
      `Couldn't obtain Asana credentials`,
      e,
      'asana',
      viewer,
    );
    return null;
  }
}

async function getSelectedProject(viewer: Viewer) {
  const userID = assertViewerHasUser(viewer);
  // TODO: In this case, wouldn't we want to allow a different selection for a
  // different orgID?
  const response = await UserPreferenceEntity.findOne({
    where: {
      userID,
      key: ASANA_CONNECTION_PREFERENCES,
    },
  });

  return response ? (response.value as AsanaConnectionPreferences) : undefined;
}

export async function createAsanaTask(viewer: Viewer, task: TaskEntity) {
  const logger = new Logger(viewer);
  try {
    const credentials = await getAsanaCredentials(viewer);
    if (credentials === null) {
      return;
    }
    const { accessToken, workspace } = credentials;
    const message = await MessageEntity.findByPk(task.messageID);
    if (!message) {
      throw new Error(
        `Failed to fetch message ${task.messageID} linked to task ${task.id}`,
      );
    }
    const title = taskTitleFromMessageContent(message.content);

    let footerText = await getTaskFooterText(viewer, message, 'asana');
    if (typeof footerText !== 'string') {
      footerText = '';
    }

    const htmlNotes = messageContentToAsanaHtml(message.content, footerText);
    const project = (await getSelectedProject(viewer))?.projectID;
    const asanaTaskGID = await createTask(
      accessToken,
      workspace,
      project,
      title,
      htmlNotes,
      undefined, // no parent task
      task.done,
    );
    if (!asanaTaskGID) {
      throw new Error(`failed to create Asana task for task ${task.id}`);
    }

    const previewData = await getAsanaTaskPreviewData(viewer, asanaTaskGID);

    await TaskThirdPartyReference.create({
      taskID: task.id,
      externalID: asanaTaskGID,
      externalConnectionType: 'asana',
      previewData,
    });

    await subscribeToUpdates(logger, accessToken, asanaTaskGID);
  } catch (e) {
    handleThirdPartyException(
      `Failed to create Asana task for task ${task.id}`,
      e,
      'asana',
      viewer,
    );
  }
}

export async function addAsanaTaskAssignees(
  viewer: Viewer,
  taskID: UUID,
  taskAssignees: UUID[],
) {
  try {
    const credentials = await getAsanaCredentials(viewer);
    if (credentials === null) {
      return;
    }
    const { accessToken, workspace } = credentials;
    const [asanaUserIDs, unmatchedUsers] = await getAsanaAsigneeAndFollowers(
      viewer,
      accessToken,
      workspace,
      taskAssignees,
    );

    const taskConnection = await TaskThirdPartyReference.findForTask(
      taskID,
      'asana',
    );
    if (!taskConnection) {
      throw new Error(`Failed to find taskConnection for task ${taskID}`);
    }

    const asanaTask = await getTask(accessToken, taskConnection.externalID);
    if (!asanaTask) {
      throw new Error(
        `Failed to get Asana task ${taskConnection.externalID} when updating task ${taskID}`,
      );
    }

    const [assigneeGID, ...followerGIDs]: [string?, ...string[]] = asanaUserIDs;

    const promises = [];
    if (assigneeGID) {
      promises.push(
        setAsanaTaskAsignee(
          accessToken,
          assigneeGID,
          taskConnection.externalID,
        ),
      );
    }
    if (followerGIDs.length > 0) {
      promises.push(
        addAsanaTaskFollowers(
          accessToken,
          followerGIDs,
          taskConnection.externalID,
        ),
      );
    }
    if (unmatchedUsers.length > 0) {
      const additionalText = additionalTextForTask(unmatchedUsers);
      promises.push(
        addCommentOnAsanaTask(
          accessToken,
          additionalText,
          taskConnection.externalID,
          true, // isPinned - let's pin this comment
        ),
      );
    }
    await Promise.all(promises);

    // update the preview after assignees are updated
    await updateAsanaTaskPreview(viewer, taskConnection);
  } catch (e) {
    handleThirdPartyException(
      `Failed to add Asana assignees to task ${taskID}`,
      e,
      'asana',
      viewer,
    );
  }
}

async function getAsanaAsigneeAndFollowers(
  viewer: Viewer,
  accessToken: string,
  workspace: string,
  taskAssigneeUserIDs: UUID[],
): Promise<[string[], UserEntity[]]> {
  if (taskAssigneeUserIDs.length === 0) {
    // nothing to do
    return [[], []];
  }
  const orgID = assertViewerHasOrg(viewer);
  const userLoader = new UserLoader(viewer, () => null);
  const users = await userLoader.loadUsersInOrg(taskAssigneeUserIDs, orgID);

  const asanaUserGIDs = await getAsanaUserGIDs(
    viewer,
    accessToken,
    workspace,
    users,
  );

  const foundAsanaUserIDs = asanaUserGIDs.filter(
    (gid): gid is string => gid !== undefined,
  );
  const unmatchedUsers = users.filter((_user, i) => !asanaUserGIDs[i]);
  return [foundAsanaUserIDs, unmatchedUsers];
}

function additionalTextForTask(noMatchUsers: UserEntity[]) {
  if (noMatchUsers.length === 0) {
    return '';
  }
  return [
    'This task was assigned to the following Cord users who did not have Asana connected:',
    ...noMatchUsers.map((user) => `${userDisplayName(user)} (${user.email})`),
  ].join('\n');
}

async function getAsanaUserGIDs(
  viewer: Viewer,
  accessToken: string,
  workspace: string,
  users: UserEntity[],
): Promise<(string | undefined)[]> {
  const logger = new Logger(viewer);
  // first check if user connected their account
  const orgID = assertViewerHasOrg(viewer);
  const connections = await ThirdPartyConnectionEntity.findAll({
    where: {
      userID: users.map(({ id }) => id),
      orgID,
      type: 'asana',
    },
  });
  const idToAsanaID = new Map(
    connections.map((connection) => [connection.userID, connection.externalID]),
  );
  // try to check if the user email exists on Asana
  // TODO: In the future we likely want to store this list of asanaUsers
  // instead of fetching it each time
  const asanaUsers =
    (await getAsanaUsers(logger, accessToken, workspace)) ?? [];
  const emailToAsanaID = new Map(
    asanaUsers.map((asanaUser) => [asanaUser.email, asanaUser.gid]),
  );

  return users.map((user) => {
    return (
      idToAsanaID.get(user.id) ||
      (user.email ? emailToAsanaID.get(user.email) : undefined)
    );
  });
}

export async function addAsanaTaskAttachments(
  viewer: Viewer,
  asanaTaskGID: string,
  files: FileEntity[],
) {
  try {
    const credentials = await getAsanaCredentials(viewer);
    const s3BucketLoader = new S3BucketLoader(viewer);
    if (credentials === null) {
      return;
    }
    const { accessToken } = credentials;
    await Promise.all(
      files
        .filter((file) => file.uploadStatus === 'uploaded')
        .map(async (file) => {
          const url = await file.getSignedDownloadURL(s3BucketLoader);
          const response = await fetch(url);

          if (response.status === 200) {
            // Our annotation files are currently named just "A" and Asana
            // wouldn't show nice image thumbnail for them. Naming the attachment
            // "annotation.png" fixed the problem and a thumbnail now shows for
            // attached annotations.
            await attachFile(
              accessToken,
              asanaTaskGID,
              file.name,
              file.mimeType,
              response.body!,
              file.size,
            );
          } else {
            throw new Error(
              `failed to attach file ${file.id} to Asana task ${asanaTaskGID}`,
            );
          }
        }),
    );
  } catch (e) {
    handleThirdPartyException(
      `Failed to attach file to Asana task ${asanaTaskGID}`,
      e,
      'asana',
      viewer,
    );
  }
}

export async function updateAsanaTask(
  viewer: Viewer,
  externalReference: TaskThirdPartyReference,
  done: boolean,
) {
  try {
    if (externalReference.externalConnectionType !== 'asana') {
      throw new Error(
        `Expected connection type "asana", got ${externalReference.externalConnectionType}`,
      );
    }
    const credentials = await getAsanaCredentials(viewer);
    if (credentials === null) {
      return;
    }
    const { accessToken } = credentials;
    await setTaskClosed(accessToken, done, externalReference.externalID);

    // update the preview after the task is updated
    await updateAsanaTaskPreview(viewer, externalReference);
  } catch (e) {
    handleThirdPartyException(
      `Failed to update task ${externalReference.taskID} on Asana`,
      e,
      'asana',
      viewer,
    );
  }
}

export async function createAsanaSubtasks(
  viewer: Viewer,
  taskID: UUID,
  todos: TaskTodoEntity[],
) {
  try {
    const credentials = await getAsanaCredentials(viewer);
    if (credentials === null) {
      return [];
    }
    const { accessToken, workspace } = credentials;
    const [task, taskConnection] = await Promise.all([
      TaskEntity.findByPk(taskID),
      TaskThirdPartyReference.findForTask(taskID, 'asana'),
    ]);

    if (task === null) {
      throw new Error(`Failed to fetch task ${taskID}`);
    }
    if (taskConnection === null) {
      throw new Error(
        `Failed to fetch asana taskConnection for task ${taskID}`,
      );
    }

    const message = await MessageEntity.findByPk(task.messageID);
    if (!message) {
      throw new Error(
        `Failed to fetch message ${task.messageID} linked to task ${task.id}`,
      );
    }
    const createdTodoMap = new Map(todos.map((todo) => [todo.id, todo]));

    let footerText = await getTaskFooterText(viewer, message, 'asana');
    if (typeof footerText !== 'string') {
      footerText = '';
    }

    const htmlNotes = messageContentToAsanaHtml([], footerText);
    const todoNodes = todoNodesFromMessage(message.content).filter((node) =>
      createdTodoMap.has(node.todoID),
    );
    const project = (await getSelectedProject(viewer))?.projectID;
    const asanaTaskGIDs = await Promise.all(
      todoNodes.map((todoNode) =>
        createTask(
          accessToken,
          workspace,
          project,
          textFromNodeRecursive(todoNode),
          htmlNotes,
          taskConnection.externalID,
          createdTodoMap.get(todoNode.todoID)?.done,
        ),
      ),
    );

    return await Promise.all(
      asanaTaskGIDs.map((asanaTaskGID, i) => {
        if (!asanaTaskGID) {
          throw new Error(`failed to create Asana subtask for task ${task.id}`);
        }
        return TaskThirdPartyReference.create({
          taskID: task.id,
          externalID: asanaTaskGID,
          externalConnectionType: 'asana',
          taskTodoID: todoNodes[i].todoID,
          previewData: null,
        });
      }),
    );
  } catch (e) {
    handleThirdPartyException(
      `Failed to create subtasks on Asana for task ${taskID}`,
      e,
      'asana',
      viewer,
    );
    return [];
  }
}

// this is the function to call whenever Asana tells us that a task's completed
// status has been changed in Asana.
export async function onAsanaUserChangedTaskStatus(
  asanaUserGID: string,
  taskGID: string,
) {
  try {
    let logger = anonymousLogger();
    // TODO: What happens if a task was closed in Asana by someone who does not
    // have Cord account connected? Should we use someone else's access token to
    // access the task details?
    const connection = await ThirdPartyConnectionEntity.findOne({
      where: {
        externalID: asanaUserGID,
        type: 'asana',
      },
    });

    if (!connection?.externalAuthData) {
      logger.info(
        `Asana task's (${taskGID}) was updated, but we failed to find the extenal connection for user ${asanaUserGID}`,
      );
      return;
    }
    const connectionViewer = Viewer.createLoggedInViewer(
      connection.userID,
      connection.orgID,
    );
    logger = new Logger(connectionViewer);

    const taskConnectionPromise = TaskThirdPartyReference.findOne({
      where: {
        externalID: taskGID,
        externalConnectionType: 'asana',
      },
      include: [
        {
          model: TaskEntity,
          required: true,
          as: 'task',
        },
      ],
    }) as any as Promise<
      TaskThirdPartyReference & {
        task: TaskEntity;
      }
    >;
    // ^^^ extra type-casting so that Typescript knows we've fetched not just the
    // TaskThirdPartyReference, but also the associated task

    const [taskConnection, credentials] = await Promise.all([
      taskConnectionPromise,
      getAsanaCredentials(connectionViewer),
    ]);

    if (!taskConnection) {
      throw new Error(`Failed to find Cord task for the Asana task ${taskGID}`);
    }

    if (!credentials) {
      return;
    }
    const asanaTask = await getTask(credentials.accessToken, taskGID);
    if (!asanaTask) {
      throw new Error(`Failed to fetch Asana task ${taskGID}`);
    }

    const completed = asanaTask.completed;
    if (completed !== true && completed !== false) {
      throw new Error(
        `Invalid value for asana 'completed' task field ${completed}`,
      );
    }

    if (completed === taskConnection.task.done) {
      // nothing to be done, task's done status is already the same as on Asana
      // This can happen when a user closes a task in Cord, we tell Asana about
      // it and now Asana is telling us that the task status has changed.
      return;
    }

    // for now, update the Cord task's done status only. In the future handle
    // changes in assignees too.
    await TaskEntity.update(
      {
        done: completed,
        doneStatusLastUpdatedBy: connection.userID,
      },
      {
        where: {
          id: taskConnection.taskID,
        },
      },
    );

    // update asana's task preview
    if (!taskConnection.previewData) {
      await updateAsanaTaskPreview(connectionViewer, taskConnection);
    } else {
      const newPreviewData: AsanaTaskPreviewData = {
        ...(taskConnection.previewData as AsanaTaskPreviewData),
        done: completed,
      };
      await setAsanaTaskPreview(taskConnection, newPreviewData);
    }
  } catch (e) {
    handleThirdPartyException(
      `Failed to update task from a webhook`,
      e,
      'asana',
    );
  }
}

async function updateAsanaTaskPreview(
  viewer: Viewer,
  externalReference: TaskThirdPartyReference,
) {
  // only update the preview if this is not a TODO issue
  if (!externalReference.taskTodoID) {
    const taskID = externalReference.externalID;
    const previewData = await getAsanaTaskPreviewData(viewer, taskID);
    if (previewData) {
      await setAsanaTaskPreview(externalReference, previewData);
    }
  }
}

async function setAsanaTaskPreview(
  externalReference: TaskThirdPartyReference,
  previewData: AsanaTaskPreviewData,
) {
  await externalReference.update({ previewData });
  await publishMessageUpdateForTask(externalReference);
}

export async function fetchAsanaProjects(viewer: Viewer) {
  try {
    const credentials = await getAsanaCredentials(viewer);
    if (credentials === null) {
      return [];
    }
    const projects = await getAsanaProjects(
      credentials.accessToken,
      credentials.workspace,
    );
    if (!projects) {
      throw new Error(`Asana api returned undefined projects`);
    }
    return projects;
  } catch (e) {
    handleThirdPartyException(
      `Failed to fetch projects for Asana`,
      e,
      'asana',
      viewer,
    );
    return [];
  }
}

async function getAsanaTaskPreviewData(
  viewer: Viewer,
  asanaTaskGID: string,
): Promise<AsanaTaskPreviewData | null> {
  try {
    const credentials = await getAsanaCredentials(viewer);
    if (credentials === null) {
      return null;
    }

    const task = await getTask(credentials.accessToken, asanaTaskGID);
    if (!task) {
      throw new Error(`Failed to fetch Asana task ${asanaTaskGID}`);
    }

    return {
      title: task.name,
      assignee: task.assignee?.name,
      url: task.permalink_url,
      done: task.completed,
    };
  } catch (e) {
    handleThirdPartyException(
      `Failed to fetch Asana task preview`,
      e,
      'asana',
      viewer,
    );
    return null;
  }
}

// function to call when Asana tells us that assignee field changed
export async function onAsanaAssigneeChanged(
  asanaAssignerGID: string,
  taskGID: string,
  newAssigneeGID: string | undefined,
) {
  let logger = anonymousLogger();
  try {
    const taskConnection = await TaskThirdPartyReference.findOne({
      where: {
        externalID: taskGID,
        externalConnectionType: 'asana',
      },
    });
    if (!taskConnection) {
      throw new Error(`Failed to find Cord task for the Asana task ${taskGID}`);
    }

    const message = await MessageEntity.findOne({
      include: [
        {
          model: TaskEntity,
          required: true,
          as: 'tasks',
          where: {
            id: taskConnection.taskID,
          },
        },
      ],
    });
    if (!message) {
      throw new Error(
        `Failed to find the message for the taskID ${taskConnection.taskID}`,
      );
    }

    // TODO: What if the task assignee was changed by someone who did not connect
    // their account?
    const connection = await ThirdPartyConnectionEntity.findOne({
      where: {
        externalID: asanaAssignerGID,
        type: 'asana',
        orgID: message.orgID,
      },
    });
    if (!connection?.externalAuthData) {
      throw new Error(
        `External connection ${connection} or external auth data ${connection?.externalAuthData} is missing`,
      );
    }
    const connectionViewer = Viewer.createLoggedInViewer(
      connection.userID,
      connection.orgID,
    );
    logger = new Logger(connectionViewer);

    const credentials = await getAsanaCredentials(connectionViewer);
    if (!credentials) {
      return;
    }

    let newCordAssignee: UUID | undefined = undefined;
    let asanaAssigneeInfo: AsanaUserInfo | undefined = undefined;
    if (newAssigneeGID) {
      [newCordAssignee, asanaAssigneeInfo] = await getCordUserID(
        credentials.accessToken,
        newAssigneeGID,
        connection.orgID,
      );
    }

    if (newCordAssignee) {
      await TaskAssigneeEntity.upsert({
        taskID: taskConnection.taskID,
        userID: newCordAssignee,
        orgID: connection.orgID,
      });
    }

    // update task preview data - there are actually a few cases depending on
    // whether we have existing preview data and whether we needed to fetch the
    // Asana user information in the process
    if (!taskConnection.previewData) {
      // this is unlikely but possible
      await updateAsanaTaskPreview(connectionViewer, taskConnection);
    } else if (!newAssigneeGID) {
      // the task is unassigned
      const newPreviewData: AsanaTaskPreviewData = {
        ...(taskConnection.previewData as AsanaTaskPreviewData),
        assignee: undefined,
      };
      await setAsanaTaskPreview(taskConnection, newPreviewData);
    } else if (asanaAssigneeInfo) {
      const newPreviewData: AsanaTaskPreviewData = {
        ...(taskConnection.previewData as AsanaTaskPreviewData),
        assignee: asanaAssigneeInfo.name,
      };
      await setAsanaTaskPreview(taskConnection, newPreviewData);
    } else {
      await updateAsanaTaskPreview(connectionViewer, taskConnection);
    }
  } catch (e) {
    logger.logException('Failed to update assignee from Asana webhook', e);
    return;
  }
}

// try to convert from Asana userGID to Cord userID. First by checking whether
// we have connection in the third_party_connections table, second by trying to
// match the asana user's email to a cord user. In the second case, Asana
// user information needs to be fetched from Asana and will be part of the
// return value.
async function getCordUserID(
  accessToken: string,
  asanaUserGID: string,
  orgID: string,
): Promise<[UUID | undefined, AsanaUserInfo | undefined]> {
  let logger = anonymousLogger();
  try {
    const connection = await ThirdPartyConnectionEntity.findOne({
      where: {
        externalID: asanaUserGID,
        orgID,
        type: 'asana',
      },
    });
    if (connection) {
      return [connection.userID, undefined];
    }
    logger = new Logger(Viewer.createOrgViewer(orgID));

    // the user is not connected, let's try to match on email
    const userInfo = await getUserInfo(accessToken, asanaUserGID);
    if (!userInfo?.email) {
      throw new Error(`Failed to get email for asana user ${asanaUserGID}`);
    }
    const users = await getSequelize().query<UserEntity>(
      `
    SELECT users.* FROM users, org_members
    WHERE users.id = org_members."userID"
    AND users.email = $1
    AND org_members."orgID" = $2
    LIMIT 1;
    `,
      {
        bind: [userInfo.email, orgID],
        type: QueryTypes.SELECT,
        model: UserEntity,
      },
    );
    const user = users.length > 0 ? users[0] : null;

    return [user?.id, userInfo];
  } catch (e) {
    logger.logException(`Failed to convert Asana userGID to Cord userID`, e);
    return [undefined, undefined];
  }
}
