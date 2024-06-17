import { v4 as uuid } from 'uuid';

import type { Viewer } from 'server/src/auth/index.ts';
import {
  assertViewerHasIdentity,
  assertViewerHasUser,
} from 'server/src/auth/index.ts';
import { cache, cacheKey } from 'server/src/util/cache.ts';
import type {
  MondayBoard,
  MondayConnectionPreferences,
  MondayItemPreviewData,
  UUID,
} from 'common/types/index.ts';
import {
  findTaskAndMessageEntitiesFromExternalTaskID,
  getExternalAuthData,
  getTaskFooterText,
  getThirdPartyMatchedAccounts,
  handleThirdPartyException,
  publishMessageUpdateForTask,
} from 'server/src/third_party_tasks/util.ts';
import {
  createItem,
  createUpdate,
  getBoards,
  getMondayPreviewData,
  addAssignees,
  setItemStatus,
  createSubItem,
  canCreateSubItems,
  findOldestUpdate,
  uploadFile,
  createWebhook,
} from 'server/src/third_party_tasks/monday/api.ts';
import { TaskEntity } from 'server/src/entity/task/TaskEntity.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import {
  taskTitleFromMessageContent,
  textFromNodeRecursive,
  todoNodesFromMessage,
} from '@cord-sdk/react/common/lib/messageNode.ts';
import { messageContentToMondayHtml } from 'server/src/third_party_tasks/asana/util.ts';
import { UserPreferenceEntity } from 'server/src/entity/user_preference/UserPreferenceEntity.ts';
import { MONDAY_CONNECTION_PREFERENCES } from 'common/const/UserPreferenceKeys.ts';
import { TaskThirdPartyReference } from 'server/src/entity/task_third_party_reference/TaskThirdPartyReferenceEntity.ts';
import { anonymousLogger, Logger } from 'server/src/logging/Logger.ts';
import { isDefined } from 'common/util/index.ts';
import { pluralize } from '@cord-sdk/react/common/util.ts';
import { userDisplayName } from 'server/src/entity/user/util.ts';
import type { TaskTodoEntity } from 'server/src/entity/task_todo/TaskTodoEntity.ts';
import type { FileEntity } from 'server/src/entity/file/FileEntity.ts';
import { S3BucketLoader } from 'server/src/entity/s3_bucket/S3BucketLoader.ts';
import { TaskAssigneeEntity } from 'server/src/entity/task_assignee/TaskAssigneeEntity.ts';
import { ThirdPartyConnectionEntity } from 'server/src/entity/third_party_connection/ThirdPartyConnectionEntity.ts';
import { TaskThirdPartySubscriptionEntity } from 'server/src/entity/task_third_party_subscription/TaskThirdPartySubscriptionEntity.ts';
import { MONDAY_EVENTS_PATH_BASE } from 'server/src/public/routes/MainRouter.ts';
import { API_SERVER_HOST } from 'common/const/Urls.ts';
import { getRedis } from 'server/src/redis/index.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';

type MondayCredentials = {
  accessToken: string;
};

async function getMondayCredentials(
  viewer: Viewer,
): Promise<MondayCredentials | null> {
  try {
    const { userID, orgID } = assertViewerHasIdentity(viewer);

    const key = cacheKey({ type: 'monday_credentials', userID, orgID });

    let credentials = cache.get<MondayCredentials>(key);
    if (credentials !== undefined) {
      return credentials;
    }

    const externalData = await getExternalAuthData(viewer, 'monday');
    if (externalData === null) {
      return null;
    }

    const { accessToken } = externalData;

    credentials = {
      accessToken,
    };

    // Monday provides an access token that never expires, arbitrarily cache it
    // for a year
    cache.set<MondayCredentials>(key, credentials, 60 * 60 * 24 * 365);

    return credentials;
  } catch (e) {
    handleThirdPartyException('getMondayCredentials', e, 'monday', viewer);
    return null;
  }
}

export async function fetchMondayBoards(
  viewer: Viewer,
): Promise<MondayBoard[]> {
  try {
    const credentials = await getMondayCredentials(viewer);
    if (!credentials) {
      return [];
    }

    const { accessToken } = credentials;

    return await getBoards(accessToken);
  } catch (e) {
    handleThirdPartyException('fetchMondayBoards', e, 'monday', viewer);
    return [];
  }
}

export async function createMondayTask(viewer: Viewer, task: TaskEntity) {
  try {
    const credentials = await getMondayCredentials(viewer);
    if (!credentials) {
      return;
    }
    const { accessToken } = credentials;
    const message = await MessageEntity.findByPk(task.messageID);
    if (!message) {
      throw new Error(
        `Failed to fetch message ${task.messageID} linked to task ${task.id}`,
      );
    }
    const title = taskTitleFromMessageContent(message.content);

    let footerText = await getTaskFooterText(viewer, message, 'monday');
    if (typeof footerText !== 'string') {
      footerText = '';
    }

    const htmlNotes = messageContentToMondayHtml(message.content, footerText);
    const preferences = await getConnectionPreferences(viewer);
    if (!preferences) {
      throw new Error(
        `Could not get Monday connection preferences, which we need to choose the Monday board, when creating task ${task.id}`,
      );
    }
    const itemID = await createItem(
      accessToken,
      preferences.boardID,
      preferences.groupID,
      title,
      htmlNotes,
    );

    const previewData = await getMondayPreviewData(accessToken, itemID);

    const externalReference = await TaskThirdPartyReference.create({
      taskID: task.id,
      externalID: itemID,
      externalConnectionType: 'monday',
      previewData,
    });

    // Initial done state
    if (task.done) {
      await updateMondayTask(viewer, externalReference, true);
    }
    await ensureWebhook(viewer, accessToken, preferences.boardID);
  } catch (e) {
    handleThirdPartyException(
      `Failed to create Monday task for task ${task.id}`,
      e,
      'monday',
      viewer,
    );
  }
}

async function getConnectionPreferences(viewer: Viewer) {
  const userID = assertViewerHasUser(viewer);
  const response = await UserPreferenceEntity.findOne({
    where: {
      userID,
      key: MONDAY_CONNECTION_PREFERENCES,
    },
  });

  return response ? (response.value as MondayConnectionPreferences) : undefined;
}

export async function addMondayAssignees(
  viewer: Viewer,
  taskID: UUID,
  newAssigneeUserIDs: UUID[],
) {
  const logger = new Logger(viewer);
  try {
    const credentials = await getMondayCredentials(viewer);
    if (!credentials) {
      return;
    }

    const { accessToken } = credentials;

    const thirdPartyReference = await TaskThirdPartyReference.findForTask(
      taskID,
      'monday',
    );
    if (!thirdPartyReference) {
      return;
    }

    const itemID = thirdPartyReference.externalID;

    const [matchedAccountIDs, unmatchedUsers] =
      await getThirdPartyMatchedAccounts(viewer, newAssigneeUserIDs, 'monday');

    await addAssignees(accessToken, itemID, matchedAccountIDs, logger);

    await updateItemPreviewData(accessToken, thirdPartyReference);

    if (unmatchedUsers.length > 0) {
      await createUpdate(
        accessToken,
        itemID,
        unmatchedUsersText(unmatchedUsers),
      );
    }
  } catch (e) {
    handleThirdPartyException(`updateMondayAssignees`, e, 'monday', viewer);
  }
}

async function updateItemPreviewData(
  accessToken: string,
  externalReference: TaskThirdPartyReference,
) {
  // only update the preview if this is not a TODO issue
  if (!externalReference.taskTodoID) {
    const itemID = externalReference.externalID;
    const previewData = await getMondayPreviewData(accessToken, itemID);
    await externalReference.update({ previewData });
    await publishMessageUpdateForTask(externalReference);
  }
}

function unmatchedUsersText(noMatchUsers: UserEntity[]) {
  if (noMatchUsers.length === 0) {
    return '';
  }
  return [
    'This task was assigned to the following Cord users who did not have Monday connected:',
    ...noMatchUsers.map((user) => `${userDisplayName(user)} (${user.email})`),
  ].join('\n');
}

export async function updateMondayTask(
  viewer: Viewer,
  externalReference: TaskThirdPartyReference,
  done: boolean,
) {
  const logger = new Logger(viewer);
  try {
    if (externalReference.externalConnectionType !== 'monday') {
      throw new Error(
        `Expected connection type "monday" but got ${externalReference.externalConnectionType} instead.`,
      );
    }

    const credentials = await getMondayCredentials(viewer);
    if (!credentials) {
      return;
    }

    const { accessToken } = credentials;

    await setItemStatus(
      accessToken,
      externalReference.externalID,
      done,
      logger,
    );

    await updateItemPreviewData(accessToken, externalReference);
  } catch (e) {
    handleThirdPartyException('updateMondayTask', e, 'monday', viewer);
    return;
  }
}

export async function createMondaySubtasks(
  viewer: Viewer,
  taskID: UUID,
  todos: TaskTodoEntity[],
) {
  try {
    const credentials = await getMondayCredentials(viewer);
    if (!credentials) {
      return;
    }

    const { accessToken } = credentials;

    const [task, thirdPartyReference] = await Promise.all([
      TaskEntity.findByPk(taskID),
      TaskThirdPartyReference.findForTask(taskID, 'monday'),
    ]);

    if (!task || !thirdPartyReference) {
      return;
    }

    const { messageID } = task;

    const message = await MessageEntity.findByPk(messageID);
    if (!message) {
      return;
    }

    const itemID = thirdPartyReference.externalID;
    if (!(await canCreateSubItems(accessToken, itemID))) {
      return;
    }
    const createdTodoIDs = new Set(todos.map((todo) => todo.id));
    const todoNodes = todoNodesFromMessage(message.content).filter((node) =>
      createdTodoIDs.has(node.todoID),
    );

    let footerText = await getTaskFooterText(viewer, message, 'monday');
    if (typeof footerText !== 'string') {
      footerText = '';
    }

    const description = messageContentToMondayHtml([], footerText);

    const subItemIDs = await Promise.all(
      todoNodes.map((todoNode) =>
        createSubItem(
          accessToken,
          itemID,
          textFromNodeRecursive(todoNode),
          description,
        ),
      ),
    );

    const externalReferences = (
      await Promise.all(
        subItemIDs.map((subItemID, i) => {
          if (!subItemID) {
            return;
          }

          return TaskThirdPartyReference.create({
            taskID: taskID,
            externalID: subItemID,
            externalConnectionType: 'monday',
            taskTodoID: todoNodes[i].todoID,
            previewData: null,
          });
        }),
      )
    ).filter(isDefined);

    // Initial done state
    await Promise.all(
      todoNodes.map((todoNode, i) => {
        if (!todos.find(({ id }) => todoNode.todoID === id)?.done) {
          return null;
        }

        const externalReference = externalReferences.find(
          // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
          (externalReference) => externalReference.externalID === subItemIDs[i],
        );
        if (!externalReference) {
          return null;
        }

        return updateMondayTask(viewer, externalReference, true);
      }),
    );
  } catch (e) {
    handleThirdPartyException('createMondaySubtasks', e, 'monday', viewer);
    return;
  }
}

export async function addMondayTaskAttachments(
  viewer: Viewer,
  itemID: string,
  files: FileEntity[],
) {
  try {
    const credentials = await getMondayCredentials(viewer);
    if (credentials === null) {
      return;
    }
    const { accessToken } = credentials;
    const s3BucketLoader = new S3BucketLoader(viewer);

    const updateID = await findOldestUpdate(accessToken, itemID);
    if (!updateID) {
      return;
    }
    await Promise.all(
      files
        .filter((file) => file.uploadStatus === 'uploaded')
        .map(async (file) => {
          const url = await file.getSignedDownloadURL(s3BucketLoader);
          const response = await fetch(url);

          if (response.status === 200) {
            await uploadFile(
              accessToken,
              updateID,
              file.name,
              file.mimeType,
              file.size,
              response.body!,
            );
          } else {
            throw new Error(
              `failed to attach file ${file.id} to Monday task ${itemID}`,
            );
          }
        }),
    );
  } catch (e) {
    handleThirdPartyException(
      `Failed to attach file to Monday task ${itemID}`,
      e,
      'monday',
      viewer,
    );
  }
}

async function ensureWebhook(
  viewer: Viewer,
  accessToken: string,
  boardID: string,
) {
  // Prevent two different requests from executing this code within 60 seconds,
  // to prevent a race condition from causing multiple subscriptions to the same
  // board
  if (
    (await getRedis().incrAndExpire(
      `subscription-create-monday-${boardID}`,
      60,
    )) !== 1
  ) {
    return;
  }
  const subscription = await TaskThirdPartySubscriptionEntity.findOne({
    where: {
      externalConnectionType: 'monday',
      'subscriptionDetails.boardID': boardID,
    },
  });
  if (subscription) {
    return;
  }
  const { userID, orgID } = assertViewerHasIdentity(viewer);
  const id = uuid();
  const url = `https://${API_SERVER_HOST}${MONDAY_EVENTS_PATH_BASE}/${id}`;
  const webhookID = await createWebhook(accessToken, boardID, url);
  if (webhookID) {
    await TaskThirdPartySubscriptionEntity.create({
      id,
      userID,
      orgID,
      externalConnectionType: 'monday',
      subscriptionDetails: {
        boardID,
        webhookID,
      },
    });
  }
}

type MondayWebhookEventCommon = {
  boardId: number;
  pulseId: number;
  columnId: string;
  type: string;
};

type MondayAssigneeValue = {
  personsAndTeams?: Array<{
    id: number;
    kind: 'person' | 'team';
  }>;
};

type MondayWebhookAssigneeEvent = MondayWebhookEventCommon & {
  columnType: 'multiple-person';
  // A null value appears to indicate no assignees
  value: MondayAssigneeValue | null;
  previousValue: MondayAssigneeValue | null;
};

type MondayStatusValue = {
  label: {
    index: number;
    is_done: boolean;
  };
};

type MondayWebhookStatusEvent = MondayWebhookEventCommon & {
  columnType: 'color';
  // A null value sometimes appears to indicate the default grey value
  value: MondayStatusValue | null;
  previousValue: MondayStatusValue | null;
};

export type MondayWebhookEvent =
  | MondayWebhookAssigneeEvent
  | MondayWebhookStatusEvent;

export async function webhookUpdateAssignee(
  itemID: string,
  event: MondayWebhookAssigneeEvent,
) {
  try {
    const entities = await findTaskAndMessageEntitiesFromExternalTaskID(
      itemID,
      'monday',
    );

    if (!entities) {
      return;
    }

    const { taskEntity, messageEntity, thirdPartyTaskEntity } = entities;

    const previewData =
      thirdPartyTaskEntity.previewData as MondayItemPreviewData | null;
    // Monday can have multiple assignee columns, and we choose one in the
    // preview data to be the one we consider canonical, so ignore updates from
    // any other assignee column.
    if (previewData?.assigneeColumnID !== event.columnId) {
      return;
    }

    const newIDs = (event.value?.personsAndTeams ?? []).map((pat) =>
      pat.id.toString(),
    );
    const oldIDs = (event.previousValue?.personsAndTeams ?? []).map((pat) =>
      pat.id.toString(),
    );

    const toRemove = oldIDs.filter((id) => !newIDs.includes(id));
    const toAdd = newIDs.filter((id) => !oldIDs.includes(id));

    const taskID = taskEntity.id;

    const { orgID } = messageEntity;

    await Promise.all([
      ...toRemove.map(async (id) => {
        const thirdPartyConnection = await ThirdPartyConnectionEntity.findOne({
          where: { externalID: id, orgID },
        });
        if (!thirdPartyConnection) {
          anonymousLogger().info(
            `Could not find Monday user ${id} as a Cord user`,
          );
          return;
        } else {
          const { userID } = thirdPartyConnection;
          // removes the assignee that was unassigned from Monday in Cord
          return await TaskAssigneeEntity.destroy({
            where: { taskID, userID, orgID },
          });
        }
      }),
      ...toAdd.map(async (id) => {
        const thirdPartyConnection = await ThirdPartyConnectionEntity.findOne({
          where: { externalID: id, orgID },
        });
        if (!thirdPartyConnection) {
          anonymousLogger().info(
            `Could not find Monday user ${id} as a Cord user`,
          );
        } else {
          const { userID } = thirdPartyConnection;
          // check if entity already exists as when we add an assignee on a new
          // task, because of the way the mutators work the webhook thinks this
          // is an update.
          await TaskAssigneeEntity.findOrCreate({
            where: { taskID, userID, orgID },
          });
        }
      }),
    ]);

    await thirdPartyTaskEntity.update({
      previewData: {
        ...previewData,
        assignee: newIDs.length
          ? // NOTE(flooey): Ideally we would use the person's name, but it's not
            // delivered in the event, so we would have to call the API to get
            // it
            pluralize(newIDs.length, 'person', 'people')
          : null,
      },
    });
    await publishMessageUpdateForTask(thirdPartyTaskEntity);
  } catch (e) {
    handleThirdPartyException(
      `Failed to update Monday assignee in task ${itemID}`,
      e,
      'monday',
    );
  }
}

export async function webhookUpdateStatus(
  itemID: string,
  event: MondayWebhookStatusEvent,
) {
  try {
    const entities = await findTaskAndMessageEntitiesFromExternalTaskID(
      itemID,
      'monday',
    );

    if (!entities) {
      return;
    }

    const { taskEntity, thirdPartyTaskEntity } = entities;

    const previewData =
      thirdPartyTaskEntity.previewData as MondayItemPreviewData | null;
    // Monday can have multiple status columns, and we choose one in the preview
    // data to be the one we consider canonical, so ignore updates from any
    // other status column.
    if (previewData?.statusColumnID !== event.columnId) {
      return;
    }

    await taskEntity.update({
      done: !!event.value?.label.is_done,
    });

    await thirdPartyTaskEntity.update({
      previewData: {
        ...previewData,
        done: !!event.value?.label.is_done,
      },
    });
    await publishMessageUpdateForTask(thirdPartyTaskEntity);
  } catch (e) {
    handleThirdPartyException(
      `Failed to update Monday status in task ${itemID}`,
      e,
      'monday',
    );
  }
}
