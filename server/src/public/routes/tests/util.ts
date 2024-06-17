import gql from 'graphql-tag';
import { v4 as uuid } from 'uuid';
import type { Transaction, WhereOptions } from 'sequelize';
import { Sequelize } from 'sequelize';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import type {
  UUID,
  MessageContent,
  EntityMetadata,
  Location,
} from 'common/types/index.ts';
import { MessageNodeType } from 'common/types/index.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { AuthProviderType } from 'server/src/auth/index.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { CustomerEntity } from 'server/src/entity/customer/CustomerEntity.ts';
import { PageMutator } from 'server/src/entity/page/PageMutator.ts';
import { ThreadMutator } from 'server/src/entity/thread/ThreadMutator.ts';
import { MessageMutator } from 'server/src/entity/message/MessageMutator.ts';
import { ThreadParticipantMutator } from 'server/src/entity/thread_participant/ThreadParticipantMutator.ts';
import { executeGraphQLOperation } from 'server/src/tests/setupEnvironment.ts';

import type {
  TaskInput,
  // eslint-disable-next-line import/no-restricted-paths
} from 'external/src/graphql/operations.ts';
import {
  ThreadByExternalID2Query,
  UpdateMessageMutation,
  CreateMessageReactionMutation,
  CreateThreadMessageMutation,
  MarkThreadSeenMutation,
  CreateThreadMutation,
  SetThreadResolvedMutation,
  SetSubscribedMutation,
  // eslint-disable-next-line import/no-restricted-paths
} from 'external/src/graphql/operations.ts';
import { messageContentFromString } from '@cord-sdk/react/common/lib/messageNode.ts';
import { PageEntity } from 'server/src/entity/page/PageEntity.ts';
import { getNewLoaders } from 'server/src/RequestContextLoaders.ts';
import type { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';

export async function createThread(
  name: string,
  orgID: UUID,
  pageContextHash: UUID,
  platformApplicationID: UUID,
) {
  const threadID: UUID = uuid();

  const [thread, _isNewThread] = await ThreadEntity.findOrCreate({
    where: {
      id: threadID,
      orgID,
      name,
      url: 'some/url',
      platformApplicationID,
    },
    defaults: {
      pageContextHash,
    } as any, // "as any" to work around deficiency in sequelize types, not combined with "where" items.
  });

  return thread;
}

export async function createPage(orgID: UUID, contextHash: UUID = uuid()) {
  const [page] = await PageEntity.findOrCreate({
    where: {
      orgID,
      contextData: {},
      contextHash,
    },
    defaults: {} as any, // "as any" to work around deficiency in sequelize types, not combined with "where" items.
  });

  return page;
}

export async function createPlatformApplication(
  name = 'platform app',
  sharedSecret = 'secret',
  customerID?: string,
) {
  if (!customerID) {
    const customer = await CustomerEntity.create({ name: 'test' });
    customerID = customer.id;
  }
  return await ApplicationEntity.create({
    name,
    sharedSecret,
    customerID,
  });
}

export async function createRandomPlatformOrg(
  platformApplicationID: string,
  externalID?: string | null,
  name?: string | null,
  state?: 'active' | 'inactive' | null,
): Promise<OrgEntity> {
  name = name ?? `org name${Math.floor(Math.random() * 10000)}`;
  externalID = externalID ?? `orgID${Math.floor(Math.random() * 1000000)}`;
  state = state ?? 'active';

  return await OrgEntity.create({
    name,
    externalID,
    state,
    externalProvider: AuthProviderType.PLATFORM,
    platformApplicationID,
  });
}

export async function createRandomSlackOrg(
  externalID?: string | null,
  name?: string | null,
  state?: 'active' | 'inactive' | null,
): Promise<OrgEntity> {
  name = name ?? `org name${Math.floor(Math.random() * 10000)}`;
  externalID = externalID ?? `orgID${Math.floor(Math.random() * 1000000)}`;
  state = state ?? 'active';

  return await OrgEntity.create({
    name,
    externalID,
    state,
    externalProvider: AuthProviderType.SLACK,
  });
}

type CreateRandomPlatformUserType = {
  externalID?: string | null;
  name?: string | null;
  screenName?: string | null;
  email?: string | null;
  profilePictureURL?: string | null;
  metadata?: EntityMetadata;
};

export function createRandomPlatformUser(
  platformApplicationID: string,
  {
    externalID,
    name,
    screenName,
    email,
    profilePictureURL,
    metadata,
  }: CreateRandomPlatformUserType = {},
): Promise<UserEntity> {
  const rand = Math.floor(Math.random() * 1000000);
  name = name ?? `Name ${rand}`;
  externalID = externalID ?? `id${rand}`;
  email = email ?? `${rand}@example.com`;

  return UserEntity.create({
    externalProvider: AuthProviderType.PLATFORM,
    name,
    screenName,
    nameUpdatedTimestamp: Sequelize.fn('now') as any as Date,
    externalID,
    platformApplicationID,
    email,
    metadata,
    profilePictureURL,
    profilePictureURLUpdatedTimestamp: profilePictureURL
      ? (Sequelize.fn('now') as any as Date)
      : null,
  });
}

export function createRandomPlatformUserAndOrgMember(appID: UUID, orgID: UUID) {
  const rand = Math.floor(Math.random() * 1000000);
  const name = `Name ${rand}`;
  const externalID = `id${rand}`;
  const email = `${rand}@example.com`;

  return createUserAndOrgMember({
    name,
    externalID,
    email,
    appID,
    orgID,
    externalProvider: AuthProviderType.PLATFORM,
  });
}

export function checkExpectedOrgMembers(
  expectedOrgMembers: string[],
  orgMembers: OrgMembersEntity[],
): boolean {
  const correctLength = orgMembers.length === expectedOrgMembers.length;

  const allMembersPresent = orgMembers.every((orgMem) =>
    expectedOrgMembers.includes(orgMem.userID),
  );

  return correctLength && allMembersPresent;
}

type CreateUserAndOrgMemberType =
  | {
      name?: string | null;
      externalID: string;
      email: string;
      orgID: UUID;
      additionalOrgID?: UUID;
      externalProvider: AuthProviderType.SLACK;
      screenName?: string;
    }
  | {
      name?: string;
      externalID: string;
      email: string;
      orgID: UUID;
      additionalOrgID?: UUID;
      appID: UUID;
      externalProvider: AuthProviderType.PLATFORM;
      screenName?: string | null;
    };

export async function createUserAndOrgMember({
  name = null,
  externalID,
  email,
  orgID,
  additionalOrgID,
  externalProvider,
  screenName = null,
  ...otherArgs
}: CreateUserAndOrgMemberType): Promise<UserEntity> {
  const whereOptions: WhereOptions<UserEntity> = {
    externalID,
  };
  if (externalProvider === AuthProviderType.PLATFORM && 'appID' in otherArgs) {
    whereOptions.platformApplicationID = otherArgs.appID;
  }
  return await getSequelize().transaction(async (transaction) => {
    const [user] = await UserEntity.findOrCreate({
      where: whereOptions,
      defaults: {
        ...(name && { name }),
        ...(name && {
          nameUpdatedTimestamp: Sequelize.fn('now') as any as Date,
        }),
        externalProvider,
        email,
        ...(screenName && { screenName }),
      },
      transaction,
    });

    await OrgMembersEntity.findOrCreate({
      where: {
        userID: user.id,
        orgID: orgID,
      },
      defaults: {} as any, // "as any" to work around deficiency in sequelize types, not combined with "where" items.
      transaction,
    });

    if (additionalOrgID) {
      await OrgMembersEntity.findOrCreate({
        where: {
          userID: user.id,
          orgID: additionalOrgID,
        },
        defaults: {} as any, // "as any" to work around deficiency in sequelize types, not combined with "where" items.
        transaction,
      });
    }

    return user;
  });
}

export async function createCustomer(
  name = 'Test customer',
  sharedSecret = 'secret',
) {
  return await CustomerEntity.create({ name, sharedSecret });
}

type CreatePageAndThread = {
  threadURL?: string;
  threadID?: UUID;
  location?: Location;
  transaction?: Transaction;
  externalID?: string | null;
  metadata?: EntityMetadata;
};

export async function createPageAndThread(
  viewer: Viewer,
  platformApplicationID: UUID,
  args: CreatePageAndThread,
): Promise<{ page: PageEntity; thread: ThreadEntity }> {
  const {
    threadURL = 'https://cord.com',
    threadID = uuid(),
    location = defaultTestLocation,
    transaction,
    externalID = null,
    metadata,
  } = args;

  if (!transaction) {
    return await getSequelize().transaction(async (newTransaction) => {
      return await createPageAndThread(viewer, platformApplicationID, {
        ...args,
        transaction: newTransaction,
      });
    });
  }

  const loaders = await getNewLoaders(viewer);
  const pageMutator = new PageMutator(viewer);
  const threadMutator = new ThreadMutator(viewer, loaders);

  const { page } = await pageMutator.getPageCreateIfNotExists(
    {
      providerID: null,
      data: location,
    },
    transaction,
  );

  const threadEntity = await threadMutator.createThreadOnPage(
    threadID,
    threadURL,
    page,
    'recipes',
    transaction,
    platformApplicationID,
    externalID,
    metadata,
  );

  return { page, thread: threadEntity };
}

export const defaultTestLocation = { location: 'https://cord.com' };

export async function createThreadViaGraphQL(
  viewer: Viewer,
  {
    location = defaultTestLocation,
    content = messageContentFromString('New thread!'),
    metadata = {},
  }: {
    location?: Location;
    content?: MessageContent;
    metadata?: EntityMetadata;
  },
) {
  const threadID = uuid();
  const messageID = uuid();

  const result = await executeGraphQLOperation({
    query: CreateThreadMessageMutation,
    variables: {
      input: {
        threadID,
        messageID,
        pageContext: { data: location },
        createNewThread: true,
        newThreadMetadata: metadata,
        externalContent: content,
        url: 'https://cord.com',
        fileAttachments: [],
        annotationAttachments: [],
      },
    },
    viewer,
  });

  expect(result.errors).toBeUndefined();
  expect(result.data?.createThreadMessage.success).toBe(true);
  return { threadID, messageID };
}

export async function fetchOrCreateThreadByExternalIDViaGraphQL(
  viewer: Viewer,
  {
    externalID,
    location = defaultTestLocation,
    metadata,
  }: { externalID: string; location?: Location; metadata?: EntityMetadata },
) {
  const threadByExternalID = await executeGraphQLOperation({
    query: ThreadByExternalID2Query,
    variables: {
      input: {
        externalThreadID: externalID,
      },
    },
    viewer,
  });
  expect(threadByExternalID.data).toBeDefined();
  if (!threadByExternalID.data!.threadByExternalID2.thread) {
    const createResult = await executeGraphQLOperation({
      query: CreateThreadMutation,
      variables: {
        input: {
          location,
          name: `My cool thread named ${externalID}`,
          url: 'https://cord.com',
          metadata,
        },
        externalThreadID: externalID,
      },
      viewer,
    });
    expect(createResult.data).toBeDefined();
    expect(createResult.data!.createThread.success).toBe(true);
  }
  return {
    internalID: threadByExternalID.data!.threadByExternalID2.id,
    thread: threadByExternalID.data!.threadByExternalID2.thread,
  };
}

type AddMessageProps = {
  thread: ThreadEntity;
  viewer: Viewer;
  transaction: Transaction;
  message?: string;
  messageID?: UUID;
  messageExternalID?: string;
  metadata?: EntityMetadata;
};

export async function addMessage({
  thread,
  viewer,
  transaction,
  message = 'Hello!',
  messageID = uuid(),
  messageExternalID,
  metadata,
}: AddMessageProps): Promise<MessageEntity> {
  const loaders = await getNewLoaders(viewer);
  const messageEntity = await new MessageMutator(viewer, loaders).createMessage(
    {
      id: messageID,
      thread,
      externalID: messageExternalID,
      content: [
        {
          type: MessageNodeType.PARAGRAPH,
          children: [
            {
              text: message,
            },
          ],
        },
      ],
      url: null,
      metadata,
    },
    transaction,
  );

  const threadParticipantMutator = new ThreadParticipantMutator(
    viewer,
    loaders,
  );
  await threadParticipantMutator.markThreadSeen({
    threadID: thread.id,
    setSubscribed: true,
    transaction,
  });

  return messageEntity;
}

export async function addMessageViaGraphQL(
  viewer: Viewer,
  {
    threadID,
    location = defaultTestLocation,
    content = messageContentFromString('A message!'),
    task = undefined,
    metadata,
  }: {
    threadID: UUID;
    location?: Location;
    content?: MessageContent;
    task?: TaskInput;
    metadata?: EntityMetadata;
  },
) {
  const messageID = uuid();

  const result = await executeGraphQLOperation({
    query: CreateThreadMessageMutation,
    variables: {
      input: {
        threadID,
        messageID,
        pageContext: { data: location },
        createNewThread: false,
        externalContent: content,
        url: 'https://cord.com',
        fileAttachments: [],
        annotationAttachments: [],
        task,
        newMessageMetadata: metadata,
      },
    },
    viewer,
  });

  if (result.errors) {
    throw result.errors[0];
  }

  expect(result.data?.createThreadMessage.success).toBe(true);
  return { messageID };
}
export async function resolveThreadViaGraphQL(
  viewer: Viewer,
  {
    threadID,
  }: {
    threadID: UUID;
  },
) {
  const result = await executeGraphQLOperation({
    query: SetThreadResolvedMutation,
    variables: {
      threadID,
      resolved: true,
    },
    viewer,
  });

  expect(result.errors).toBeUndefined();
  expect(result.data?.setThreadResolved.success).toBe(true);
}

export async function updateMessageViaGraphQL(
  viewer: Viewer,
  {
    messageID,
    content = undefined,
    task = undefined,
  }: {
    messageID: UUID;
    content?: MessageContent;
    task?: TaskInput;
  },
) {
  const result = await executeGraphQLOperation({
    query: UpdateMessageMutation,
    variables: { id: messageID, content, task },
    viewer,
  });

  expect(result.errors).toBeUndefined();
  expect(result.data?.updateMessage.success).toBe(true);
}

export async function addReactionViaGraphQL(
  viewer: Viewer,
  {
    messageID,
    unicodeReaction = '!',
  }: { messageID: UUID; unicodeReaction?: string },
  success = true,
) {
  const result = await executeGraphQLOperation({
    query: CreateMessageReactionMutation,
    variables: {
      messageID,
      unicodeReaction,
    },
    viewer,
  });

  if (success) {
    expect(result.errors).toBeUndefined();
  }
  expect(result.data?.createMessageReaction.success).toBe(success);
}

export async function markThreadSeenViaGraphQL(viewer: Viewer, threadID: UUID) {
  const result = await executeGraphQLOperation({
    query: MarkThreadSeenMutation,
    variables: {
      threadID,
    },
    viewer,
  });

  expect(result.data?.markThreadSeen.success).toBe(true);
}

export async function setSubscribedViaGraphQL(viewer: Viewer, threadID: UUID) {
  const result = await executeGraphQLOperation({
    query: SetSubscribedMutation,
    variables: {
      threadID,
      subscribed: true,
    },
    viewer,
  });

  expect(result.data?.setSubscribed).toBe(true);
}

export async function unreadNotificationCountViaGraphQL(viewer: Viewer) {
  const result = await executeGraphQLOperation({
    query: gql.default`
      query {
        notificationSummary {
          unreadNotificationCount
        }
      }
    `,
    viewer,
  });

  return result.data?.notificationSummary.unreadNotificationCount;
}
