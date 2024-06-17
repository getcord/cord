import { jest } from '@jest/globals';
import type { UUID } from 'common/types/index.ts';
import { externalizeID } from 'common/util/externalIDs.ts';
// eslint-disable-next-line import/no-restricted-paths
import type { ThreadFragment } from 'external/src/graphql/operations.ts';
// eslint-disable-next-line import/no-restricted-paths
import { ThreadByExternalID2Query } from 'external/src/graphql/operations.ts';
import { getNewLoaders } from 'server/src/RequestContextLoaders.ts';
import { Viewer } from 'server/src/auth/index.ts';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { PermissionRuleEntity } from 'server/src/entity/permission/PermisssionRuleEntity.ts';
import { ThreadParticipantMutator } from 'server/src/entity/thread_participant/ThreadParticipantMutator.ts';
import {
  FeatureFlags,
  initMockFeatureFlagForTest,
} from 'server/src/featureflags/index.ts';
import {
  addMessageViaGraphQL,
  createPlatformApplication,
  createRandomPlatformOrg,
  createRandomPlatformUserAndOrgMember,
  createThreadViaGraphQL,
  markThreadSeenViaGraphQL,
} from 'server/src/public/routes/tests/util.ts';
import { executeGraphQLOperation } from 'server/src/tests/setupEnvironment.ts';

let application: ApplicationEntity;
let viewer: Viewer;
let author: Viewer;
let threadID: UUID;

jest.setTimeout(60000);

async function addNMessages(n: number) {
  while (n > 0) {
    await addMessageViaGraphQL(author, { threadID });
    n--;
  }
}

async function getThread(myViewer: Viewer = viewer) {
  const result = await executeGraphQLOperation({
    query: ThreadByExternalID2Query,
    variables: {
      input: {
        externalThreadID: externalizeID(threadID),
      },
    },
    viewer: myViewer,
  });
  expect(result.data?.threadByExternalID2.thread).toBeDefined();
  return result.data?.threadByExternalID2.thread as ThreadFragment;
}

async function getFirstMessage() {
  return await MessageEntity.findOne({
    where: { threadID },
    order: [['timestamp', 'ASC']],
  });
}

async function getLastMessage() {
  return await MessageEntity.findOne({
    where: { threadID },
    order: [['timestamp', 'DESC']],
  });
}

describe('Test initial thread messages', () => {
  beforeAll(async () => {
    application = await createPlatformApplication();
    const org = await createRandomPlatformOrg(application.id);

    const [authorUser, user] = await Promise.all([
      createRandomPlatformUserAndOrgMember(application.id, org.id),
      createRandomPlatformUserAndOrgMember(application.id, org.id),
    ]);

    viewer = await Viewer.createLoggedInPlatformViewer({ user, org });
    author = await Viewer.createLoggedInPlatformViewer({
      user: authorUser,
      org,
    });
  });

  beforeEach(async () => {
    ({ threadID } = await createThreadViaGraphQL(author, {}));
    // We want our thread to be empty to start
    await MessageEntity.destroy({
      where: {
        threadID,
      },
    });
  });

  test('non-participant, empty thread', async () => {
    const thread = await getThread();
    expect(thread.initialMessagesInclDeleted).toHaveLength(0);
  });

  test('non-participant, 1 message', async () => {
    await addNMessages(1);
    const thread = await getThread();
    expect(thread.initialMessagesInclDeleted).toHaveLength(1);
  });

  test('non-participant, 3 messages', async () => {
    await addNMessages(3);
    const thread = await getThread();
    expect(thread.initialMessagesInclDeleted).toHaveLength(3);
  });

  test('non-participant, 10 messages', async () => {
    await addNMessages(10);
    const thread = await getThread();
    expect(thread.initialMessagesInclDeleted).toHaveLength(2);
    expect(thread.initialMessagesInclDeleted[0].id).toBe(
      (await getFirstMessage())?.id,
    );
    expect(thread.initialMessagesInclDeleted[1].id).toBe(
      (await getLastMessage())?.id,
    );
  });

  test('participant, none seen, empty thread', async () => {
    await markThreadSeenViaGraphQL(viewer, threadID);
    const thread = await getThread();
    expect(thread.initialMessagesInclDeleted).toHaveLength(0);
  });

  test('participant, none seen, 1 message', async () => {
    await markThreadSeenViaGraphQL(viewer, threadID);
    await addNMessages(1);
    const thread = await getThread();
    expect(thread.initialMessagesInclDeleted).toHaveLength(1);
    expect(thread.initialMessagesInclDeleted[0].seen).toBe(false);
  });

  test('participant, none seen, 3 messages', async () => {
    await markThreadSeenViaGraphQL(viewer, threadID);
    await addNMessages(3);
    const thread = await getThread();
    expect(thread.initialMessagesInclDeleted).toHaveLength(3);
    for (const message of thread.initialMessagesInclDeleted) {
      expect(message.seen).toBe(false);
    }
  });

  test('participant, none seen, 10 messages', async () => {
    await markThreadSeenViaGraphQL(viewer, threadID);
    await addNMessages(10);
    const thread = await getThread();
    expect(thread.initialMessagesInclDeleted).toHaveLength(10);
    expect(thread.initialMessagesInclDeleted[0].id).toBe(
      (await getFirstMessage())?.id,
    );
    expect(thread.initialMessagesInclDeleted[0].seen).toBe(false);
    expect(thread.initialMessagesInclDeleted[9].id).toBe(
      (await getLastMessage())?.id,
    );
    expect(thread.initialMessagesInclDeleted[9].seen).toBe(false);
  });

  test('participant, none seen, 60 messages', async () => {
    await markThreadSeenViaGraphQL(viewer, threadID);
    await addNMessages(60);
    const thread = await getThread();
    // We return the first message plus up to the 50 latest messages
    expect(thread.initialMessagesInclDeleted).toHaveLength(51);
    expect(thread.initialMessagesInclDeleted[0].id).toBe(
      (await getFirstMessage())?.id,
    );
    expect(thread.initialMessagesInclDeleted[0].seen).toBe(false);
    expect(thread.initialMessagesInclDeleted[50].id).toBe(
      (await getLastMessage())?.id,
    );
    expect(thread.initialMessagesInclDeleted[50].seen).toBe(false);
  });

  test('participant, all seen, 1 message', async () => {
    await addNMessages(1);
    await markThreadSeenViaGraphQL(viewer, threadID);
    const thread = await getThread();
    expect(thread.initialMessagesInclDeleted).toHaveLength(1);
    expect(thread.initialMessagesInclDeleted[0].seen).toBe(true);
  });

  test('participant, all seen, 3 messages', async () => {
    await addNMessages(3);
    await markThreadSeenViaGraphQL(viewer, threadID);
    const thread = await getThread();
    expect(thread.initialMessagesInclDeleted).toHaveLength(3);
    for (const message of thread.initialMessagesInclDeleted) {
      expect(message.seen).toBe(true);
    }
  });

  test('participant, all seen, 10 messages', async () => {
    await addNMessages(10);
    await markThreadSeenViaGraphQL(viewer, threadID);
    const thread = await getThread();
    expect(thread.initialMessagesInclDeleted).toHaveLength(2);
    expect(thread.initialMessagesInclDeleted[0].id).toBe(
      (await getFirstMessage())?.id,
    );
    expect(thread.initialMessagesInclDeleted[0].seen).toBe(true);
    expect(thread.initialMessagesInclDeleted[1].id).toBe(
      (await getLastMessage())?.id,
    );
    expect(thread.initialMessagesInclDeleted[1].seen).toBe(true);
  });

  test('participant, all seen, 60 messages', async () => {
    await addNMessages(60);
    await markThreadSeenViaGraphQL(viewer, threadID);
    const thread = await getThread();
    // We return the first and last message
    expect(thread.initialMessagesInclDeleted).toHaveLength(2);
    expect(thread.initialMessagesInclDeleted[0].id).toBe(
      (await getFirstMessage())?.id,
    );
    expect(thread.initialMessagesInclDeleted[0].seen).toBe(true);
    expect(thread.initialMessagesInclDeleted[1].id).toBe(
      (await getLastMessage())?.id,
    );
    expect(thread.initialMessagesInclDeleted[1].seen).toBe(true);
  });

  test('participant, 2 seen, 3 messages', async () => {
    await addNMessages(2);
    await markThreadSeenViaGraphQL(viewer, threadID);
    await addNMessages(1);
    const thread = await getThread();
    expect(thread.initialMessagesInclDeleted).toHaveLength(3);
    expect(thread.initialMessagesInclDeleted[0].seen).toBe(true);
    expect(thread.initialMessagesInclDeleted[1].seen).toBe(true);
    expect(thread.initialMessagesInclDeleted[2].seen).toBe(false);
  });

  test('participant, 3 seen, 10 messages', async () => {
    await addNMessages(3);
    await markThreadSeenViaGraphQL(viewer, threadID);
    await addNMessages(7);
    const thread = await getThread();
    // The first message, the most recently read message, plus the 7 unread
    // messages
    expect(thread.initialMessagesInclDeleted).toHaveLength(9);
    expect(thread.initialMessagesInclDeleted[0].id).toBe(
      (await getFirstMessage())?.id,
    );
    expect(thread.initialMessagesInclDeleted[0].seen).toBe(true);
    expect(thread.initialMessagesInclDeleted[8].id).toBe(
      (await getLastMessage())?.id,
    );
    expect(thread.initialMessagesInclDeleted[8].seen).toBe(false);
  });

  test('participant, 3 seen, 60 messages', async () => {
    await addNMessages(3);
    await markThreadSeenViaGraphQL(viewer, threadID);
    await addNMessages(57);
    const thread = await getThread();
    // We return the first and 50 of the unread messages
    expect(thread.initialMessagesInclDeleted).toHaveLength(51);
    expect(thread.initialMessagesInclDeleted[0].id).toBe(
      (await getFirstMessage())?.id,
    );
    expect(thread.initialMessagesInclDeleted[0].seen).toBe(true);
    expect(thread.initialMessagesInclDeleted[50].id).toBe(
      (await getLastMessage())?.id,
    );
    expect(thread.initialMessagesInclDeleted[50].seen).toBe(false);
  });

  describe('Test per-message permissions', () => {
    let viewerInOtherOrg: Viewer;

    async function addVisibleMessage() {
      const { messageID } = await addMessageViaGraphQL(author, {
        threadID,
        metadata: { visible: true },
      });
      return messageID;
    }

    /**
     * This function shouldn't exist / be necessary, we should just call
     * markThreadSeenViaGraphQL instead, but currently the GQL handler doesn't
     * like marking threads seen for orgs you aren't in, so we'll do directly so
     * that we can test the initialMessages code until we tackle seen state
     * permissions.
     */
    async function markThreadSeenDirectly() {
      const loaders = await getNewLoaders(viewerInOtherOrg);
      const mutator = new ThreadParticipantMutator(viewerInOtherOrg, loaders);
      await mutator.markThreadSeen({ threadID });
    }

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

    test('non-participant, 3 messages, 0 visible', async () => {
      await addNMessages(3);
      const thread = await getThread(viewerInOtherOrg);
      expect(thread.initialMessagesInclDeleted).toHaveLength(0);
    });

    test('non-participant, 3 messages, 1 visible', async () => {
      await addNMessages(1);
      const visibleMessageID = await addVisibleMessage();
      await addNMessages(1);
      const thread = await getThread(viewerInOtherOrg);
      expect(thread.initialMessagesInclDeleted).toHaveLength(1);
      expect(thread.initialMessagesInclDeleted[0].id).toBe(visibleMessageID);
    });

    test('non-participant, 10 messages, 0 visible', async () => {
      await addNMessages(10);
      const thread = await getThread(viewerInOtherOrg);
      expect(thread.initialMessagesInclDeleted).toHaveLength(0);
    });

    test('non-participant, 10 messages, 1 visible', async () => {
      await addNMessages(5);
      const visibleMessageID = await addVisibleMessage();
      await addNMessages(4);
      const thread = await getThread(viewerInOtherOrg);
      expect(thread.initialMessagesInclDeleted).toHaveLength(1);
      expect(thread.initialMessagesInclDeleted[0].id).toBe(visibleMessageID);
    });

    test('non-participant, 10 messages, 3 visible', async () => {
      await addNMessages(2);
      const visibleMessageID1 = await addVisibleMessage();
      await addNMessages(2);
      await addVisibleMessage();
      await addNMessages(2);
      const visibleMessageID2 = await addVisibleMessage();
      await addNMessages(1);
      const thread = await getThread(viewerInOtherOrg);
      expect(thread.initialMessagesInclDeleted).toHaveLength(3);
      expect(thread.initialMessagesInclDeleted[0].id).toBe(visibleMessageID1);
      expect(thread.initialMessagesInclDeleted[2].id).toBe(visibleMessageID2);
    });

    test('participant, <50 unseen messages', async () => {
      await addNMessages(2);
      const visibleFirstMessage = await addVisibleMessage();
      await addVisibleMessage();
      await addVisibleMessage();
      await markThreadSeenDirectly();
      await addNMessages(2);
      await addVisibleMessage();
      await addVisibleMessage();
      const visibleLastMessage = await addVisibleMessage();
      await addNMessages(2);
      const thread = await getThread(viewerInOtherOrg);
      // First message + seen message + 3 after thread was last seen.
      expect(thread.initialMessagesInclDeleted).toHaveLength(5);
      expect(thread.initialMessagesInclDeleted[0].id).toBe(visibleFirstMessage);
      expect(thread.initialMessagesInclDeleted[4].id).toBe(visibleLastMessage);
    });

    test('participant, >50 unseen messages', async () => {
      await addNMessages(2);
      const visibleFirstMessage = await addVisibleMessage();
      await addVisibleMessage();
      await addVisibleMessage(); // We miss this one.
      await markThreadSeenDirectly();
      await addNMessages(2);
      await addVisibleMessage(); // We miss this one.
      const visibleLastMessage = await addVisibleMessage();
      await addNMessages(51);
      const thread = await getThread(viewerInOtherOrg);
      // Slightly unfortunate that we only get 2 here, ideally we'd not miss the
      // two messages commented above, but the LIMIT 50 happens before privacy
      // filtering. Can add a refetch loop there at some point if needed, but
      // the most important is that we do get the first and last.
      expect(thread.initialMessagesInclDeleted).toHaveLength(2);
      expect(thread.initialMessagesInclDeleted[0].id).toBe(visibleFirstMessage);
      expect(thread.initialMessagesInclDeleted[1].id).toBe(visibleLastMessage);
    });
  });
});
