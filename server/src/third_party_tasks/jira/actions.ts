import type { Viewer } from 'server/src/auth/index.ts';
import {
  assertViewerHasIdentity,
  assertViewerHasUser,
} from 'server/src/auth/index.ts';
import {
  addIssueAttachment,
  addIssueComment,
  addIssueWatcher,
  assignIssue,
  createIssue,
  fetchAccessToken,
  fetchProjects,
  getIssue,
  getIssueTransitions,
  getServerInfo,
  transitionIssue,
} from 'server/src/third_party_tasks/jira/api.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { TaskEntity } from 'server/src/entity/task/TaskEntity.ts';
import type { TaskTodoEntity } from 'server/src/entity/task_todo/TaskTodoEntity.ts';
import { TaskThirdPartyReference } from 'server/src/entity/task_third_party_reference/TaskThirdPartyReferenceEntity.ts';
import type {
  JiraConnectionPreferences,
  JiraIssuePreviewData,
  UUID,
} from 'common/types/index.ts';
import {
  textFromNodeRecursive,
  todoNodesFromMessage,
  taskTitleFromMessageContent,
} from '@cord-sdk/react/common/lib/messageNode.ts';
import {
  getExternalAuthData,
  getTaskFooterText,
  getThirdPartyMatchedAccounts,
  handleThirdPartyException,
  publishMessageUpdateForTask,
} from 'server/src/third_party_tasks/util.ts';
import { cache, cacheKey } from 'server/src/util/cache.ts';
import { UserPreferenceEntity } from 'server/src/entity/user_preference/UserPreferenceEntity.ts';
import { JIRA_CONNECTION_PREFERENCES } from 'common/const/UserPreferenceKeys.ts';
import type { FileEntity } from 'server/src/entity/file/FileEntity.ts';
import {
  emptyFooter,
  messageContentToAtlassianDocument,
  unmatchedUsersToAtlassianDocument,
} from 'server/src/third_party_tasks/jira/util.ts';
import { S3BucketLoader } from 'server/src/entity/s3_bucket/S3BucketLoader.ts';

type CachedJiraCredentials = { accessToken: string; cloudID: string };
const CACHE_TTL_EXPIRATION_DELTA_SECONDS = 30;

async function getJiraCredentials(
  viewer: Viewer,
): Promise<CachedJiraCredentials | null> {
  try {
    const { userID, orgID } = assertViewerHasIdentity(viewer);

    const key = cacheKey({ type: 'jira_credentials', userID, orgID });

    let credentials = cache.get<CachedJiraCredentials>(key);
    if (credentials !== undefined) {
      return credentials;
    }

    const externalAuthData = await getExternalAuthData(viewer, 'jira');
    if (!externalAuthData) {
      return null;
    }

    const { refreshToken, cloudID } = externalAuthData;
    const response = await fetchAccessToken(viewer, refreshToken, cloudID);

    credentials = {
      accessToken: response.access_token,
      cloudID,
    };

    cache.set<CachedJiraCredentials>(
      key,
      credentials,
      // subtract a small amount of time to avoid the risk of the action happening
      // between when the token expires as determined by the remote server versus
      // when we receive and store it here (probably a couple of seconds).
      response.expires_in - CACHE_TTL_EXPIRATION_DELTA_SECONDS,
    );

    return credentials;
  } catch (e) {
    handleThirdPartyException('getJiraCredentials', e, 'jira', viewer);
    return null;
  }
}

export async function fetchJiraProjects(viewer: Viewer) {
  try {
    const credentials = await getJiraCredentials(viewer);
    if (!credentials) {
      return [];
    }

    const { accessToken, cloudID } = credentials;

    const projectsResponse = await fetchProjects(accessToken, cloudID);

    return projectsResponse.values;
  } catch (e) {
    handleThirdPartyException(`fetchJiraProjects`, e, 'jira', viewer);
    return [];
  }
}

async function getProjectAndIssueTypes(viewer: Viewer) {
  try {
    const userID = assertViewerHasUser(viewer);
    const response = await UserPreferenceEntity.findOne({
      where: {
        userID,
        key: JIRA_CONNECTION_PREFERENCES,
      },
    });

    if (!response) {
      throw new Error('user preferences missing');
    }

    return response.value as JiraConnectionPreferences;
  } catch (e) {
    handleThirdPartyException(`getProjectAndIssueTypes`, e, 'jira', viewer);
    return undefined;
  }
}

export async function createSimpleJiraTask(viewer: Viewer, task: TaskEntity) {
  try {
    const credentials = await getJiraCredentials(viewer);
    if (!credentials) {
      return;
    }

    const { accessToken, cloudID } = credentials;

    const preferences = await getProjectAndIssueTypes(viewer);
    if (!preferences) {
      return;
    }

    const { projectID, issueType } = preferences;
    if (!issueType || !projectID) {
      return;
    }

    const message = await MessageEntity.findByPk(task.messageID);
    if (!message) {
      return;
    }

    const title = taskTitleFromMessageContent(message.content);

    let footerText = await getTaskFooterText(viewer, message, 'jira');
    if (typeof footerText === 'string') {
      footerText = emptyFooter;
    }

    const description = messageContentToAtlassianDocument(
      message.content,
      footerText,
    );

    const { id } = await createIssue(
      accessToken,
      cloudID,
      title,
      description,
      projectID,
      issueType,
      null,
    );

    const previewData = await getJiraIssuePreviewData(viewer, id);

    const reference = await TaskThirdPartyReference.create({
      taskID: task.id,
      externalID: id,
      externalConnectionType: 'jira',
      previewData,
      externalLocationID: cloudID,
    });

    await publishMessageUpdateForTask(reference);

    // initial done state
    if (task.done) {
      await updateJiraTask(viewer, reference, true);
    }
  } catch (e) {
    handleThirdPartyException(`createSimpleJiraTask`, e, 'jira', viewer);
  }
}

export async function updateJiraTaskAssigneeAndWatchers(
  viewer: Viewer,
  taskID: UUID,
  taskAssigneeUserIDs: UUID[],
) {
  try {
    const credentials = await getJiraCredentials(viewer);
    if (!credentials) {
      return;
    }

    const { accessToken, cloudID } = credentials;

    const thirdPartyReference = await TaskThirdPartyReference.findForTask(
      taskID,
      'jira',
    );
    if (!thirdPartyReference) {
      return;
    }

    const issueID = thirdPartyReference.externalID;

    const [matchedJiraAccountIDs, unmatchedUsers] =
      await getThirdPartyMatchedAccounts(viewer, taskAssigneeUserIDs, 'jira');

    const [assigneeAccountID, ...watcherAccountIDs] = matchedJiraAccountIDs;

    await Promise.all([
      assignIssue(accessToken, cloudID, issueID, assigneeAccountID),
      ...watcherAccountIDs.map((watcherID) =>
        addIssueWatcher(accessToken, cloudID, issueID, watcherID),
      ),
    ]);

    await updateTaskPreviewData(viewer, thirdPartyReference);

    if (unmatchedUsers.length > 0) {
      await addIssueComment(
        accessToken,
        cloudID,
        issueID,
        unmatchedUsersToAtlassianDocument(unmatchedUsers),
      );
    }
  } catch (e) {
    handleThirdPartyException(
      `updateJiraTaskAssigneeAndWatchers`,
      e,
      'jira',
      viewer,
    );
  }
}

export async function createJiraSubtasks(
  viewer: Viewer,
  taskID: UUID,
  todos: TaskTodoEntity[],
) {
  try {
    const credentials = await getJiraCredentials(viewer);
    if (!credentials) {
      return;
    }

    const { accessToken, cloudID } = credentials;

    const [preferences, thirdPartyReference, task] = await Promise.all([
      getProjectAndIssueTypes(viewer),
      TaskThirdPartyReference.findForTask(taskID, 'jira'),
      TaskEntity.findByPk(taskID),
    ]);

    if (!preferences || !thirdPartyReference || !task) {
      return;
    }

    const { projectID, subissueType } = preferences;
    if (!projectID || !subissueType) {
      return;
    }

    const { messageID } = task;

    const message = await MessageEntity.findByPk(messageID);
    if (!message) {
      return;
    }

    const issueID = thirdPartyReference.externalID;

    // extract the message nodes for only the todos that should be created,
    // for example if you edit a message to add another TODO item in the list
    const createdTodoIDs = new Set(todos.map((todo) => todo.id));
    const todoNodes = todoNodesFromMessage(message.content).filter((node) =>
      createdTodoIDs.has(node.todoID),
    );

    let footerText = await getTaskFooterText(viewer, message, 'jira');
    if (typeof footerText === 'string') {
      footerText = emptyFooter;
    }

    const description = messageContentToAtlassianDocument(
      [{ text: '' }],
      footerText,
    );

    const subIssues = await Promise.all(
      todoNodes.map((todoNode) =>
        createIssue(
          accessToken,
          cloudID,
          textFromNodeRecursive(todoNode),
          description,
          projectID,
          subissueType,
          null,
          issueID,
        ),
      ),
    );

    const references = await Promise.all(
      subIssues.map((subIssue, index) =>
        TaskThirdPartyReference.create({
          taskID,
          taskTodoID: todoNodes[index].todoID,
          externalID: subIssue.id,
          externalConnectionType: 'jira',
          previewData: null,
          externalLocationID: cloudID,
        }),
      ),
    );

    // initial done state
    await Promise.all(
      todoNodes.map((todoNode, index) => {
        if (!todos.find(({ id }) => todoNode.todoID === id)?.done) {
          return null;
        }

        const reference = references.find(
          (ref) => ref.externalID === subIssues[index].id,
        );
        if (!reference) {
          return null;
        }

        return updateJiraTask(viewer, reference, true);
      }),
    );

    await publishMessageUpdateForTask(thirdPartyReference);
  } catch (e) {
    handleThirdPartyException(`createJiraSubtasks`, e, 'jira', viewer);
  }
}

export async function addJiraTaskAttachments(
  viewer: Viewer,
  externalIssueID: UUID,
  files: FileEntity[],
) {
  if (files.length === 0) {
    return;
  }

  try {
    const credentials = await getJiraCredentials(viewer);
    if (!credentials) {
      return;
    }
    const s3BucketLoader = new S3BucketLoader(viewer);

    const { accessToken, cloudID } = credentials;

    await Promise.all(
      files
        .filter((file) => file.uploadStatus === 'uploaded')
        .map(async (file) => {
          const url = await file.getSignedDownloadURL(s3BucketLoader);
          const response = await fetch(url);

          if (response.status === 200) {
            await addIssueAttachment(
              accessToken,
              cloudID,
              externalIssueID,
              file.name,
              file.mimeType,
              response.body!,
              file.size,
            );
          }
        }),
    );
  } catch (e) {
    handleThirdPartyException(`addJiraTaskAttachments`, e, 'jira', viewer);
  }
}

export async function updateJiraTask(
  viewer: Viewer,
  reference: TaskThirdPartyReference,
  done: boolean,
) {
  try {
    const credentials = await getJiraCredentials(viewer);
    if (!credentials) {
      return;
    }

    const { accessToken, cloudID } = credentials;
    const issueID = reference.externalID;

    const { transitions } = await getIssueTransitions(
      accessToken,
      cloudID,
      issueID,
    );

    const transitionToStatusKey = done ? 'done' : 'new';

    const transition = transitions.find(
      // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      (transition) =>
        transition.isAvailable &&
        transition.to.statusCategory.key === transitionToStatusKey,
    );

    if (!transition) {
      throw new Error(
        `Couldn't transition Jira issue ${issueID} to ${transitionToStatusKey} due to missing transition`,
      );
    }

    await transitionIssue(accessToken, cloudID, issueID, transition.id);

    // update the preview after the task is updated
    await updateTaskPreviewData(viewer, reference);
  } catch (e) {
    handleThirdPartyException(`updateJiraTask`, e, 'jira', viewer);
  }
}

async function getBaseURLForCloudInstance(
  cloudID: string,
): Promise<string | null> {
  try {
    const key = cacheKey({
      type: 'jira_cloud_base_url',
      cloudID,
    });

    let value = cache.get<string>(key);
    if (value === undefined) {
      const { baseUrl } = await getServerInfo(cloudID);
      value = baseUrl;
      cache.set(key, value);
    }

    return value;
  } catch (e) {
    handleThirdPartyException(`getBaseURLForCloudInstance`, e, 'jira');
    return null;
  }
}

async function updateTaskPreviewData(
  viewer: Viewer,
  externalReference: TaskThirdPartyReference,
) {
  // only update the preview if this is not a TODO issue
  if (!externalReference.taskTodoID) {
    const issueID = externalReference.externalID;
    const previewData = await getJiraIssuePreviewData(viewer, issueID);
    await externalReference.update({ previewData });
    await publishMessageUpdateForTask(externalReference);
  }
}

async function getJiraIssuePreviewData(
  viewer: Viewer,
  issueID: string,
): Promise<JiraIssuePreviewData | null> {
  try {
    const credentials = await getJiraCredentials(viewer);
    if (!credentials) {
      return null;
    }

    const { accessToken, cloudID } = credentials;

    const [issue, baseURL] = await Promise.all([
      getIssue(accessToken, cloudID, issueID),
      getBaseURLForCloudInstance(cloudID),
    ]);

    if (!baseURL) {
      return null;
    }

    return {
      key: issue.key,
      title: issue.fields.summary,
      url: `${baseURL}/browse/${issue.key}`,
      assignee: issue.fields.assignee?.displayName,
      status: issue.fields.status.statusCategory.name,
      done: issue.fields.status.statusCategory.key === 'done',
      priority: issue.fields.priority.name,
      subtasks: issue.fields.subtasks.map((subtask) => ({
        id: subtask.id,
        title: subtask.fields.summary,
        done: subtask.fields.status.statusCategory.key === 'done',
      })),
    };
  } catch (e) {
    handleThirdPartyException(`getJiraIssuePreviewData`, e, 'jira', viewer);
    return null;
  }
}
