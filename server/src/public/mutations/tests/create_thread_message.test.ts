import { executeGraphQLOperation } from 'server/src/tests/setupEnvironment.ts';
import { Viewer } from 'server/src/auth/index.ts';
import {
  addMessageViaGraphQL,
  createPlatformApplication,
  createRandomPlatformOrg,
  createRandomPlatformUserAndOrgMember,
  createThreadViaGraphQL,
} from 'server/src/public/routes/tests/util.ts';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import {
  createMentionNode,
  messageContentFromString,
} from '@cord-sdk/react/common/lib/messageNode.ts';
import {
  FeatureFlags,
  initMockFeatureFlagForTest,
} from 'server/src/featureflags/index.ts';
import { PermissionRuleEntity } from 'server/src/entity/permission/PermisssionRuleEntity.ts';

// eslint-disable-next-line import/no-restricted-paths
import { ThreadListQuery } from 'external/src/graphql/operations.ts';
// eslint-disable-next-line import/no-restricted-paths
import type { ThreadListQueryResult } from 'external/src/graphql/operations.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';

let tomViewer: Viewer;
let jerryViewer: Viewer;
let application: ApplicationEntity;
let org: OrgEntity;

const location = { location: 'https://cord.com' };

async function fetchPageThreadsViaGraphQL(
  viewer: Viewer,
): Promise<ThreadListQueryResult['threadsAtLocation']> {
  const result = await executeGraphQLOperation({
    query: ThreadListQuery,
    variables: {
      location,
      partialMatch: false,
      sort: {
        sortBy: 'most_recent_message_timestamp',
        sortDirection: 'descending',
      },
    },
    viewer,
  });

  return result.data?.threadsAtLocation;
}

describe('Test create_thread_message', () => {
  beforeAll(async () => {
    application = await createPlatformApplication();
    org = await createRandomPlatformOrg(application.id);

    const [tom, jerry] = await Promise.all([
      createRandomPlatformUserAndOrgMember(application.id, org.id),
      createRandomPlatformUserAndOrgMember(application.id, org.id),
    ]);

    tomViewer = await Viewer.createLoggedInPlatformViewer({
      user: tom,
      org,
    });
    jerryViewer = await Viewer.createLoggedInPlatformViewer({
      user: jerry,
      org,
    });
  });

  test('start a thread with two messages, query them through page threads', async () => {
    // create a message from tom that @mentions jerry
    const messageContent = messageContentFromString('hello');
    messageContent.push(
      createMentionNode(jerryViewer.externalUserID!, 'jerry'),
    );

    const { messageID: firstMessageID, threadID } =
      await createThreadViaGraphQL(tomViewer, {
        location,
        content: messageContent,
      });

    const { messageID: secondMessageID } = await addMessageViaGraphQL(
      jerryViewer,
      {
        threadID,
        location,
        content: messageContentFromString('oh hey'),
      },
    );

    const result = await fetchPageThreadsViaGraphQL(tomViewer);

    expect(result.threads).toContainEqual(
      expect.objectContaining({
        id: threadID,
        messagesCountExcludingDeleted: 2,
        viewerIsThreadParticipant: true,
        subscribed: true,
      }),
    );

    expect(result.threads[0].initialMessagesInclDeleted).toContainEqual(
      expect.objectContaining({
        id: firstMessageID,
      }),
    );

    expect(result.threads[0].initialMessagesInclDeleted).toContainEqual(
      expect.objectContaining({
        id: secondMessageID,
      }),
    );

    // Jerry is a replyier but Tom is *not* since Tom sent the original message
    // but hasn't *replied*.
    expect(result.threads[0].replyingUserIDs).toHaveLength(1);
    expect(result.threads[0].replyingUserIDs[0]).toBe(jerryViewer.userID);
  });

  test('not a participant in a thread not replied to', async () => {
    const { threadID } = await createThreadViaGraphQL(tomViewer, {});
    const result = await fetchPageThreadsViaGraphQL(jerryViewer);

    const thread = result.threads[0];
    expect(thread.id).toBe(threadID);
    expect(thread.messagesCountExcludingDeleted).toBe(1);
    expect(thread.viewerIsThreadParticipant).toBe(false);
    expect(thread.subscribed).toBe(false);
    expect(thread.replyingUserIDs).toHaveLength(0);
  });

  test('metadata is set on new threads', async () => {
    const { threadID } = await createThreadViaGraphQL(tomViewer, {
      metadata: { foo: 'bar' },
    });
    const result = await fetchPageThreadsViaGraphQL(tomViewer);

    const thread = result.threads[0];
    expect(thread.id).toBe(threadID);
    expect(thread.metadata).toEqual({ foo: 'bar' });
  });

  describe('PermissionRuleEntity', () => {
    let randoViewer: Viewer;

    beforeAll(async () => {
      initMockFeatureFlagForTest(
        async (k) => k === FeatureFlags.GRANULAR_PERMISSIONS.key,
      );

      const randoOrg = await createRandomPlatformOrg(application.id);
      const randoUser = await createRandomPlatformUserAndOrgMember(
        application.id,
        randoOrg.id,
      );

      randoViewer = await Viewer.createLoggedInPlatformViewer({
        user: randoUser,
        org: null,
      });
    });

    afterAll(() => {
      initMockFeatureFlagForTest(undefined);
    });

    test('Cannot send message without permission', async () => {
      const { threadID } = await createThreadViaGraphQL(tomViewer, {
        metadata: { visible: true },
      });
      await PermissionRuleEntity.create({
        userSelector: `$.id == "${randoViewer.externalUserID}"`,
        resourceSelector: `$.metadata.visible == true`,
        permissions: ['thread:read', 'message:read'],
        platformApplicationID: application.id,
      });

      await expect(
        async () => await addMessageViaGraphQL(randoViewer, { threadID }),
      ).rejects;
    });

    test('Can send message with permission', async () => {
      const { threadID } = await createThreadViaGraphQL(tomViewer, {
        metadata: { visible: true },
      });
      await PermissionRuleEntity.create({
        userSelector: `$.id == "${randoViewer.externalUserID}"`,
        resourceSelector: `$.metadata.visible == true`,
        permissions: ['thread:read', 'message:read', 'thread:send-message'],
        platformApplicationID: application.id,
      });

      const { messageID } = await addMessageViaGraphQL(randoViewer, {
        threadID,
      });

      const message = await MessageEntity.findByPk(messageID);
      expect(message?.sourceID).toBe(randoViewer.userID);
    });
  });
});
