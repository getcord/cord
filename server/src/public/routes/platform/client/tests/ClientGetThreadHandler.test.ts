import * as jsonwebtoken from 'jsonwebtoken';
import type { ClientMessageData } from '@cord-sdk/types';
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
let secondUser: UserEntity;
let viewer: Viewer;
let viewer2: Viewer;
let organization: OrgEntity;
let clientAuthToken: string;
const externalID = 'thready-wedy';

describe('Client REST API: /v1/client/thread', () => {
  beforeAll(async () => {
    let application;
    ({ application, andreiUser, organization } = await setupPlatformTest());
    viewer = await Viewer.createLoggedInPlatformViewer({
      user: andreiUser,
      org: organization,
    });
    secondUser = await createUserAndOrgMember({
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

    clientAuthToken = jsonwebtoken.sign(
      { project_id: application.id, user_id: andreiUser.externalID },
      application.sharedSecret,
      { algorithm: 'HS512' },
    );
  });

  beforeEach(async () => {
    await ThreadEntity.truncate({ cascade: true });
  });

  test('Empty thread', async () => {
    await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, { externalID });

    const { statusCode, body } = await apiCall()
      .get(`/v1/client/thread/${externalID}`)
      .set('Authorization', `Bearer ${clientAuthToken}`);

    expect(statusCode).toBe(200);
    expect(body.thread.id).toBe(externalID);
    expect(body.thread.groupID).toBe(organization.externalID);
    expect(body.thread.total).toBe(0);
    expect(body.thread.userMessages).toBe(0);
    expect(body.thread.actionMessages).toBe(0);
    expect(body.thread.deletedMessages).toBe(0);
    expect(body.thread.resolvedTimestamp).toBeNull();
    expect(body.thread.participants.length).toBe(1);
    expect(body.thread.repliers.length).toBe(0);
    expect(body.thread.location).toBeDefined();
    expect(body.messages.length).toBe(0);
  });

  test('Thread with replies', async () => {
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
      .get(`/v1/client/thread/${externalID}`)
      .set('Authorization', `Bearer ${clientAuthToken}`);

    expect(statusCode).toBe(200);
    expect(body.thread.id).toBe(externalID);
    expect(body.thread.groupID).toBe(organization.externalID);
    expect(body.thread.total).toBe(2);
    expect(body.thread.userMessages).toBe(2);
    expect(body.thread.actionMessages).toBe(0);
    expect(body.thread.deletedMessages).toBe(0);
    expect(body.thread.resolvedTimestamp).toBeNull();
    expect(body.thread.participants.length).toBe(1);
    expect(body.thread.repliers.length).toBe(1);
    expect(body.thread.actionMessageRepliers.length).toBe(0);
    expect(body.thread.location).toBeDefined();
    expect(body.messages.length).toBe(2);
    expect(body.messages.map((m: ClientMessageData) => m.authorID)).toEqual([
      andreiUser.externalID,
      andreiUser.externalID,
    ]);
  });

  test('Thread with replies and actions', async () => {
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
      .get(`/v1/client/thread/${externalID}`)
      .set('Authorization', `Bearer ${clientAuthToken}`);
    expect(statusCode).toBe(200);
    expect(body.thread.id).toBe(externalID);
    expect(body.thread.groupID).toBe(organization.externalID);
    expect(body.thread.total).toBe(3);
    expect(body.thread.userMessages).toBe(2);
    expect(body.thread.actionMessages).toBe(1);
    expect(body.thread.deletedMessages).toBe(0);
    expect(body.thread.participants.length).toBe(2);
    expect(body.thread.repliers.length).toBe(1);
    expect(body.thread.actionMessageRepliers.length).toBe(1);
    expect(body.thread.location).toBeDefined();
    expect(body.messages.length).toBe(3);
    expect(body.messages.map((m: ClientMessageData) => m.authorID)).toEqual([
      andreiUser.externalID,
      andreiUser.externalID,
      secondUser.externalID,
    ]);
  });

  test('initialFetchCount', async () => {
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
      addMessageViaGraphQL(viewer, {
        threadID: internalID,
      }),
      addMessageViaGraphQL(viewer, {
        threadID: internalID,
      }),
      addMessageViaGraphQL(viewer, {
        threadID: internalID,
      }),
    ]);

    const { statusCode, body } = await apiCall()
      .get(`/v1/client/thread/${externalID}?initialFetchCount=3`)
      .set('Authorization', `Bearer ${clientAuthToken}`);

    expect(statusCode).toBe(200);
    expect(body.thread.id).toBe(externalID);
    expect(body.thread.groupID).toBe(organization.externalID);
    expect(body.thread.total).toBe(5);
    expect(body.messages.length).toBe(3);
  });

  test('Invalid thread ID', async () => {
    const { statusCode, body } = await apiCall()
      .get(`/v1/client/thread/invisible-thread`)
      .set('Authorization', `Bearer ${clientAuthToken}`);

    expect(statusCode).toBe(404);
    expect(body.error).toBe('thread_not_found');
  });
});
