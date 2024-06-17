import { AuthProviderType, Viewer } from 'server/src/auth/index.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';

import {
  addMessage,
  addMessageViaGraphQL,
  createPage,
  createThread,
  createUserAndOrgMember,
  fetchOrCreateThreadByExternalIDViaGraphQL,
} from 'server/src/public/routes/tests/util.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';
import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import type { ListMessagesPaginationToken } from 'server/src/public/routes/platform/messages/ListMessagesHandler.ts';

let viewer: Viewer;
let andreiUser: UserEntity;
let flooeyUser: UserEntity;
let accessToken: string;
let organization: OrgEntity;

const TOTAL_MESSAGES = 10;
describe('Platform API: GET /v1/messages/', () => {
  beforeAll(async () => {
    ({ andreiUser, accessToken, organization } = await setupPlatformTest());

    viewer = await Viewer.createLoggedInPlatformViewer({
      user: andreiUser,
      org: organization,
    });

    const externalThreadID = 'my-cool-thread';

    const page = await createPage(organization.id);
    const thread = await createThread(
      externalThreadID,
      organization.id,
      page.contextHash,
      andreiUser.platformApplicationID!,
    );

    for (let index = 0; index < TOTAL_MESSAGES; index++) {
      await getSequelize().transaction(async (transaction) => {
        await addMessage({
          thread,
          viewer,
          transaction,
          message: 'hello! ' + index,
        });
      });
    }

    flooeyUser = await createUserAndOrgMember({
      name: 'flooey',
      externalID: 'flooey',
      appID: viewer.platformApplicationID!,
      email: 'flooey@flooey.org',
      orgID: organization.id,
      externalProvider: AuthProviderType.PLATFORM,
    });
  });

  test('can successfully get messages with pagination', async () => {
    const LIMIT = 7;

    const { statusCode, body } = await apiCall()
      .get(`/v1/messages?limit=${LIMIT}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    const { messages, pagination } = body;
    expect(messages.length).toEqual(LIMIT);
    expect(pagination.token).not.toBeNull();
    expect(pagination.total).toEqual(TOTAL_MESSAGES);

    // Second call, using the token that was returned in the first response
    const { statusCode: statusCode2, body: body2 } = await apiCall()
      .get(`/v1/messages?limit=${LIMIT}&token=${pagination.token}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode2).toBe(200);
    const { messages: messages2, pagination: pagination2 } = body2;
    expect(messages2.length).toEqual(TOTAL_MESSAGES - LIMIT);
    expect(pagination2.token).toBeNull();
    expect(pagination2.total).toEqual(TOTAL_MESSAGES);
  });

  test('badly encoded token', async () => {
    const LIMIT = 5;

    const { statusCode } = await apiCall()
      .get(`/v1/messages?limit=${LIMIT}&token=nosense`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(400);
  });

  test('token encoded with invalid values', async () => {
    const LIMIT = 5;

    const token: ListMessagesPaginationToken = {
      externalID: '',
      createdAtWithMicros: '',
    };

    const { statusCode } = await apiCall()
      .get(`/v1/messages?limit=${LIMIT}&token=${btoa(JSON.stringify(token))}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(400);
  });

  test('can filter messages', async () => {
    const viewer2 = await Viewer.createLoggedInPlatformViewer({
      user: flooeyUser,
      org: organization,
    });

    const { internalID } = await fetchOrCreateThreadByExternalIDViaGraphQL(
      viewer,
      {
        externalID: 'thread1',
        location: { page: 'foobar' },
      },
    );
    await Promise.all([
      addMessageViaGraphQL(viewer, {
        threadID: internalID,
      }),
      addMessageViaGraphQL(viewer, {
        threadID: internalID,
      }),
      addMessageViaGraphQL(viewer2, {
        threadID: internalID,
        metadata: { foo: 'bar' },
      }),
    ]);

    const { internalID: threadID2 } =
      await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, {
        externalID: 'thread2',
        location: { page: 'foobaz' },
      });
    await Promise.all([
      addMessageViaGraphQL(viewer, {
        threadID: threadID2,
      }),
      addMessageViaGraphQL(viewer, {
        threadID: threadID2,
        metadata: { foo: 'baz' },
      }),
      addMessageViaGraphQL(viewer2, {
        threadID: threadID2,
        metadata: { foo: 'bar' },
      }),
    ]);
    const { statusCode, body } = await apiCall()
      .get(`/v1/messages`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(statusCode).toBe(200);
    expect(body.pagination.total).toEqual(TOTAL_MESSAGES + 6);

    // filter by location
    const { statusCode: statusCode1, body: filteredBody } = await apiCall()
      .get(
        `/v1/messages/?filter=${encodeURIComponent(
          JSON.stringify({ location: { page: 'foobar' } }),
        )}`,
      )
      .set('Authorization', `Bearer ${accessToken}`);
    expect(statusCode1).toBe(200);
    expect(filteredBody.pagination.total).toEqual(3);
    expect(filteredBody.messages.length).toEqual(3);

    // filter by metadata
    const { statusCode: statusCode2, body: filteredBody1 } = await apiCall()
      .get(
        `/v1/messages/?filter=${encodeURIComponent(
          JSON.stringify({ metadata: { foo: 'bar' } }),
        )}`,
      )
      .set('Authorization', `Bearer ${accessToken}`);
    expect(statusCode2).toBe(200);
    expect(filteredBody1.pagination.total).toEqual(2);
    expect(filteredBody1.messages.length).toEqual(2);

    // filter by location and metadata
    const { statusCode: statusCode3, body: filteredBody2 } = await apiCall()
      .get(
        `/v1/messages/?filter=${encodeURIComponent(
          JSON.stringify({
            location: { page: 'foobar' },
            metadata: { foo: 'bar' },
          }),
        )}`,
      )
      .set('Authorization', `Bearer ${accessToken}`);
    expect(statusCode3).toBe(200);
    expect(filteredBody2.pagination.total).toEqual(1);
    expect(filteredBody2.messages.length).toEqual(1);

    // filter by author id
    const { statusCode: statusCode4, body: filteredBody4 } = await apiCall()
      .get(
        `/v1/messages/?filter=${encodeURIComponent(
          JSON.stringify({
            authorID: flooeyUser.externalID,
          }),
        )}`,
      )
      .set('Authorization', `Bearer ${accessToken}`);
    expect(statusCode4).toBe(200);
    expect(filteredBody4.pagination.total).toEqual(2);
    expect(filteredBody4.messages.length).toEqual(2);
  });

  test('bad authorID in filter', async () => {
    const { statusCode } = await apiCall()
      .get(
        `/v1/messages/?filter=${encodeURIComponent(
          JSON.stringify({
            authorID: 'abcd',
          }),
        )}`,
      )
      .set('Authorization', `Bearer ${accessToken}`);
    expect(statusCode).toBe(401);
  });
});
