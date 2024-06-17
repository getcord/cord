import gql from 'graphql-tag';
import type { UUID } from 'common/types/index.ts';
import { Viewer } from 'server/src/auth/index.ts';
import {
  addMessageViaGraphQL,
  createPlatformApplication,
  createRandomPlatformOrg,
  createRandomPlatformUserAndOrgMember,
  createThreadViaGraphQL,
} from 'server/src/public/routes/tests/util.ts';
import { executeGraphQLOperation } from 'server/src/tests/setupEnvironment.ts';

// eslint-disable-next-line import/no-restricted-paths
import { UpdateMessageMutation } from 'external/src/graphql/operations.ts';
import {
  FeatureFlags,
  initMockFeatureFlagForTest,
} from 'server/src/featureflags/index.ts';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { PermissionRuleEntity } from 'server/src/entity/permission/PermisssionRuleEntity.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';

let application: ApplicationEntity;
let viewer: Viewer;
let threadID: UUID;
const messageIDs: UUID[] = [];
const NUM_MESSAGES = 5;

async function getCounts(
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  viewer: Viewer,
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  threadID: UUID,
): Promise<{
  allMessagesCount: number;
  replyCount: number;
  messagesCountExcludingDeleted: number;
}> {
  const result = await executeGraphQLOperation({
    query: gql.default`
      query Thread($threadID: UUID!) {
        thread(threadID: $threadID) {
          allMessagesCount
          replyCount
          messagesCountExcludingDeleted
        }
      }
    `,
    variables: {
      threadID,
    },
    viewer,
  });
  return result.data?.thread;
}

// eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
async function deleteMessage(viewer: Viewer, messageID: UUID) {
  const result = await executeGraphQLOperation({
    query: UpdateMessageMutation,
    variables: {
      id: messageID,
      deleted: true,
    },
    viewer,
  });
  expect(result.data?.updateMessage.success).toBe(true);
}

describe('Test various message counts', () => {
  beforeAll(async () => {
    application = await createPlatformApplication();
    const org = await createRandomPlatformOrg(application.id);

    const user = await createRandomPlatformUserAndOrgMember(
      application.id,
      org.id,
    );
    viewer = await Viewer.createLoggedInPlatformViewer({
      user,
      org,
    });

    const result = await createThreadViaGraphQL(viewer, {});
    threadID = result.threadID;
  });

  beforeEach(async () => {
    await MessageEntity.truncate({ cascade: true });
    messageIDs.length = 0;
  });

  describe('Counts adjusting for deleted messages', () => {
    beforeEach(async () => {
      for (let i = 0; i < NUM_MESSAGES; i++) {
        const { messageID } = await addMessageViaGraphQL(viewer, { threadID });
        messageIDs.push(messageID);
      }

      expect(messageIDs.length).toBe(NUM_MESSAGES);
    });

    test('message counts correct', async () => {
      const counts = await getCounts(viewer, threadID);
      expect(counts.allMessagesCount).toBe(NUM_MESSAGES);
      expect(counts.replyCount).toBe(NUM_MESSAGES - 1);
      expect(counts.messagesCountExcludingDeleted).toBe(NUM_MESSAGES);
    });

    test('deleting reply decreases counts', async () => {
      await deleteMessage(viewer, messageIDs[messageIDs.length - 1]);
      const counts = await getCounts(viewer, threadID);
      expect(counts.allMessagesCount).toBe(NUM_MESSAGES);
      expect(counts.replyCount).toBe(NUM_MESSAGES - 2);
      expect(counts.messagesCountExcludingDeleted).toBe(NUM_MESSAGES - 1);
    });

    test('deleting first message further decreases only allMessagesCount', async () => {
      await deleteMessage(viewer, messageIDs[0]);
      const counts = await getCounts(viewer, threadID);
      expect(counts.allMessagesCount).toBe(NUM_MESSAGES);
      expect(counts.replyCount).toBe(NUM_MESSAGES - 1);
      expect(counts.messagesCountExcludingDeleted).toBe(NUM_MESSAGES - 1);
    });

    test('message counts of empty thread correct', async () => {
      // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      const { threadID, messageID } = await createThreadViaGraphQL(viewer, {});
      await deleteMessage(viewer, messageID);
      const counts = await getCounts(viewer, threadID);
      expect(counts.allMessagesCount).toBe(1);
      expect(counts.replyCount).toBe(0);
      expect(counts.messagesCountExcludingDeleted).toBe(0);
    });
  });

  describe('Test per-message permissions', () => {
    let viewerInOtherOrg: Viewer;

    beforeAll(async () => {
      initMockFeatureFlagForTest(
        async (k) => k === FeatureFlags.GRANULAR_PERMISSIONS.key,
      );

      const otherOrg = await createRandomPlatformOrg(application.id);
      const userInOtherOrg = await createRandomPlatformUserAndOrgMember(
        application.id,
        otherOrg.id,
      );
      viewerInOtherOrg = await Viewer.createLoggedInPlatformViewer({
        user: userInOtherOrg,
        org: null,
      });

      await Promise.all([
        PermissionRuleEntity.create({
          userSelector: `$.id == "${userInOtherOrg.externalID}"`,
          resourceSelector: `true`,
          permissions: ['thread:read'],
          platformApplicationID: application.id,
        }),
        PermissionRuleEntity.create({
          userSelector: `$.id == "${userInOtherOrg.externalID}"`,
          resourceSelector: `$.metadata.visible == true`,
          permissions: ['message:read'],
          platformApplicationID: application.id,
        }),
      ]);
    });

    afterAll(async () => {
      initMockFeatureFlagForTest(undefined);
    });

    async function addMessage(visible: boolean) {
      const { messageID } = await addMessageViaGraphQL(viewer, {
        threadID,
        metadata: { visible },
      });
      return messageID;
    }

    test('no visible messages', async () => {
      await addMessage(false);
      await addMessage(false);
      await addMessage(false);
      const counts = await getCounts(viewerInOtherOrg, threadID);
      expect(counts.allMessagesCount).toBe(0);
      expect(counts.replyCount).toBe(0);
      expect(counts.messagesCountExcludingDeleted).toBe(0);
    });

    test('first message visible', async () => {
      await addMessage(true);
      await addMessage(false);
      await addMessage(false);
      await addMessage(true);
      const counts = await getCounts(viewerInOtherOrg, threadID);
      expect(counts.allMessagesCount).toBe(2);
      expect(counts.replyCount).toBe(1);
      expect(counts.messagesCountExcludingDeleted).toBe(2);
    });

    test('first message not visible', async () => {
      await addMessage(false);
      await addMessage(true);
      await addMessage(false);
      await addMessage(true);
      const counts = await getCounts(viewerInOtherOrg, threadID);
      expect(counts.allMessagesCount).toBe(2);
      expect(counts.replyCount).toBe(2);
      expect(counts.messagesCountExcludingDeleted).toBe(2);
    });
  });
});
