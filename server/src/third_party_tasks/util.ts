import type { JsonValue, UUID } from 'common/types/index.ts';
import {
  assertViewerHasIdentity,
  assertViewerHasOrg,
  Viewer,
} from 'server/src/auth/index.ts';
import type {
  AsanaAuthData,
  JiraAuthData,
  LinearAuthData,
  TrelloAuthData,
} from 'server/src/entity/third_party_connection/ThirdPartyConnectionEntity.ts';
import { ThirdPartyConnectionEntity } from 'server/src/entity/third_party_connection/ThirdPartyConnectionEntity.ts';
import { cache, cacheKey } from 'server/src/util/cache.ts';
import { Errors } from 'common/const/Errors.ts';
import { UserPreferenceMutator } from 'server/src/entity/user_preference/UserPreferenceMutator.ts';
import { UserPreferenceLoader } from 'server/src/entity/user_preference/UserPreferenceLoader.ts';
import { DEFAULT_TASK_TYPE } from 'common/const/UserPreferenceKeys.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';
import { TaskEntity } from 'server/src/entity/task/TaskEntity.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { TaskThirdPartyReference } from 'server/src/entity/task_third_party_reference/TaskThirdPartyReferenceEntity.ts';
import type {
  TaskInputType,
  ThirdPartyConnectionType,
} from 'server/src/schema/resolverTypes.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import type { AtlassianDocumentNode } from 'server/src/third_party_tasks/jira/util.ts';
import { Logger } from 'server/src/logging/Logger.ts';
import { isDefined } from 'common/util/index.ts';
import {
  FeatureFlags,
  getTypedFeatureFlagValue,
} from 'server/src/featureflags/index.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { UserLoader } from 'server/src/entity/user/UserLoader.ts';
import { backgroundPromise } from 'server/src/util/backgroundPromise.ts';

// fancy way of determining the result type of the function based on the
// value of the `type` input argument
type ResultType<T extends ThirdPartyConnectionType> = T extends 'linear'
  ? LinearAuthData
  : T extends 'asana'
  ? AsanaAuthData
  : T extends 'jira'
  ? JiraAuthData
  : T extends 'trello'
  ? TrelloAuthData
  : never;

export async function getExternalAuthData<T extends ThirdPartyConnectionType>(
  viewer: Viewer,
  type: T,
): Promise<ResultType<T> | null> {
  const { userID, orgID } = assertViewerHasIdentity(viewer);
  const connection = await ThirdPartyConnectionEntity.findOne({
    where: { userID, orgID, type },
  });

  if (!connection?.externalAuthData) {
    return null;
  }

  return connection.externalAuthData as ResultType<T>;
}

const credentialsCacheKey = (
  userID: UUID,
  orgID: UUID,
  type: ThirdPartyConnectionType,
) => cacheKey({ type: `${type}_credentials`, userID, orgID });

export async function removeExternalConnection(
  viewer: Viewer,
  type: ThirdPartyConnectionType,
) {
  const { userID, orgID } = assertViewerHasIdentity(viewer);

  cache.del(credentialsCacheKey(userID, orgID, type));

  const defaultTaskType = await new UserPreferenceLoader(
    viewer,
  ).loadPreferenceValueForViewer<TaskInputType>(DEFAULT_TASK_TYPE);

  if (defaultTaskType === type) {
    await new UserPreferenceMutator(viewer).setViewerPreference(
      DEFAULT_TASK_TYPE,
      'cord',
    );
  }

  const count = await ThirdPartyConnectionEntity.destroy({
    where: { userID, orgID, type },
  });

  return count > 0;
}

export function handleThirdPartyException(
  message: string,
  exception: any,
  type: ThirdPartyConnectionType,
  viewer?: Viewer,
) {
  backgroundPromise(
    (async () => {
      const logger = new Logger(viewer ?? Viewer.createAnonymousViewer());
      if (
        viewer &&
        exception.message === Errors.EXTERNAL_API_FORBIDDEN_RESPONSE
      ) {
        try {
          logger.logException(message, exception, undefined, undefined, 'warn');

          // TODO: check if the access token is actually invalid before removing it
          await removeExternalConnection(viewer, type);
        } catch (e) {
          // whatever
        }
      } else {
        logger.logException(message, exception);
      }
    })(),
  );
}

export const publishMessageUpdateForTask = async (
  reference: TaskThirdPartyReference,
) => {
  // notify subscribers so that user's UI reflects the changes

  const task = await TaskEntity.findByPk(reference.taskID);
  if (!task) {
    return;
  }

  const message = await MessageEntity.findByPk(task.messageID);
  if (!message) {
    return;
  }

  backgroundPromise(
    publishPubSubEvent(
      'thread-message-updated',
      { threadID: message.threadID },
      { messageID: message.id },
    ),
  );
};

const generateLinearTaskFooterText = (
  url: string,
  pageTitle: string,
  showCordCopy: boolean,
  orgDomain?: string,
  platformApplicationName?: string,
) => {
  if (platformApplicationName) {
    // Embedded version
    return `Continue the Conversation on [${
      pageTitle || 'this page'
    }](${url}) in ${platformApplicationName}
    ${showCordCopy ? 'Powered by [Cord](https://cord.com)' : ''}`;
  } else {
    // Extension version
    return `Created from [${pageTitle || 'this page'}](${url})
    Continue the conversation with [Cord](https://app.cord.com/${
      orgDomain ?? ''
    })`;
  }
};

const generateAsanaOrMondayTaskFooterText = (
  url: string,
  pageTitle: string,
  showCordCopy: boolean,
  orgDomain?: string,
  platformApplicationName?: string,
): string => {
  const pageLink = `<a href="${encodeURI(url)}">${
    pageTitle || 'this page'
  }</a>`;

  if (platformApplicationName) {
    // Embedded version
    const cordLink = `<a href="${encodeURI('https://cord.com')}">Cord</a>`;

    return `Continue the Conversation on ${pageLink} in ${platformApplicationName}\n${
      showCordCopy ? `Powered by ${cordLink}` : ''
    }`;
  } else {
    // Extension version
    const cordLink = `<a href="${encodeURI(
      `https://app.cord.com/${orgDomain ?? ''}`,
    )}">Cord</a>`;

    return `Created from ${pageLink}\nContinue the conversation with ${cordLink}`;
  }
};

const generateJiraTaskFooterText = (
  url: string,
  pageTitle: string,
  showCordCopy?: boolean,
  orgDomain?: string,
  platformApplicationName?: string,
) => {
  if (platformApplicationName) {
    // Embedded version
    const copy = [
      {
        type: 'text',
        text: 'Continue the Conversation on ',
      },
      {
        type: 'text',
        text: pageTitle || 'this page',
        marks: [
          {
            type: 'link',
            attrs: { href: url },
          },
        ],
      },
      {
        type: 'text',
        text: ` in ${platformApplicationName}`,
      },
    ];
    if (showCordCopy) {
      copy.concat([
        {
          type: 'text',
          text: `\nPowered by `,
        },
        {
          type: 'text',
          text: 'Cord',
          marks: [
            {
              type: 'link',
              attrs: { href: 'https://cord.com' },
            },
          ],
        },
      ]);
    }
    return copy;
  } else {
    // Extension version
    return [
      {
        type: 'text',
        text: 'Created from ',
      },
      {
        type: 'text',
        text: pageTitle || 'this page',
        marks: [
          {
            type: 'link',
            attrs: { href: url },
          },
        ],
      },
      {
        type: 'text',
        text: `\nContinue the conversation with `,
      },
      {
        type: 'text',
        text: 'Cord',
        marks: [
          {
            type: 'link',
            attrs: { href: `https://app.cord.com/${orgDomain ?? ''}` },
          },
        ],
      },
    ];
  }
};

export async function getTaskFooterText(
  viewer: Viewer,
  message: MessageEntity,
  connectionType: ThirdPartyConnectionType,
): Promise<string | AtlassianDocumentNode[]> {
  const { orgID, userID } = assertViewerHasIdentity(viewer);

  let application;
  if (viewer.platformApplicationID) {
    application = await ApplicationEntity.findByPk(
      viewer.platformApplicationID,
    );
  }

  const showCordCopy = await getTypedFeatureFlagValue(
    FeatureFlags.SHOW_CORD_COPY_IN_TASKS,
    {
      userID,
      orgID,
      platformApplicationID: viewer.platformApplicationID ?? 'extension',
      version: null,
      customerID: application?.customerID,
    },
  );

  const org = await OrgEntity.findByPk(orgID);
  if (!org) {
    return '';
  }

  const thread = await ThreadEntity.findByPk(message.threadID);
  if (!thread) {
    return '';
  }

  let applicationName: string | undefined;
  if (org.platformApplicationID) {
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    const application = await ApplicationEntity.findByPk(
      org.platformApplicationID,
    );
    if (!application) {
      return '';
    }

    applicationName = application.name;
  }

  if (message.url === null) {
    // TODO: maybe we want at least some footer if there is no URL
    return '';
  }

  switch (connectionType) {
    case 'linear': {
      return generateLinearTaskFooterText(
        message.url,
        thread.name,
        showCordCopy,
        org.domain ?? undefined,
        applicationName,
      );
    }
    case 'asana':
    case 'monday': {
      return generateAsanaOrMondayTaskFooterText(
        message.url,
        thread.name,
        showCordCopy,
        org.domain ?? undefined,
        applicationName,
      );
    }
    case 'jira': {
      return generateJiraTaskFooterText(
        message.url,
        thread.name,
        showCordCopy,
        org.domain ?? undefined,
        applicationName,
      );
    }
    default:
      return '';
  }
}

const GRAPHQL_ENDPOINTS = {
  linear: {
    endpoint: 'https://api.linear.app/graphql',
    authHeader: (token: string) => `Bearer ${token}`,
  },
  monday: {
    endpoint: 'https://api.monday.com/v2',
    authHeader: (token: string) => token,
  },
} as const;

export async function thirdPartyGraphQLRequest<T extends JsonValue = JsonValue>(
  service: keyof typeof GRAPHQL_ENDPOINTS,
  query: string,
  accessToken: string,
  variables: object | null = null,
): Promise<T> {
  const response = await fetch(GRAPHQL_ENDPOINTS[service].endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: GRAPHQL_ENDPOINTS[service].authHeader(accessToken),
    },
    body: JSON.stringify({ query, variables }),
  });
  const responseText = await response.text();
  let responseJson;
  try {
    responseJson = JSON.parse(responseText);
  } catch (e) {
    throw new Error('Failed to obtain JSON response from: ' + responseText);
  }

  if (responseJson.errors || responseJson.error_message) {
    if (
      responseJson.errors &&
      responseJson.errors[0].message === 'authentication failed'
    ) {
      throw new Error(Errors.EXTERNAL_API_FORBIDDEN_RESPONSE);
    } else {
      throw new Error(
        responseJson.errors
          ? JSON.stringify(responseJson.errors)
          : responseJson.error_message,
      );
    }
  }

  return responseJson.data;
}

async function getThirdPartyExternalIDs(
  viewer: Viewer,
  users: UserEntity[],
  thirdPartyType: ThirdPartyConnectionType,
): Promise<(string | undefined)[]> {
  try {
    const orgID = assertViewerHasOrg(viewer);
    const connections = await ThirdPartyConnectionEntity.findAll({
      where: {
        userID: users.map(({ id }) => id),
        orgID,
        type: thirdPartyType,
      },
    });

    const userIDtoAccountID = new Map(
      connections.map((connection) => [
        connection.userID,
        connection.externalID,
      ]),
    );

    return users.map((user) => userIDtoAccountID.get(user.id));
  } catch (e) {
    handleThirdPartyException(
      'getThirdPartyExternalIDs',
      e,
      thirdPartyType,
      viewer,
    );
    return [];
  }
}

export async function getThirdPartyMatchedAccounts(
  viewer: Viewer,
  taskAssigneeUserIDs: UUID[],
  thirdPartyType: ThirdPartyConnectionType,
): Promise<[string[], UserEntity[]]> {
  if (taskAssigneeUserIDs.length === 0) {
    // nothing to do
    return [[], []];
  }

  try {
    const { orgID } = assertViewerHasIdentity(viewer);

    const userLoader = new UserLoader(viewer, () => null);
    const users = await userLoader.loadUsersInOrg(taskAssigneeUserIDs, orgID);

    const mondayProfileAccountIDs = await getThirdPartyExternalIDs(
      viewer,
      users,
      thirdPartyType,
    );

    const matchedAccountIDs = mondayProfileAccountIDs.filter(isDefined);

    const unmatchedUsers = users.filter(
      (_user, i) => !mondayProfileAccountIDs[i],
    );

    return [matchedAccountIDs, unmatchedUsers];
  } catch (e) {
    handleThirdPartyException(
      'getThirdPartyMatchedAccounts',
      e,
      thirdPartyType,
      viewer,
    );
    return [[], []];
  }
}

export async function findTaskAndMessageEntitiesFromExternalTaskID(
  externalTaskID: string,
  thirdPartyType: ThirdPartyConnectionType,
) {
  const thirdPartyTaskEntity =
    await TaskThirdPartyReference.findTaskWithExternalID(
      externalTaskID,
      thirdPartyType,
    );

  if (!thirdPartyTaskEntity) {
    return null;
  }
  const taskID = thirdPartyTaskEntity.taskID;

  const taskEntity = await TaskEntity.findByPk(taskID);

  if (!taskEntity) {
    throw new Error(`Could not find task entity`);
  }

  const messageEntity = await MessageEntity.findByPk(taskEntity.messageID);

  if (!messageEntity) {
    throw new Error(`Could not find task message`);
  }
  return {
    thirdPartyTaskEntity,
    taskEntity,
    messageEntity,
  };
}
