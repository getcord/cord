import { AuthProviderType, Viewer } from 'server/src/auth/index.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';
import {
  addMessageViaGraphQL,
  createUserAndOrgMember,
  fetchOrCreateThreadByExternalIDViaGraphQL,
  resolveThreadViaGraphQL,
} from 'server/src/public/routes/tests/util.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';

let andreiUser: UserEntity;
let viewer: Viewer;
let viewer2: Viewer;
let organization: OrgEntity;
let accessToken: string;

describe('Platform API: GET /v1/threads/:threadID', () => {
  beforeAll(async () => {
    ({ andreiUser, organization, accessToken } = await setupPlatformTest());
    viewer = await Viewer.createLoggedInPlatformViewer({
      user: andreiUser,
      org: organization,
    });
    const secondUser = await createUserAndOrgMember({
      name: 'Second User',
      externalID: 'seconduser',
      appID: organization.platformApplicationID!,
      email: 'user2@example.com',
      orgID: organization.id,
      externalProvider: AuthProviderType.PLATFORM,
    });

    viewer2 = await Viewer.createLoggedInPlatformViewer({
      user: secondUser,
      org: organization,
    });
  });

  beforeEach(async () => {
    await ThreadEntity.truncate({ cascade: true });
  });

  test('invalid access token', async () => {
    const externalID = 'my-cool-thread';
    await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, { externalID });

    const { statusCode, body } = await apiCall()
      .get(`/v1/threads/${externalID}`)
      .set('Authorization', `Bearer llama`);

    expect(statusCode).toBe(401);
    expect(body.error).toBe('invalid_authorization_header');
  });

  test('thread with external ID', async () => {
    const externalID = 'my-cool-thread';
    await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, { externalID });

    const { statusCode, body } = await apiCall()
      .get(`/v1/threads/${externalID}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.id).toBe(externalID);
    expect(body.organizationID).toBe(organization.externalID);
    expect(body.total).toBe(0);
    expect(body.userMessages).toBe(0);
    expect(body.actionMessages).toBe(0);
    expect(body.deletedMessages).toBe(0);
    expect(body.resolvedTimestamp).toBeNull();
    expect(body.participants.length).toBe(1);
    expect(body.repliers.length).toBe(0);
    expect(body.location).toBeDefined();
  });

  test('thread with reply', async () => {
    const externalID = 'my-cool-thread';
    const { internalID } = await fetchOrCreateThreadByExternalIDViaGraphQL(
      viewer,
      { externalID },
    );
    await Promise.all([
      addMessageViaGraphQL(viewer, {
        threadID: internalID,
      }),
      addMessageViaGraphQL(viewer, {
        threadID: internalID,
      }),
    ]);

    const { statusCode, body } = await apiCall()
      .get(`/v1/threads/${externalID}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.id).toBe(externalID);
    expect(body.organizationID).toBe(organization.externalID);
    expect(body.total).toBe(2);
    expect(body.userMessages).toBe(2);
    expect(body.actionMessages).toBe(0);
    expect(body.deletedMessages).toBe(0);
    expect(body.resolvedTimestamp).toBeNull();
    expect(body.participants.length).toBe(1);
    expect(body.repliers.length).toBe(1);
    expect(body.actionMessageRepliers.length).toBe(0);
    expect(body.location).toBeDefined();
  });

  test('thread with replies and actions', async () => {
    const externalID = 'my-cool-thread';
    const { internalID } = await fetchOrCreateThreadByExternalIDViaGraphQL(
      viewer,
      { externalID },
    );
    await Promise.all([
      addMessageViaGraphQL(viewer, {
        threadID: internalID,
      }),
      addMessageViaGraphQL(viewer, {
        threadID: internalID,
      }),
    ]);
    await resolveThreadViaGraphQL(viewer2, { threadID: internalID });

    const { statusCode, body } = await apiCall()
      .get(`/v1/threads/${externalID}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(statusCode).toBe(200);
    expect(body.id).toBe(externalID);
    expect(body.organizationID).toBe(organization.externalID);
    expect(body.total).toBe(3);
    expect(body.userMessages).toBe(2);
    expect(body.actionMessages).toBe(1);
    expect(body.deletedMessages).toBe(0);
    expect(body.participants.length).toBe(2);
    expect(body.repliers.length).toBe(1);
    expect(body.actionMessageRepliers.length).toBe(1);
    expect(body.location).toBeDefined();
  });

  test('unknown thread ID', async () => {
    const { statusCode, body } = await apiCall()
      .get('/v1/threads/llama')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(404);
    expect(body.error).toBe('thread_not_found');
  });

  test('wrong app', async () => {
    const { accessToken: altToken } = await setupPlatformTest();

    const externalID = 'my-cool-thread';
    await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, { externalID });

    const { statusCode, body } = await apiCall()
      .get(`/v1/threads/${externalID}`)
      .set('Authorization', `Bearer ${altToken}`);

    expect(statusCode).toBe(404);
    expect(body.error).toBe('thread_not_found');
  });
});
