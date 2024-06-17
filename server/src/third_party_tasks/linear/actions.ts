import { LINEAR_CONNECTION_PREFERENCES } from 'common/const/UserPreferenceKeys.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import {
  assertViewerHasIdentity,
  assertViewerHasOrg,
  assertViewerHasUser,
} from 'server/src/auth/index.ts';
import { cache, cacheKey } from 'server/src/util/cache.ts';
import {
  createIssue,
  getUsersInOrg,
  uploadFileToLinear,
  updateIssueState,
  getUserInfo,
  getIssueDescription,
  updateIssueDescription,
  updateIssueAssigneeAndSubscribers,
  getIssue,
  getAllTeamsInUserOrg,
} from 'server/src/third_party_tasks/linear/api.ts';
import { convertMessageContentToMarkdown } from 'server/src/third_party_tasks/linear/util.ts';
import type { FileEntity } from 'server/src/entity/file/FileEntity.ts';
import type {
  UUID,
  LinearIssuePreviewData,
  LinearConnectionPreferences,
  LinearTeam,
} from 'common/types/index.ts';
import { LinearIssueStateTypes } from 'common/types/index.ts';
import {
  taskTitleFromMessageContent,
  todoNodesFromMessage,
  textFromNodeRecursive,
} from '@cord-sdk/react/common/lib/messageNode.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { TaskEntity } from 'server/src/entity/task/TaskEntity.ts';
import { TaskThirdPartyReference } from 'server/src/entity/task_third_party_reference/TaskThirdPartyReferenceEntity.ts';
import type { TaskTodoEntity } from 'server/src/entity/task_todo/TaskTodoEntity.ts';
import {
  findTaskAndMessageEntitiesFromExternalTaskID,
  getExternalAuthData,
  getTaskFooterText,
  handleThirdPartyException,
  publishMessageUpdateForTask,
} from 'server/src/third_party_tasks/util.ts';
import { ThirdPartyConnectionEntity } from 'server/src/entity/third_party_connection/ThirdPartyConnectionEntity.ts';
import { userDisplayName } from 'server/src/entity/user/util.ts';
import { UserPreferenceEntity } from 'server/src/entity/user_preference/UserPreferenceEntity.ts';
import { TaskAssigneeEntity } from 'server/src/entity/task_assignee/TaskAssigneeEntity.ts';
import { S3BucketLoader } from 'server/src/entity/s3_bucket/S3BucketLoader.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import { UserLoader } from 'server/src/entity/user/UserLoader.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';

type CachedLinearCredentials = {
  accessToken: string;
};

type LinearAttachmentData = {
  filename: string;
  assetUrl: string;
  contentType: string;
};

async function getLinearCredentials(
  viewer: Viewer,
): Promise<CachedLinearCredentials | null> {
  try {
    const { userID, orgID } = assertViewerHasIdentity(viewer);

    const key = cacheKey({ type: 'linear_credentials', userID, orgID });

    let credentials = cache.get<CachedLinearCredentials>(key);
    if (credentials !== undefined) {
      return credentials;
    }

    const externalData = await getExternalAuthData(viewer, 'linear');
    if (externalData === null) {
      return null;
    }

    const { accessToken } = externalData;

    credentials = {
      accessToken,
    };

    // Linear provides us with an access token that lasts 10 years.
    // This TTL is not entirely accurate since the  token starts
    // expiring from the initial oauth flow completion.
    cache.set<CachedLinearCredentials>(key, credentials, 315705599);

    return credentials;
  } catch (e) {
    handleThirdPartyException('getLinearCredentials', e, 'linear', viewer);
    return null;
  }
}

export async function createLinearTask(viewer: Viewer, task: TaskEntity) {
  try {
    const credentials = await getLinearCredentials(viewer);
    if (!credentials) {
      return;
    }

    const { accessToken } = credentials;

    const preferences = await getTeamIDAndProjectID(viewer);
    if (!preferences) {
      return;
    }
    const { teamID, projectID } = preferences;
    if (!teamID) {
      return;
    }

    const message = await MessageEntity.findByPk(task.messageID);
    if (!message) {
      return;
    }

    const title = taskTitleFromMessageContent(message.content);

    let footerText = await getTaskFooterText(viewer, message, 'linear');
    if (typeof footerText !== 'string') {
      footerText = '';
    }

    const textMessage = convertMessageContentToMarkdown(
      message.content,
      footerText,
    );

    const linearIssueID = await createIssue(
      accessToken,
      teamID,
      title,
      textMessage,
      null,
      null,
      projectID,
    );

    if (!linearIssueID) {
      throw new Error(`Failed to create a Linear task for task ${task.id}`);
    }

    const previewData = await getLinearIssuePreviewData(viewer, linearIssueID);

    const externalReference = await TaskThirdPartyReference.create({
      taskID: task.id,
      externalID: linearIssueID,
      externalConnectionType: 'linear',
      externalLocationID: teamID,
      previewData,
    });

    await publishMessageUpdateForTask(externalReference);

    // Initial done state
    if (task.done) {
      await updateLinearTask(viewer, externalReference, true);
    }
  } catch (e) {
    handleThirdPartyException('createLinearTask', e, 'linear', viewer);
    return;
  }
}

export async function addLinearTaskAttachments(
  viewer: Viewer,
  issueID: string,
  files: FileEntity[],
) {
  try {
    const credentials = await getLinearCredentials(viewer);
    if (!credentials) {
      return;
    }
    const { accessToken } = credentials;
    const s3BucketLoader = new S3BucketLoader(viewer);

    const attachmentData = await Promise.all(
      files
        .filter((file) => file.uploadStatus === 'uploaded')
        .map(async (file) => {
          const url = await file.getSignedDownloadURL(s3BucketLoader);
          const response = await fetch(url);
          if (response.status === 200) {
            const assetUrl = await uploadFileToLinear(
              accessToken,
              file.name,
              file.mimeType,
              response.body!,
              file.size,
            );

            if (!assetUrl) {
              throw new Error(
                `Failed to upload file to Linear, error code ${response.status}`,
              );
            }

            return {
              filename: file.name,
              assetUrl,
              contentType: file.mimeType,
            };
          } else {
            throw new Error(
              `Failed to fetch upload. Error code:${response.status}`,
            );
          }
        }),
    );

    const attachmentsDescription =
      `\n\n` +
      `Attachments:\n` +
      convertAttachmentDataToMarkdownLinks(
        // Filter out any undefined values in array.
        attachmentData.filter(
          (attachment): attachment is LinearAttachmentData =>
            attachment !== undefined,
        ),
      );

    const currentDescription = await getIssueDescription(issueID, accessToken);

    const updatedDescription = currentDescription + attachmentsDescription;

    await updateIssueDescription(issueID, accessToken, updatedDescription);
  } catch (e) {
    handleThirdPartyException('addLinearTaskAttachments', e, 'linear', viewer);
    return;
  }
}

function convertAttachmentDataToMarkdownLinks(urls: LinearAttachmentData[]) {
  return urls
    .map((data) => {
      if (data.contentType.startsWith('image/')) {
        return `![${data.filename}](${encodeURI(data.assetUrl)})`;
      } else {
        return `[${data.filename}](${encodeURI(data.assetUrl)})`;
      }
    })
    .join('\n');
}

export async function updateLinearTask(
  viewer: Viewer,
  externalReference: TaskThirdPartyReference,
  done: boolean,
) {
  try {
    if (externalReference.externalConnectionType !== 'linear') {
      throw new Error(
        `Expected connection type "linear" but got ${externalReference.externalConnectionType} instead.`,
      );
    }

    const credentials = await getLinearCredentials(viewer);
    if (!credentials) {
      return;
    }

    const { accessToken } = credentials;

    const teamID = externalReference.externalLocationID;
    if (!teamID) {
      return;
    }

    const newState = done
      ? LinearIssueStateTypes.DONE
      : LinearIssueStateTypes.TODO;

    await updateIssueState(
      accessToken,
      newState,
      externalReference.externalID,
      teamID,
    );

    await updateLinearIssuePreviewData(viewer, externalReference);
  } catch (e) {
    handleThirdPartyException('updateLinearTask', e, 'linear', viewer);
    return;
  }
}

async function getTeamIDAndProjectID(
  viewer: Viewer,
): Promise<LinearConnectionPreferences | undefined> {
  const userID = assertViewerHasUser(viewer);
  const response = await UserPreferenceEntity.findOne({
    where: {
      userID,
      key: LINEAR_CONNECTION_PREFERENCES,
    },
  });

  return response ? (response.value as LinearConnectionPreferences) : undefined;
}

export async function getLinearUserTeamInfo(
  viewer: Viewer,
): Promise<LinearTeam[] | undefined> {
  try {
    const credentials = await getLinearCredentials(viewer);
    if (!credentials) {
      return;
    }

    const { accessToken } = credentials;

    const userInfo = await getUserInfo(accessToken);
    if (!userInfo) {
      return;
    }

    return userInfo.teams?.nodes;
  } catch (e) {
    handleThirdPartyException('getTeamIDFromPreferences', e, 'linear', viewer);
    return;
  }
}

async function getLinearAssigneeAndSubscribers(
  viewer: Viewer,
  accessToken: string,
  taskAssigneeUserIDs: UUID[],
): Promise<[string[], UserEntity[]]> {
  try {
    if (taskAssigneeUserIDs.length === 0) {
      // Do nothing
      return [[], []];
    }

    const { orgID } = assertViewerHasIdentity(viewer);

    const userLoader = new UserLoader(viewer, () => null);
    const users = await userLoader.loadUsersInOrg(taskAssigneeUserIDs, orgID);

    const linearUserIDs = await getLinearUserIDs(viewer, accessToken, users);

    const foundLinearUserIDs = linearUserIDs.filter(
      (linearID): linearID is string => linearID !== undefined,
    );

    const unmatchedUsers = users.filter((_user, i) => !linearUserIDs[i]);

    return [foundLinearUserIDs, unmatchedUsers];
  } catch (e) {
    handleThirdPartyException(
      'getLinearAssigneeAndSubscribers',
      e,
      'linear',
      viewer,
    );
    return [[], []];
  }
}

async function getLinearUserIDs(
  viewer: Viewer,
  accessToken: string,
  users: UserEntity[],
): Promise<(string | undefined)[]> {
  try {
    const orgID = assertViewerHasOrg(viewer);
    const connections = await ThirdPartyConnectionEntity.findAll({
      where: {
        userID: users.map(({ id }) => id),
        orgID,
        type: 'linear',
      },
    });

    const userIDToLinearID = new Map(
      connections.map((connection) => [
        connection.userID,
        connection.externalID,
      ]),
    );

    const linearUsers = await getUsersInOrg(accessToken);

    if (!linearUsers) {
      return [];
    }

    const emailToLinearID = new Map(
      linearUsers.map((linearUser) => [linearUser.email, linearUser.id]),
    );

    return users.map((user) => {
      return (
        userIDToLinearID.get(user.id) ||
        (user.email ? emailToLinearID.get(user.email) : undefined)
      );
    });
  } catch (e) {
    handleThirdPartyException('getLinearUserIDs', e, 'linear', viewer);
    return [];
  }
}

function additionalTextForTask(unmatchedUsers: UserEntity[]) {
  if (unmatchedUsers.length === 0) {
    return '';
  }
  return [
    'This task was assigned to the following Cord users who do not have Linear connected:',
    ...unmatchedUsers.map((user) => `${userDisplayName(user)} (${user.email})`),
  ].join('\n');
}

export async function updateLinearTaskAssigneeAndSubscribers(
  viewer: Viewer,
  taskID: UUID,
  taskAssigneeUserIDs: UUID[],
) {
  try {
    const credentials = await getLinearCredentials(viewer);
    if (!credentials) {
      return;
    }

    const { accessToken } = credentials;

    const thirdPartyReference = await TaskThirdPartyReference.findForTask(
      taskID,
      'linear',
    );
    if (!thirdPartyReference) {
      return;
    }

    const issueID = thirdPartyReference.externalID;

    const [foundLinearUserIDs, unmatchedUsers] =
      await getLinearAssigneeAndSubscribers(
        viewer,
        accessToken,
        taskAssigneeUserIDs,
      );

    const [assigneeID, ...subscriberIDs] = foundLinearUserIDs;
    const currentDescription = await getIssueDescription(issueID, accessToken);
    const extraText = additionalTextForTask(unmatchedUsers);
    const updatedDescription =
      currentDescription + (extraText ? '\n\n' + extraText : '');

    await updateIssueAssigneeAndSubscribers(
      accessToken,
      issueID,
      assigneeID,
      subscriberIDs,
      updatedDescription,
    );

    await updateLinearIssuePreviewData(viewer, thirdPartyReference);
  } catch (e) {
    handleThirdPartyException(
      'updateLinearTaskAssigneeAndSubscribers',
      e,
      'linear',
      viewer,
    );
    return;
  }
}

export async function createLinearSubtasks(
  viewer: Viewer,
  taskID: UUID,
  todos: TaskTodoEntity[],
) {
  try {
    const credentials = await getLinearCredentials(viewer);
    if (!credentials) {
      return;
    }

    const { accessToken } = credentials;

    const [preferences, task, thirdPartyReference] = await Promise.all([
      getTeamIDAndProjectID(viewer),
      TaskEntity.findByPk(taskID),
      TaskThirdPartyReference.findForTask(taskID, 'linear'),
    ]);

    if (!preferences || !task || !thirdPartyReference) {
      return;
    }

    const { teamID, projectID } = preferences;
    if (!teamID) {
      return;
    }

    const { messageID } = task;

    const message = await MessageEntity.findByPk(messageID);
    if (!message) {
      return;
    }

    const issueID = thirdPartyReference.externalID;
    const createdTodoIDs = new Set(todos.map((todo) => todo.id));
    const todoNodes = todoNodesFromMessage(message.content).filter((node) =>
      createdTodoIDs.has(node.todoID),
    );

    let footerText = await getTaskFooterText(viewer, message, 'linear');
    if (typeof footerText !== 'string') {
      footerText = '';
    }

    const description = convertMessageContentToMarkdown([], footerText);

    const linearSubIssueIDs = await Promise.all(
      todoNodes.map((todoNode) =>
        createIssue(
          accessToken,
          teamID,
          textFromNodeRecursive(todoNode),
          description,
          null,
          issueID,
          projectID,
        ),
      ),
    );

    const externalReferences = await Promise.all(
      linearSubIssueIDs.map((linearSubIssueID, i) => {
        if (!linearSubIssueID) {
          return;
        }

        return TaskThirdPartyReference.create({
          taskID: taskID,
          externalID: linearSubIssueID,
          externalConnectionType: 'linear',
          taskTodoID: todoNodes[i].todoID,
          externalLocationID: teamID,
          previewData: null,
        });
      }),
    );

    const filteredExternalReferences = externalReferences.filter(
      (externalReference): externalReference is TaskThirdPartyReference =>
        externalReference !== undefined,
    );

    // Initial done state
    await Promise.all(
      todoNodes.map((todoNode, i) => {
        if (!todos.find(({ id }) => todoNode.todoID === id)?.done) {
          return null;
        }

        const externalReference = filteredExternalReferences.find(
          // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
          (externalReference) =>
            externalReference.externalID === linearSubIssueIDs[i],
        );
        if (!externalReference) {
          return null;
        }

        return updateLinearTask(viewer, externalReference, true);
      }),
    );
  } catch (e) {
    handleThirdPartyException('createLinearSubtasks', e, 'linear', viewer);
    return;
  }
}

async function updateLinearIssuePreviewData(
  viewer: Viewer,
  externalReference: TaskThirdPartyReference,
) {
  // only update the preview if this is not a TODO issue
  if (!externalReference.taskTodoID) {
    const issueID = externalReference.externalID;
    const previewData = await getLinearIssuePreviewData(viewer, issueID);
    await externalReference.update({ previewData });
    await publishMessageUpdateForTask(externalReference);
  }
}

async function getLinearIssuePreviewData(
  viewer: Viewer,
  issueID: string,
): Promise<LinearIssuePreviewData | null> {
  const credentials = await getLinearCredentials(viewer);
  if (!credentials) {
    return null;
  }

  const { accessToken } = credentials;

  const issue = await getIssue(accessToken, issueID);
  if (!issue) {
    return null;
  }

  return {
    title: issue.title,
    identifier: issue.identifier,
    url: issue.url,
    assignee: issue.assignee?.name,
    priority: issue.priorityLabel,
    status: issue.state.name,
    done: issue.state.type === LinearIssueStateTypes.DONE,
    orgName: issue.team.organization.name,
  };
}

export async function handleAssigneeChange(
  externalTaskID: string,
  assigneeID: string,
  previousAssigneeID: string,
  assignee: { id: string; name: string } | null | undefined,
) {
  try {
    // finding if this task exists
    const entities = await findTaskAndMessageEntitiesFromExternalTaskID(
      externalTaskID,
      'linear',
    );

    if (!entities) {
      return;
    }

    const { taskEntity, messageEntity, thirdPartyTaskEntity } = entities;

    const taskID = taskEntity.id;

    const { orgID } = messageEntity;

    // if someone else was assigned previously they would be removed from the
    // task assignee database
    if (previousAssigneeID) {
      // should we also try to match emails?
      const thirdPartyConnection = await ThirdPartyConnectionEntity.findOne({
        where: { externalID: previousAssigneeID, orgID },
      });

      if (!thirdPartyConnection) {
        anonymousLogger().info(`Could not find Linear user as a Cord user`);
      } else {
        const { userID } = thirdPartyConnection;
        // removes the assignee that was unassigned from Linear in Cord
        await TaskAssigneeEntity.destroy({ where: { taskID, userID, orgID } });
      }
    }

    if (assigneeID) {
      const thirdPartyConnection = await ThirdPartyConnectionEntity.findOne({
        where: { externalID: assigneeID, orgID },
      });

      // should we also try to match emails?
      if (!thirdPartyConnection) {
        anonymousLogger().info(`Could not find Linear user as a Cord user`);
      } else {
        const { userID } = thirdPartyConnection;
        // check if entity already exists as when we add an assignee on a new
        // task, because of the way the mutators work the webhook thinks this
        // is an update.
        const taskAssigneeEntity = await TaskAssigneeEntity.findOne({
          where: { taskID, userID, orgID },
        });
        if (!taskAssigneeEntity) {
          await TaskAssigneeEntity.create({ taskID, userID, orgID });
        }
      }
    }

    // updating preview data
    const previewData = thirdPartyTaskEntity.previewData;
    if (previewData) {
      await thirdPartyTaskEntity.update({
        previewData: {
          ...previewData,
          assignee: assignee ? assignee.name : null,
        },
      });
      await publishMessageUpdateForTask(thirdPartyTaskEntity);
    }
  } catch (e) {
    anonymousLogger().logException('handleAssigneeChange', e);
  }
}

export function hasAssigneeChanged(prevAssignee: string, newAssignee: string) {
  const isNewAssigneeOnUnassignedTask = newAssignee && prevAssignee === null;
  const isTaskBeingUnassigned = newAssignee === undefined && prevAssignee;
  const isAssigneeBeingReplaced = newAssignee && prevAssignee;

  return (
    isNewAssigneeOnUnassignedTask ||
    isTaskBeingUnassigned ||
    isAssigneeBeingReplaced
  );
}

export async function handleIssueStatusChange(
  externalTaskID: string,
  newIssueState: LinearIssueStateTypes,
  stateIssueName: string,
) {
  try {
    // finding if this task exists

    const entities = await findTaskAndMessageEntitiesFromExternalTaskID(
      externalTaskID,
      'linear',
    );

    if (!entities) {
      return;
    }

    const { taskEntity, thirdPartyTaskEntity } = entities;

    await taskEntity.update({
      done: newIssueState === LinearIssueStateTypes.DONE,
    });

    // updating preview data
    const previewData = thirdPartyTaskEntity.previewData;
    if (previewData) {
      await thirdPartyTaskEntity.update({
        previewData: {
          ...previewData,
          done: newIssueState === LinearIssueStateTypes.DONE,
          status: stateIssueName,
        },
      });
      await publishMessageUpdateForTask(thirdPartyTaskEntity);
    }
  } catch (e) {
    anonymousLogger().logException('handleIssueStatusChange', e);
  }
}

export async function canUserEditTask(
  accessToken: string,
  taskTeamID: string,
  viewer: Viewer,
) {
  try {
    const teams = await getAllTeamsInUserOrg(accessToken);
    if (!teams) {
      return false;
    }
    const matchedTeam = teams.some((team) => team.id === taskTeamID);
    return matchedTeam;
  } catch (e) {
    handleThirdPartyException('canUserEditTask', e, 'linear', viewer);
    return false;
  }
}
