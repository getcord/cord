import { v4 as uuid } from 'uuid';

import { executeGraphQLOperation } from 'server/src/tests/setupEnvironment.ts';
import { Viewer } from 'server/src/auth/index.ts';
import {
  createPlatformApplication,
  createRandomPlatformOrg,
  createRandomPlatformUserAndOrgMember,
} from 'server/src/public/routes/tests/util.ts';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';

import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { serializableTransactionWithRetries } from 'server/src/entity/sequelize.ts';
import { PreallocatedThreadIDEntity } from 'server/src/entity/preallocated_thread_id/PreallocatedThreadIDEntity.ts';
import { ThreadMutator } from 'server/src/entity/thread/ThreadMutator.ts';
import { PageMutator } from 'server/src/entity/page/PageMutator.ts';
import sleep from 'common/util/sleep.ts';

let viewer: Viewer;
let application: ApplicationEntity;
let org: OrgEntity;
let user: UserEntity;

async function createThreadImpl(externalID: string) {
  await serializableTransactionWithRetries(async (transaction) => {
    const threadID = await PreallocatedThreadIDEntity.findOne({
      where: {
        platformApplicationID: application.id,
        externalID,
      },
      transaction,
    });
    // Purely experimentally, this is enough of a delay that it causes the below
    // tests to fail on non-SERIALIZABLE isolation levels
    await sleep(50);
    const id = threadID?.id ?? uuid();
    const page = await new PageMutator(viewer).getPageCreateIfNotExists(
      { data: { page: 'foo' }, providerID: null },
      transaction,
    );
    await new ThreadMutator(viewer, null).createThreadOnPage(
      id,
      'http://example.com',
      page.page,
      'foo',
      transaction,
      application.id,
      externalID,
    );
  });
}

describe('threadByExternalID2', () => {
  beforeAll(async () => {
    application = await createPlatformApplication();
    org = await createRandomPlatformOrg(application.id);
    user = await createRandomPlatformUserAndOrgMember(application.id, org.id);

    viewer = await Viewer.createLoggedInPlatformViewer({
      user,
      org,
    });
  });

  test('many concurrent requests - thread inserted midway', async () => {
    const TOTAL_RUNS = 50;
    // Run TOTAL_RUNS requests that all ask for the same thread externalID,
    // except after the first one completes, we insert a thread for that ID.
    // They all should get the same value.
    const externalID = uuid();

    let createThread: typeof createThreadImpl | null = createThreadImpl;
    const results = await Promise.all(
      [...Array(TOTAL_RUNS).keys()].map(async () => {
        const result = await executeGraphQLOperation({
          query: `query ThreadByExternalID2Query {
            threadByExternalID2(input: { externalThreadID: "${externalID}" }) {
              id
            }
          }`,
          viewer,
        });
        if (createThread) {
          const doCreateThread = createThread;
          createThread = null;
          await doCreateThread(externalID);
        }
        return result;
      }),
    );
    for (const result of results) {
      expect(result.errors).toBeUndefined();
      expect(result.data?.threadByExternalID2?.id).toBe(
        results[0].data?.threadByExternalID2?.id,
      );
    }
  });

  test('many concurrent requests - thread inserted before', async () => {
    const TOTAL_RUNS = 100;
    // Run TOTAL_RUNS requests that all ask for the same thread externalID,
    // except the first one inserts the thread first. They all should get the
    // same value.
    const externalID = uuid();

    let createThread: typeof createThreadImpl | null = createThreadImpl;

    const results = await Promise.all(
      [...Array(TOTAL_RUNS).keys()].map(async () => {
        if (createThread) {
          const doCreateThread = createThread;
          createThread = null;
          await doCreateThread(externalID);
        }
        return await executeGraphQLOperation({
          query: `query ThreadByExternalID2Query {
            threadByExternalID2(input: { externalThreadID: "${externalID}" }) {
              id
            }
          }`,
          viewer,
        });
      }),
    );
    for (const result of results) {
      expect(result.errors).toBeUndefined();
      expect(result.data?.threadByExternalID2?.id).toBe(
        results[0].data?.threadByExternalID2?.id,
      );
    }
  });
});
