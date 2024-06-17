import type {
  TrelloConnectionPreferencesType,
  UUID,
} from 'common/types/index.ts';
import {
  addMemberToCard,
  createCard,
  getUserResources,
} from 'server/src/third_party_tasks/trello/api.ts';
import { getExternalAuthData } from 'server/src/third_party_tasks/util.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { assertViewerHasIdentity } from 'server/src/auth/index.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import type { TaskEntity } from 'server/src/entity/task/TaskEntity.ts';
import {
  convertStructuredMessageToText,
  taskTitleFromMessageContent,
} from '@cord-sdk/react/common/lib/messageNode.ts';
import { TRELLO_CONNECTED_LIST } from 'common/const/UserPreferenceKeys.ts';
import { TaskThirdPartyReference } from 'server/src/entity/task_third_party_reference/TaskThirdPartyReferenceEntity.ts';
import { UserPreferenceLoader } from 'server/src/entity/user_preference/UserPreferenceLoader.ts';
import { ThirdPartyConnectionEntity } from 'server/src/entity/third_party_connection/ThirdPartyConnectionEntity.ts';
import type { Logger } from 'server/src/logging/Logger.ts';

async function getAccessToken(viewer: Viewer): Promise<string | null> {
  const tokens = await getExternalAuthData(viewer, 'trello');
  if (!tokens?.accessToken) {
    return null;
  }
  return tokens.accessToken;
}

export async function getTrelloWorkSpace(
  viewer: Viewer,
): Promise<TrelloConnectionPreferencesType | null> {
  const accessToken = await getAccessToken(viewer);
  if (!accessToken) {
    return null;
  }

  return await getUserResources(accessToken);
}

export async function createTrelloTask(
  logger: Logger,
  viewer: Viewer,
  task: TaskEntity,
) {
  const accessToken = await getAccessToken(viewer);
  if (!accessToken) {
    return null;
  }
  const message = await MessageEntity.findByPk(task.messageID);
  if (!message) {
    logger.error(
      `Failed to fetch message ${task.messageID} linked to task ${task.id}`,
    );
    return;
  }

  const name = taskTitleFromMessageContent(message.content);
  const messageContent = convertStructuredMessageToText(message.content);
  const cordReference = `This task was created using Cord, see original task here ${message.url}`;
  const desc = messageContent + '\n' + cordReference;
  const userPreferenceLoader = new UserPreferenceLoader(viewer);

  const userTrelloList =
    await userPreferenceLoader.loadPreferenceValueForViewer<string>(
      TRELLO_CONNECTED_LIST,
    );

  if (!userTrelloList) {
    return null;
  }

  const { id } = await createCard(accessToken, {
    name,
    desc,
    idList: userTrelloList,
  });

  if (!id) {
    logger.error('Failed to get card id from response');
    return;
  }

  await TaskThirdPartyReference.create({
    taskID: task.id,
    externalID: id,
    externalConnectionType: 'trello',
  });

  return id;
}

export async function addAssigneesToTrelloTask(
  viewer: Viewer,
  taskID: UUID,
  taskAssigneesUserIDs: UUID[],
) {
  const accessToken = await getAccessToken(viewer);
  if (!accessToken) {
    return;
  }

  const thirdPartyReference = await TaskThirdPartyReference.findForTask(
    taskID,
    'trello',
  );
  if (!thirdPartyReference) {
    return;
  }
  const trelloCardID = thirdPartyReference.externalID;

  const connectedTrelloTaskAssignees = await getTrelloMatchedUsers(
    viewer,
    taskAssigneesUserIDs,
  );
  const connectedTaskAssigneesMemberIDs = connectedTrelloTaskAssignees.map(
    (thirdPartyData) => thirdPartyData.externalID,
  );

  await Promise.all(
    connectedTaskAssigneesMemberIDs.map((memberID) =>
      addMemberToCard(accessToken, trelloCardID, memberID),
    ),
  );
}

async function getTrelloMatchedUsers(
  viewer: Viewer,
  taskAssigneesUserIDs: UUID[],
) {
  const { orgID } = assertViewerHasIdentity(viewer);
  const connectedAssigneesUsers = await ThirdPartyConnectionEntity.findAll({
    where: {
      userID: taskAssigneesUserIDs,
      orgID,
      type: 'trello',
    },
  });

  return connectedAssigneesUsers;
}
