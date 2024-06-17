import * as jsonwebtoken from 'jsonwebtoken';
import { AuthProviderType, Viewer } from 'server/src/auth/index.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';
import {
  addMessageViaGraphQL,
  createThreadViaGraphQL,
  createUserAndOrgMember,
  fetchOrCreateThreadByExternalIDViaGraphQL,
  markThreadSeenViaGraphQL,
  resolveThreadViaGraphQL,
} from 'server/src/public/routes/tests/util.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';
import { createMentionNode } from '@cord-sdk/react/common/lib/messageNode.ts';

let andreiUser: UserEntity;
let secondUser: UserEntity;
let viewer: Viewer;
let viewer2: Viewer;
let clientAuthToken: string;
let secondUserClientAuthToken: string;

describe('Client REST API: /v1/client/threads', () => {
  beforeAll(async () => {
    let application;
    let organization;
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
    secondUserClientAuthToken = jsonwebtoken.sign(
      { project_id: application.id, user_id: secondUser.externalID },
      application.sharedSecret,
      { algorithm: 'HS512' },
    );
  });

  beforeEach(async () => {
    await ThreadEntity.truncate({ cascade: true });
  });

  test('Empty', async () => {
    const { statusCode, body } = await apiCall()
      .get(`/v1/client/threads`)
      .set('Authorization', `Bearer ${clientAuthToken}`);

    expect(statusCode).toBe(200);
    expect(body).toEqual({
      counts: {
        total: 0,
        unread: 0,
        new: 0,
        unreadSubscribed: 0,
        resolved: 0,
        empty: 0,
      },
      threads: [],
      loading: false,
      hasMore: false,
    });
  });

  test('Simple thread', async () => {
    const { threadID } = await createThreadViaGraphQL(viewer, {
      location: { test: 'location' },
      metadata: { test: 'metadata' },
    });
    await addMessageViaGraphQL(viewer, { threadID });

    const { statusCode, body } = await apiCall()
      .get(`/v1/client/threads`)
      .set('Authorization', `Bearer ${secondUserClientAuthToken}`);

    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      counts: {
        total: 1,
        unread: 1,
        new: 1,
        unreadSubscribed: 0,
        resolved: 0,
        empty: 0,
      },
      threads: [
        { location: { test: 'location' }, metadata: { test: 'metadata' } },
      ],
      loading: false,
      hasMore: false,
    });
  });

  test('initialFetchCount', async () => {
    for (let i = 0; i < 10; i++) {
      await createThreadViaGraphQL(viewer, {
        metadata: { thread: i },
      });
    }

    const { statusCode, body } = await apiCall()
      .get(`/v1/client/threads?initialFetchCount=4`)
      .set('Authorization', `Bearer ${clientAuthToken}`);

    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      counts: {
        total: 10,
        unread: 0,
        new: 0,
        unreadSubscribed: 0,
        resolved: 0,
        empty: 0,
      },
      threads: [
        { metadata: { thread: 9 } },
        { metadata: { thread: 8 } },
        { metadata: { thread: 7 } },
        { metadata: { thread: 6 } },
      ],
      loading: false,
      hasMore: true,
    });
  });

  test('Some of everything', async () => {
    // An empty thread
    await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, {
      externalID: 'empty',
      location: { page: 'foo' },
      metadata: { thread: 'empty' },
    });

    // A new, subscribed thread
    await createThreadViaGraphQL(viewer2, {
      content: [createMentionNode(viewer.externalUserID!, 'somename')],
      location: { page: 'not foo' },
      metadata: { thread: 'subscribed' },
    });

    // An unsubscribed thread with a read and a new message
    {
      const { threadID } = await createThreadViaGraphQL(viewer2, {
        location: { page: 'foo', other_page: 'bar' },
        metadata: { thread: 'unsubscribed' },
      });
      await addMessageViaGraphQL(viewer2, { threadID });
      await markThreadSeenViaGraphQL(viewer, threadID);
      await addMessageViaGraphQL(viewer2, { threadID });
    }

    // A resolved thread with new messages
    {
      const { threadID } = await createThreadViaGraphQL(viewer2, {
        location: { page: 'foo' },
        metadata: { thread: 'resolved' },
      });
      await addMessageViaGraphQL(viewer2, { threadID });
      await resolveThreadViaGraphQL(viewer2, { threadID });
    }

    let { statusCode, body } = await apiCall()
      .get(`/v1/client/threads`)
      .set('Authorization', `Bearer ${clientAuthToken}`);
    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      counts: {
        total: 3,
        unread: 2,
        new: 1,
        unreadSubscribed: 1,
        resolved: 1,
        empty: 1,
      },
      threads: [
        { metadata: { thread: 'resolved' } },
        { metadata: { thread: 'unsubscribed' } },
        { metadata: { thread: 'subscribed' } },
        { metadata: { thread: 'empty' } },
      ],
      loading: false,
      hasMore: false,
    });

    // The viewer is subscribed to the empty thread and the first thread
    ({ statusCode, body } = await apiCall()
      .get(
        `/v1/client/threads?filter=${encodeURIComponent(
          JSON.stringify({ viewer: 'subscribed' }),
        )}`,
      )
      .set('Authorization', `Bearer ${clientAuthToken}`));
    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      counts: {
        total: 1,
        unread: 1,
        new: 1,
        unreadSubscribed: 1,
        resolved: 0,
        empty: 1,
      },
      threads: [
        { metadata: { thread: 'subscribed' } },
        { metadata: { thread: 'empty' } },
      ],
      loading: false,
      hasMore: false,
    });

    // The location matches everything but the one subscribed thread
    ({ statusCode, body } = await apiCall()
      .get(
        `/v1/client/threads?filter=${encodeURIComponent(
          JSON.stringify({
            location: { value: { page: 'foo' }, partialMatch: true },
          }),
        )}`,
      )
      .set('Authorization', `Bearer ${clientAuthToken}`));
    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      counts: {
        total: 2,
        unread: 1,
        new: 0,
        unreadSubscribed: 0,
        resolved: 1,
        empty: 1,
      },
      threads: [
        { metadata: { thread: 'resolved' } },
        { metadata: { thread: 'unsubscribed' } },
        { metadata: { thread: 'empty' } },
      ],
      loading: false,
      hasMore: false,
    });

    // The same as the previous, but the threads are in the opposite order.
    // (Empty threads are always at the end, since they have no messages to sort
    // by.)
    ({ statusCode, body } = await apiCall()
      .get(
        `/v1/client/threads?filter=${encodeURIComponent(
          JSON.stringify({
            location: { value: { page: 'foo' }, partialMatch: true },
          }),
        )}&sortDirection=ascending`,
      )
      .set('Authorization', `Bearer ${clientAuthToken}`));
    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      counts: {
        total: 2,
        unread: 1,
        new: 0,
        unreadSubscribed: 0,
        resolved: 1,
        empty: 1,
      },
      threads: [
        { metadata: { thread: 'unsubscribed' } },
        { metadata: { thread: 'resolved' } },
        { metadata: { thread: 'empty' } },
      ],
      loading: false,
      hasMore: false,
    });
  });
});
