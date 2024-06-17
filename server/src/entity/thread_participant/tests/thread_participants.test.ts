import {
  FeatureFlags,
  initMockFeatureFlagForTest,
} from 'server/src/featureflags/index.ts';
import { Viewer } from 'server/src/auth/index.ts';
import type { UUID } from 'common/types/index.ts';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { ThreadParticipantEntity } from 'server/src/entity/thread_participant/ThreadParticipantEntity.ts';
import {
  addMessageViaGraphQL,
  createPlatformApplication,
  createRandomPlatformOrg,
  createRandomPlatformUserAndOrgMember,
  createThreadViaGraphQL,
  markThreadSeenViaGraphQL,
} from 'server/src/public/routes/tests/util.ts';
import { executeGraphQLOperation } from 'server/src/tests/setupEnvironment.ts';

// eslint-disable-next-line import/no-restricted-paths
import type { ThreadFragment } from 'external/src/graphql/operations.ts';
// eslint-disable-next-line import/no-restricted-paths
import { Thread2Query } from 'external/src/graphql/operations.ts';
import { PermissionRuleEntity } from 'server/src/entity/permission/PermisssionRuleEntity.ts';

let application: ApplicationEntity;
let viewer1: Viewer;
let viewer2: Viewer;

async function fetchThreadViaGraphQL(
  viewer: Viewer,
  threadID: UUID,
): Promise<ThreadFragment> {
  const result = await executeGraphQLOperation({
    query: Thread2Query,
    variables: { threadID },
    viewer,
  });

  expect(result.errors).toBeUndefined();
  const thread = result.data?.thread;
  expect(thread).toBeDefined();
  return thread;
}

function getParticipants(thread: ThreadFragment) {
  return thread.participants.map((u) => u.user?.id);
}

describe('Test thread participants', () => {
  beforeAll(async () => {
    initMockFeatureFlagForTest(
      async (k) => k === FeatureFlags.GRANULAR_PERMISSIONS.key,
    );

    application = await createPlatformApplication();
    const org = await createRandomPlatformOrg(application.id);

    const [user1, user2] = await Promise.all([
      createRandomPlatformUserAndOrgMember(application.id, org.id),
      createRandomPlatformUserAndOrgMember(application.id, org.id),
    ]);

    viewer1 = await Viewer.createLoggedInPlatformViewer({ user: user1, org });
    viewer2 = await Viewer.createLoggedInPlatformViewer({ user: user2, org });
  });

  beforeEach(async () => {
    await Promise.all([
      ThreadEntity.truncate({ cascade: true }),
      ThreadParticipantEntity.truncate({ cascade: true }),
    ]);
  });

  test('Thread creator is a participant', async () => {
    const { threadID } = await createThreadViaGraphQL(viewer1, {});
    const thread = await fetchThreadViaGraphQL(viewer1, threadID);
    const participantIDs = getParticipants(thread);
    expect(participantIDs).toHaveLength(1);
    expect(participantIDs).toContain(viewer1.userID);
  });

  test('Reading a thread makes you a participant', async () => {
    const { threadID } = await createThreadViaGraphQL(viewer1, {});
    await markThreadSeenViaGraphQL(viewer2, threadID);
    const thread = await fetchThreadViaGraphQL(viewer1, threadID);
    const participantIDs = getParticipants(thread);
    expect(participantIDs).toHaveLength(2);
    expect(participantIDs).toContain(viewer1.userID);
    expect(participantIDs).toContain(viewer2.userID);
  });

  test('Replying to a thread makes you a participant', async () => {
    const { threadID } = await createThreadViaGraphQL(viewer1, {});
    await addMessageViaGraphQL(viewer2, { threadID });
    const thread = await fetchThreadViaGraphQL(viewer1, threadID);
    const participantIDs = getParticipants(thread);
    expect(participantIDs).toHaveLength(2);
    expect(participantIDs).toContain(viewer1.userID);
    expect(participantIDs).toContain(viewer2.userID);
  });

  describe('PermissionRuleEntity', () => {
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
    });

    beforeEach(async () => {
      await PermissionRuleEntity.truncate({ cascade: true });
    });

    afterAll(async () => {
      initMockFeatureFlagForTest(undefined);
    });

    test('Can see participation of those in thread org even without thread-participant:read', async () => {
      await PermissionRuleEntity.create({
        userSelector: `$.id == "${viewerInOtherOrg.externalUserID}"`,
        resourceSelector: 'true',
        permissions: ['thread:read'],
        platformApplicationID: application.id,
      });

      const { threadID } = await createThreadViaGraphQL(viewer1, {});
      await markThreadSeenViaGraphQL(viewer2, threadID);

      const thread = await fetchThreadViaGraphQL(viewerInOtherOrg, threadID);
      const participantIDs = getParticipants(thread);
      expect(participantIDs).toHaveLength(2);
      expect(participantIDs).toContain(viewer1.userID);
      expect(participantIDs).toContain(viewer2.userID);
    });

    test('Cannot see participants from another org without thread-participant:read', async () => {
      await PermissionRuleEntity.create({
        userSelector: `$.id == "${viewerInOtherOrg.externalUserID}"`,
        resourceSelector: 'true',
        permissions: ['thread:read'],
        platformApplicationID: application.id,
      });

      const { threadID } = await createThreadViaGraphQL(viewer1, {});
      await markThreadSeenViaGraphQL(viewerInOtherOrg, threadID);

      const thread = await fetchThreadViaGraphQL(viewer1, threadID);
      const participantIDs = getParticipants(thread);
      expect(participantIDs).toHaveLength(1);
      expect(participantIDs).toContain(viewer1.userID);
    });

    test('Can see participants from another org with thread-participant:read', async () => {
      await PermissionRuleEntity.create({
        userSelector: `$.id == "${viewerInOtherOrg.externalUserID}"`,
        resourceSelector: 'true',
        permissions: ['thread:read'],
        platformApplicationID: application.id,
      });

      await PermissionRuleEntity.create({
        userSelector: `$.id == "${viewer1.externalUserID}"`,
        resourceSelector: 'true',
        permissions: ['thread-participant:read'],
        platformApplicationID: application.id,
      });

      const { threadID } = await createThreadViaGraphQL(viewer1, {});
      await markThreadSeenViaGraphQL(viewerInOtherOrg, threadID);

      const thread = await fetchThreadViaGraphQL(viewer1, threadID);
      const participantIDs = getParticipants(thread);
      expect(participantIDs).toHaveLength(2);
      expect(participantIDs).toContain(viewer1.userID);
      expect(participantIDs).toContain(viewerInOtherOrg.userID);
    });
  });
});
