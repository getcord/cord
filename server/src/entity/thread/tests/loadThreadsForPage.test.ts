import type { UUID } from 'common/types/index.ts';
import type { EntityMetadata, Location } from '@cord-sdk/types';
import { Viewer } from 'server/src/auth/index.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import {
  createPlatformApplication,
  createRandomPlatformOrg,
  createRandomPlatformUserAndOrgMember,
  createThreadViaGraphQL,
  setSubscribedViaGraphQL,
} from 'server/src/public/routes/tests/util.ts';
import type { ThreadLoader } from 'server/src/entity/thread/ThreadLoader.ts';
import type { PageThreadsResult } from 'server/src/schema/resolverTypes.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import { getNewLoaders } from 'server/src/RequestContextLoaders.ts';
import {
  FeatureFlags,
  initMockFeatureFlagForTest,
} from 'server/src/featureflags/index.ts';
import { PermissionRuleEntity } from 'server/src/entity/permission/PermisssionRuleEntity.ts';

let applicationID: UUID;

let org1: OrgEntity;
let org2: OrgEntity;

let authorUser: UserEntity;
let viewerUser: UserEntity;

async function createThreads(
  n: number,
  {
    metadata = {},
    location = {},
  }: { metadata?: EntityMetadata; location?: Location },
  org: OrgEntity = org1,
): Promise<UUID[]> {
  const author = await Viewer.createLoggedInPlatformViewer({
    user: authorUser,
    org,
  });
  const result = [];

  for (let i = 0; i < n; i++) {
    const { threadID } = await createThreadViaGraphQL(author, {
      metadata,
      location,
    });
    result.push(threadID);
  }

  result.reverse(); // Default sort is backwards.
  return result;
}

async function tl(org: OrgEntity | null = null): Promise<ThreadLoader> {
  const viewer = await Viewer.createLoggedInPlatformViewer({
    user: viewerUser,
    org,
  });
  return (await getNewLoaders(viewer)).threadLoader;
}

function ids(result: PageThreadsResult): UUID[] {
  return result.threads.map((t) => t.id);
}

describe('Test ThreadLoader.loadThreadsForPage', () => {
  beforeAll(async () => {
    initMockFeatureFlagForTest(
      async (k) => k === FeatureFlags.GRANULAR_PERMISSIONS.key,
    );

    applicationID = (await createPlatformApplication()).id;

    [org1, org2] = await Promise.all([
      createRandomPlatformOrg(applicationID),
      createRandomPlatformOrg(applicationID),
    ]);

    [authorUser, viewerUser] = await Promise.all([
      createRandomPlatformUserAndOrgMember(applicationID, org1.id),
      createRandomPlatformUserAndOrgMember(applicationID, org1.id),
    ]);
  });

  describe('Basic tests', () => {
    beforeEach(async () => {
      await Promise.all([
        ThreadEntity.truncate({ cascade: true }),
        OrgMembersEntity.truncate(),
      ]);

      await Promise.all([
        OrgMembersEntity.create({
          userID: viewerUser.id,
          orgID: org1.id,
        }),
        OrgMembersEntity.create({
          userID: authorUser.id,
          orgID: org1.id,
        }),
        OrgMembersEntity.create({
          userID: authorUser.id,
          orgID: org2.id,
        }),
      ]);
    });

    test('no filter', async () => {
      const ids1 = await createThreads(5, {
        metadata: { flavour: 'minty' },
        location: { page: 'test' },
      });
      const ids2 = await createThreads(5, {
        metadata: { flavour: 'bitter' },
        location: { page: 'elsewhere' },
      });

      const loaded = await (await tl()).loadThreadsForPage({});

      expect(ids(loaded)).toEqual([...ids2, ...ids1]);
      expect(loaded.hasMore).toBe(false);
    });

    test('filter by metadata', async () => {
      const ids1 = await createThreads(5, {
        metadata: { flavour: 'minty' },
      });
      await createThreads(5, {
        metadata: { flavour: 'bitter' },
      });

      const loaded = await (
        await tl()
      ).loadThreadsForPage({
        filter: { metadata: { flavour: 'minty' }, viewer: undefined },
      });

      expect(ids(loaded)).toEqual(ids1);
      expect(loaded.hasMore).toBe(false);
    });

    test('filter by subscribed', async () => {
      const ids1 = await createThreads(5, {});
      await createThreads(5, {});

      const viewer = await Viewer.createLoggedInPlatformViewer({
        user: viewerUser,
        org: null,
      });

      await Promise.all(ids1.map((id) => setSubscribedViaGraphQL(viewer, id)));

      const loaded = await (
        await tl()
      ).loadThreadsForPage({
        filter: { metadata: undefined, viewer: ['subscribed'] },
      });

      expect(ids(loaded)).toEqual(ids1);
      expect(loaded.hasMore).toBe(false);
    });

    test('filter by location', async () => {
      const ids1 = await createThreads(5, {
        location: { page: 'test' },
      });
      await createThreads(5, {
        location: { page: 'elsewhere' },
      });

      const loaded = await (
        await tl()
      ).loadThreadsForPage({ filter: { location: { page: 'test' } } });

      expect(ids(loaded)).toEqual(ids1);
      expect(loaded.hasMore).toBe(false);
    });

    test('only return threads in your org', async () => {
      const ids1 = await createThreads(5, {}, org1);
      const ids2 = await createThreads(5, {}, org2);

      const loaded1 = await (await tl(org1)).loadThreadsForPage({});
      expect(ids(loaded1)).toEqual(ids1);
      expect(loaded1.hasMore).toBe(false);

      const loadedAll = await (await tl(null)).loadThreadsForPage({});
      expect(ids(loadedAll)).toEqual(ids1);
      expect(loadedAll.hasMore).toBe(false);

      await OrgMembersEntity.create({
        userID: viewerUser.id,
        orgID: org2.id,
      });

      const loaded1Member = await (await tl(org1)).loadThreadsForPage({});
      expect(ids(loaded1Member)).toEqual(ids1);
      expect(loaded1Member.hasMore).toBe(false);

      const loadedAllMember = await (await tl(null)).loadThreadsForPage({});
      expect(ids(loadedAllMember)).toEqual([...ids2, ...ids1]);
      expect(loadedAllMember.hasMore).toBe(false);
    });

    test('pagination', async () => {
      const ids1 = await createThreads(10, {});

      const loaded = await (await tl()).loadThreadsForPage({ limit: 5 });

      expect(ids(loaded)).toEqual(ids1.slice(0, 5));
      expect(loaded.hasMore).toBe(true);

      const loadedPage2 = await (
        await tl()
      ).loadThreadsForPage({ after: loaded.token });

      expect(ids(loadedPage2)).toEqual(ids1.slice(5));
      expect(loadedPage2.hasMore).toBe(false);
    });

    test('limit same as number of threads', async () => {
      const ids2 = await createThreads(10, {});
      const loaded = await (await tl()).loadThreadsForPage({ limit: 10 });
      expect(ids(loaded)).toEqual(ids2.slice(0, 10));
      expect(loaded.hasMore).toBe(false);
    });

    test('limit over total number of threads', async () => {
      const ids2 = await createThreads(10, {});
      const loaded = await (await tl()).loadThreadsForPage({ limit: 15 });
      expect(ids(loaded)).toEqual(ids2.slice(0, 10));
      expect(loaded.hasMore).toBe(false);
    });
  });

  describe('PermissionRuleEntity', () => {
    const location = { page: 'test' };
    const totalNumThreads = 12;
    let visibleThreadIDs: UUID[] = [];

    beforeAll(async () => {
      await Promise.all([
        ThreadEntity.truncate({ cascade: true }),
        OrgMembersEntity.truncate(),
      ]);
      await OrgMembersEntity.create({
        userID: authorUser.id,
        orgID: org1.id,
      });

      const visible1 = await createThreads(3, {
        metadata: { visible: true },
        location,
      });
      await createThreads(3, { metadata: { visible: false }, location });
      await createThreads(3, {
        metadata: { visible: true },
        location: { page: 'elsewhere' },
      });
      const visible2 = await createThreads(3, {
        metadata: { visible: true },
        location,
      });

      await PermissionRuleEntity.truncate();
      await PermissionRuleEntity.create({
        userSelector: 'true',
        resourceSelector: '$.metadata.visible == true',
        permissions: ['thread:read'],
        platformApplicationID: applicationID,
      });

      visibleThreadIDs = [...visible2, ...visible1];
    });

    test('fetch everything', async () => {
      const loaded = await (
        await tl(null)
      ).loadThreadsForPage({ filter: { location } });
      expect(ids(loaded)).toEqual(visibleThreadIDs);
      expect(loaded.hasMore).toBe(false);
    });

    test('fetch everything 2', async () => {
      const loaded = await (
        await tl(null)
      ).loadThreadsForPage({ filter: { location }, limit: 1000 });
      expect(ids(loaded)).toEqual(visibleThreadIDs);
      expect(loaded.hasMore).toBe(false);
    });

    test.each(
      // Creates an array [1, 2, 3, .... totalNumThreads].
      Array(totalNumThreads)
        .fill(undefined)
        .map((_, i) => i + 1),
    )('fetch %d', async (limit) => {
      const loader = await tl(null);

      const page1 = await loader.loadThreadsForPage({
        filter: { location },
        limit,
      });
      expect(ids(page1)).toEqual(visibleThreadIDs.slice(undefined, limit));
      expect(page1.hasMore).toBe(limit < visibleThreadIDs.length);

      const page2 = await loader.loadThreadsForPage({
        filter: { location },
        after: page1.token,
      });
      expect(ids(page2)).toEqual(visibleThreadIDs.slice(limit));
      expect(page2.hasMore).toBe(false);
    });
  });
});
