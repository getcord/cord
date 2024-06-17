import { v4 as uuid } from 'uuid';
import { Viewer } from 'server/src/auth/index.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import 'server/src/tests/setupEnvironment';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import {
  createPageAndThread,
  createPlatformApplication,
  createRandomPlatformOrg,
  createRandomPlatformUser,
} from 'server/src/public/routes/tests/util.ts';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import type { ThreadLoader } from 'server/src/entity/thread/ThreadLoader.ts';
import { PermissionRuleEntity } from 'server/src/entity/permission/PermisssionRuleEntity.ts';
import {
  FeatureFlags,
  initMockFeatureFlagForTest,
} from 'server/src/featureflags/index.ts';
import { getNewLoaders } from 'server/src/RequestContextLoaders.ts';

async function tl(viewer: Viewer): Promise<ThreadLoader> {
  return (await getNewLoaders(viewer)).threadLoader;
}

describe('Test ThreadLoader.loadThread, loadByExternalIDStrictOrgCheck, and loadByExternalID', () => {
  let org1: OrgEntity;
  let org2: OrgEntity;
  let user: UserEntity;
  let application: ApplicationEntity;
  let threadOrg1: ThreadEntity;
  let threadOrg2: ThreadEntity;

  beforeAll(async () => {
    initMockFeatureFlagForTest(
      async (k) => k === FeatureFlags.GRANULAR_PERMISSIONS.key,
    );

    application = await createPlatformApplication();

    [org1, org2] = await Promise.all([
      createRandomPlatformOrg(application.id),
      createRandomPlatformOrg(application.id),
    ]);

    user = await createRandomPlatformUser(application.id, {
      metadata: { admin: true },
    });

    const [viewer1, viewer2] = await Promise.all([
      Viewer.createLoggedInPlatformViewer({ user, org: org1 }),
      Viewer.createLoggedInPlatformViewer({ user, org: org2 }),
    ]);

    [{ thread: threadOrg1 }, { thread: threadOrg2 }] = await Promise.all([
      createPageAndThread(viewer1, application.id, {
        metadata: { colour: 'org1Colour' },
      }),
      createPageAndThread(viewer2, application.id, {
        metadata: { colour: 'org2Colour' },
      }),
    ]);
  });

  afterEach(async () => {
    await OrgMembersEntity.truncate({ cascade: true });
    await PermissionRuleEntity.truncate({ cascade: true });
  });

  test('Non-existent thread', async () => {
    // For non-existent threads, we expect to get undefined
    const nonExistentThreadID = uuid();
    const viewer = Viewer.createLoggedInViewer(user.id, org1.id);
    const thread = await (await tl(viewer)).loadThread(nonExistentThreadID);
    expect(thread).toBeNull();
  });

  test('Viewer org grants access', async () => {
    // Even if user is not a member of thread.orgID org, viewer still gets
    // access if viewer.orgID == thread.orgID
    const viewer = Viewer.createLoggedInViewer(user.id, threadOrg1.orgID);
    const receivedThread = await (await tl(viewer)).loadThread(threadOrg1.id);
    expect(receivedThread).toBeInstanceOf(ThreadEntity);
    expect(receivedThread!.id).toEqual(threadOrg1.id);
  });

  test('Org membership grants access', async () => {
    const viewer = Viewer.createLoggedInViewer(user.id, org1.id);

    // user is not part of org2 yet, so does not have thread access
    expect(await (await tl(viewer)).loadThread(threadOrg2.id)).toBeNull();

    // when user is member of thread.orgID org, then they have thread access
    const orgMember = await OrgMembersEntity.create({
      userID: user.id,
      orgID: threadOrg2.orgID,
    });
    const receivedThread = await (await tl(viewer)).loadThread(threadOrg2.id);
    expect(receivedThread).toBeInstanceOf(ThreadEntity);
    expect(receivedThread!.id).toEqual(threadOrg2.id);

    // once user is removed from thread.orgID org, they lose access
    await orgMember.destroy();
    expect(await (await tl(viewer)).loadThread(threadOrg2.id)).toBeNull();
  });

  test('Load by external ID does strict org check', async () => {
    const viewer = await Viewer.createLoggedInPlatformViewer({
      user: user,
      org: org1,
    });
    const receivedThread = await (
      await tl(viewer)
    ).loadByExternalIDStrictOrgCheck(threadOrg1.externalID);
    expect(receivedThread).toBeInstanceOf(ThreadEntity);
    expect(receivedThread!.id).toEqual(threadOrg1.id);

    // Can see the thread, but the Viewer indicates the wrong org, and
    // `loadByExternalID` does an org check.
    const viewerOrg2 = await Viewer.createLoggedInPlatformViewer({
      user: user,
      org: org2,
    });
    expect(
      await (
        await tl(viewerOrg2)
      ).loadByExternalIDStrictOrgCheck(threadOrg1.externalID),
    ).toBeNull();
    await OrgMembersEntity.create({
      userID: user.id,
      orgID: org1.id,
    });
    expect(
      await (
        await tl(viewerOrg2)
      ).loadByExternalIDStrictOrgCheck(threadOrg1.externalID),
    ).toBeNull();
  });

  test('Load by external ID no strict org check', async () => {
    const viewer = await Viewer.createLoggedInPlatformViewer({
      user: user,
      org: org1,
    });
    const receivedThread = await (
      await tl(viewer)
    ).loadByExternalID(threadOrg1.externalID);
    expect(receivedThread).toBeInstanceOf(ThreadEntity);
    expect(receivedThread!.id).toEqual(threadOrg1.id);

    // Adding the user to org as org member
    await OrgMembersEntity.create({
      userID: user.id,
      orgID: org1.id,
    });

    // Can see the thread, but the Viewer indicates the wrong org
    const viewerOrg2 = await Viewer.createLoggedInPlatformViewer({
      user: user,
      org: org2,
    });
    const receivedThread2 = await (
      await tl(viewerOrg2)
    ).loadByExternalID(threadOrg1.externalID);
    expect(receivedThread2).toBeInstanceOf(ThreadEntity);
    expect(receivedThread2!.id).toEqual(threadOrg1.id);
  });

  describe('PermissionRuleEntity', () => {
    let viewer: Viewer;

    beforeAll(async () => {
      viewer = await Viewer.createLoggedInPlatformViewer({
        user,
        org: null,
      });
      expect(viewer.relevantOrgIDs?.length).toBe(0);
    });

    test('ID', async () => {
      expect(await (await tl(viewer)).loadThread(threadOrg1.id)).toBeNull();

      await PermissionRuleEntity.create({
        userSelector: `$.id == "${user.externalID}"`,
        resourceSelector: `$.id == "${threadOrg1.externalID}"`,
        permissions: ['thread:read'],
        platformApplicationID: application.id,
      });

      const receivedThread = await (await tl(viewer)).loadThread(threadOrg1.id);
      expect(receivedThread).toBeInstanceOf(ThreadEntity);
      expect(receivedThread!.id).toEqual(threadOrg1.id);

      expect(await (await tl(viewer)).loadThread(threadOrg2.id)).toBeNull();
    });

    test('Metadata', async () => {
      expect(await (await tl(viewer)).loadThread(threadOrg1.id)).toBeNull();

      await PermissionRuleEntity.create({
        userSelector: `$.metadata.admin == true`,
        resourceSelector: `$.metadata.colour == "org1Colour"`,
        permissions: ['thread:read'],
        platformApplicationID: application.id,
      });

      const receivedThread = await (await tl(viewer)).loadThread(threadOrg1.id);
      expect(receivedThread).toBeInstanceOf(ThreadEntity);
      expect(receivedThread!.id).toEqual(threadOrg1.id);

      expect(await (await tl(viewer)).loadThread(threadOrg2.id)).toBeNull();
    });

    test('Viewer has org ID filter', async () => {
      const viewerOrg1 = await Viewer.createLoggedInPlatformViewer({
        user,
        org: org1,
      });

      // Permission rule that lets you see anything.
      await PermissionRuleEntity.create({
        userSelector: `true`,
        resourceSelector: `true`,
        permissions: ['thread:read'],
        platformApplicationID: application.id,
      });

      // Permission rule lets us see all threads, so we can see this cross-org
      // thread no problem, since `loadThread` does not do a strict org check
      // (so org in viewer doesn't matter).
      const receivedThreadById = await (
        await tl(viewerOrg1)
      ).loadThread(threadOrg2.id);
      expect(receivedThreadById).toBeInstanceOf(ThreadEntity);
      expect(receivedThreadById!.id).toEqual(threadOrg2.id);

      // But `loadByExternalIDStrictOrgCheck` does a strict org check, so even
      // though we can see this thread by permission rule, it doesn't match the
      // org ID filter in our viewer.
      const recievedThreadByExternalId = await (
        await tl(viewerOrg1)
      ).loadByExternalIDStrictOrgCheck(threadOrg2.externalID);
      expect(recievedThreadByExternalId).toBeNull();

      // However, this viewer doesn't have an org in their viewer at all, so
      // there's no implicit org filter, and we can load just fine because the
      // strict org check does nothing in this case.
      const recievedThreadByExternalIdNoOrg = await (
        await tl(viewer)
      ).loadByExternalIDStrictOrgCheck(threadOrg2.externalID);
      expect(recievedThreadByExternalIdNoOrg).toBeInstanceOf(ThreadEntity);
      expect(recievedThreadByExternalIdNoOrg!.id).toEqual(threadOrg2.id);
    });
  });
});
