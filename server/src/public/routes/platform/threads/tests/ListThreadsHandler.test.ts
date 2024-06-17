import { AuthProviderType, Viewer } from 'server/src/auth/index.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';
import {
  addMessageViaGraphQL,
  createThreadViaGraphQL,
  createUserAndOrgMember,
  fetchOrCreateThreadByExternalIDViaGraphQL,
  resolveThreadViaGraphQL,
} from 'server/src/public/routes/tests/util.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';

let andreiUser: UserEntity;
let viewer: Viewer;
let organization: OrgEntity;
let accessToken: string;

let viewer2: Viewer;

describe('Platform API: GET /v1/threads', () => {
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
    const { statusCode, body } = await apiCall()
      .get(`/v1/threads/`)
      .set('Authorization', `Bearer llama`);

    expect(statusCode).toBe(401);
    expect(body.error).toBe('invalid_authorization_header');
  });

  test('list single thread', async () => {
    const externalID = 'my-cool-thread';
    await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, { externalID });

    const { statusCode, body } = await apiCall()
      .get(`/v1/threads/`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.pagination.total).toBe(1);
    expect(body.threads.length).toBe(1);
    const firstThread = body.threads[0];
    expect(firstThread.id).toBe(externalID);
    expect(firstThread.organizationID).toBe(organization.externalID);
    expect(firstThread.total).toBe(0);
    expect(firstThread.userMessages).toBe(0);
    expect(firstThread.actionMessages).toBe(0);
    expect(firstThread.deletedMessages).toBe(0);
    expect(firstThread.resolvedTimestamp).toBeNull();
    expect(firstThread.participants.length).toBe(1);
    expect(firstThread.repliers.length).toBe(0);
    expect(firstThread.location).toBeDefined();
  });

  test('list single thread with replies by different users', async () => {
    const externalID = 'my-cool-thread';
    const { internalID } = await fetchOrCreateThreadByExternalIDViaGraphQL(
      viewer,
      { externalID },
    );
    await Promise.all([
      addMessageViaGraphQL(viewer, {
        threadID: internalID,
      }),
      addMessageViaGraphQL(viewer2, {
        threadID: internalID,
      }),
    ]);
    const { statusCode, body } = await apiCall()
      .get(`/v1/threads/`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.pagination.total).toBe(1);
    expect(body.threads.length).toBe(1);
    const firstThread = body.threads[0];
    expect(firstThread.id).toBe(externalID);
    expect(firstThread.organizationID).toBe(organization.externalID);
    expect(firstThread.total).toBe(2);
    expect(firstThread.userMessages).toBe(2);
    expect(firstThread.actionMessages).toBe(0);
    expect(firstThread.deletedMessages).toBe(0);
    expect(firstThread.resolvedTimestamp).toBeNull();
    expect(firstThread.participants.length).toBe(2);
    expect(firstThread.repliers.length).toBe(1);
    expect(firstThread.location).toBeDefined();
  });

  test('list single thread with replies and actions made by different users', async () => {
    const externalID = 'my-cool-thread';
    const { internalID } = await fetchOrCreateThreadByExternalIDViaGraphQL(
      viewer,
      { externalID },
    );
    await Promise.all([
      addMessageViaGraphQL(viewer, {
        threadID: internalID,
      }),
      addMessageViaGraphQL(viewer2, {
        threadID: internalID,
      }),
    ]);

    await resolveThreadViaGraphQL(viewer, { threadID: internalID });
    const { statusCode, body } = await apiCall()
      .get(`/v1/threads/`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.pagination.total).toBe(1);
    expect(body.threads.length).toBe(1);
    const firstThread = body.threads[0];
    expect(firstThread.id).toBe(externalID);
    expect(firstThread.organizationID).toBe(organization.externalID);
    expect(firstThread.total).toBe(3);
    expect(firstThread.userMessages).toBe(2);
    expect(firstThread.actionMessages).toBe(1);
    expect(firstThread.deletedMessages).toBe(0);
    expect(firstThread.resolvedTimestamp).toBeDefined();
    expect(firstThread.participants.length).toBe(2);
    expect(firstThread.repliers.length).toBe(1);
    expect(firstThread.actionMessageRepliers.length).toBe(1);
    expect(firstThread.location).toBeDefined();
  });

  test('list multiple threads', async () => {
    const externalID = 'my-cool-thread';
    await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, { externalID });
    const { statusCode, body } = await apiCall()
      .get(`/v1/threads/`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(statusCode).toBe(200);
    expect(body.pagination.total).toBe(1);
  });

  test('extra query params', async () => {
    const { statusCode } = await apiCall()
      .get(`/v1/threads/?notafilter=llama`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
  });

  test('invalid filter field', async () => {
    const { statusCode } = await apiCall()
      .get(`/v1/threads/?filter=whatever`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(400);
  });

  test('invalid filter json', async () => {
    const { statusCode } = await apiCall()
      .get(`/v1/threads/?filter=%7B%22foo%22%3A1`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(400);
  });

  test('invalid filter field with extra keys', async () => {
    const { statusCode } = await apiCall()
      .get(
        `/v1/threads/?filter=${encodeURIComponent(
          JSON.stringify({
            location: { a: 1 },
            metadata: { b: 2 },
            garbage: 7,
          }),
        )}`,
      )
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(400);
  });

  test('invalid location field', async () => {
    const { statusCode } = await apiCall()
      .get(
        `/v1/threads/?filter=${encodeURIComponent(
          JSON.stringify({ location: 'flat' }),
        )}`,
      )
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(400);
  });

  test('invalid metadata field', async () => {
    const { statusCode } = await apiCall()
      .get(
        `/v1/threads/?filter=${encodeURIComponent(
          JSON.stringify({ metadata: 'flat' }),
        )}`,
      )
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(400);
  });

  test('invalid firstMessageTimestamp field', async () => {
    const { statusCode } = await apiCall()
      .get(
        `/v1/threads/?filter=${encodeURIComponent(
          JSON.stringify({ firstMessageTimestamp: 'boo!' }),
        )}`,
      )
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(400);
  });

  test('invalid mostRecentMessageTimestamp field', async () => {
    const { statusCode } = await apiCall()
      .get(
        `/v1/threads/?filter=${encodeURIComponent(
          JSON.stringify({ mostRecentMessageTimestamp: 'notadate' }),
        )}`,
      )
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(400);
  });
});

describe('Platform API: GET /v1/threads pagination', () => {
  const nowTimestamp = new Date(Date.now());
  const threadsTotal = 20;
  const externalID = 'my-cool-thread';

  function addDaysToTimestamp(timestamp: Date, numberOfDays: number): Date {
    const newDate = new Date(timestamp);
    return new Date(newDate.setDate(newDate.getDate() + numberOfDays));
  }

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

  afterEach(async () => {
    await ThreadEntity.truncate({ cascade: true });
  });

  beforeEach(async () => {
    const location1 = { location: 1 };
    const location2 = { location: 2 };

    for (let index = 0; index < threadsTotal; index++) {
      await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, {
        externalID: `${externalID}-${index}`,
        location: index < 10 ? location1 : location2,
      });
    }
  });

  test('multiple list query', async () => {
    // without limit - using the default limit of 1000
    const { statusCode: defaultStatusCode, body: defaultBody } = await apiCall()
      .get(`/v1/threads/`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(defaultStatusCode).toBe(200);
    expect(defaultBody.pagination.total).toBe(20);
    expect(defaultBody.threads.length).toBe(20);

    // adding a limit of 10 rows
    const { statusCode, body } = await apiCall()
      .get(`/v1/threads?limit=10`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.pagination.total).toBe(20);
    expect(body.threads.length).toBe(10);

    const token = body.pagination.token;
    expect(token).not.toBeNull();
    expect(typeof token).toBe('string');

    // 2nd call with the pagination token that was received in the previous call
    const { statusCode: statusCode2, body: body2 } = await apiCall()
      .get(`/v1/threads?limit=10&token=${token}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode2).toBe(200);
    expect(body2.pagination.total).toBe(20);
    expect(body2.threads.length).toBe(10);
    expect(body2.pagination.token).not.toBeNull();
  });

  test('sorting by message creation time', async () => {
    const thread2 = await ThreadEntity.findOne({
      where: { externalID: `${externalID}-2` },
    });
    expect(thread2).not.toBeNull();
    const { messageID: thread2MessageID } = await addMessageViaGraphQL(viewer, {
      threadID: thread2!.id,
    });

    const thread4 = await ThreadEntity.findOne({
      where: { externalID: `${externalID}-4` },
    });
    expect(thread4).not.toBeNull();
    await addMessageViaGraphQL(viewer, { threadID: thread4!.id });

    // The message in thread 4 was created first, but this message was more
    // recently updated; thread 4 should still come first in the list
    await MessageEntity.update(
      {
        lastUpdatedTimestamp: new Date(),
      },
      { where: { id: thread2MessageID } },
    );

    const { statusCode, body } = await apiCall()
      .get(`/v1/threads?limit=10`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.threads.length).toBe(10);
    expect(body.threads[0].id).toBe(`${externalID}-4`);
    expect(body.threads[1].id).toBe(`${externalID}-2`);
    expect(body.threads[2].id).toBe(`${externalID}-${threadsTotal - 1}`);
  });

  test('query location filtering', async () => {
    const { statusCode: defaultStatusCode, body: defaultBody } = await apiCall()
      .get(`/v1/threads/`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(defaultStatusCode).toBe(200);
    expect(defaultBody.pagination.total).toBe(20);
    expect(defaultBody.threads.length).toBe(20);

    let { statusCode, body } = await apiCall()
      .get(
        `/v1/threads?filter=${encodeURIComponent(
          JSON.stringify({ location: { value: {}, partialMatch: true } }),
        )}`,
      )
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.pagination.total).toBe(20);
    expect(body.threads.length).toBe(20);

    ({ statusCode, body } = await apiCall()
      .get(
        `/v1/threads?limit=5&filter=${encodeURIComponent(
          JSON.stringify({ location: { location: 1 } }),
        )}`,
      )
      .set('Authorization', `Bearer ${accessToken}`));
    expect(statusCode).toBe(200);
    expect(body.pagination.total).toBe(10);
    expect(body.threads.length).toBe(5);

    const token = body.pagination.token;
    expect(token).not.toBeNull();
    expect(typeof token).toBe('string');

    // 2nd call with the pagination token that was received in the previous call
    const { statusCode: statusCode2, body: body2 } = await apiCall()
      .get(
        `/v1/threads?limit=10&&token=${token}&filter=${encodeURIComponent(
          JSON.stringify({ location: { location: 1 } }),
        )}`,
      )
      .set('Authorization', `Bearer ${accessToken}`);
    expect(statusCode2).toBe(200);
    expect(body2.pagination.total).toBe(10);
    expect(body2.threads.length).toBe(5);

    const token2 = body2.pagination.token;
    expect(token2).toBeNull();
  });

  test('query metadata filtering', async () => {
    for (let index = 0; index < threadsTotal; index++) {
      const { statusCode } = await apiCall()
        .put(`/v1/threads/${externalID}-${index}`)
        .send({
          metadata: { meta: index > 7 ? 1 : 2 },
        })
        .set('Authorization', `Bearer ${accessToken}`);
      expect(statusCode).toBe(200);
    }

    const { statusCode, body } = await apiCall()
      .get(
        `/v1/threads?limit=10&filter=${encodeURIComponent(
          JSON.stringify({ metadata: { meta: 1 } }),
        )}`,
      )
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.pagination.total).toBe(12);
    expect(body.threads.length).toBe(10);

    const token = body.pagination.token;
    expect(token).not.toBeNull();
    expect(typeof token).toBe('string');

    // 2nd call with the pagination token that was received in the previous call
    const { statusCode: statusCode2, body: body2 } = await apiCall()
      .get(
        `/v1/threads?limit=10&&token=${token}&filter=${encodeURIComponent(
          JSON.stringify({ metadata: { meta: 1 } }),
        )}`,
      )
      .set('Authorization', `Bearer ${accessToken}`);
    expect(statusCode2).toBe(200);
    expect(body2.pagination.total).toBe(12);
    expect(body2.threads.length).toBe(2);

    const token2 = body2.pagination.token;
    expect(token2).toBeNull();
    await ThreadEntity.truncate({ cascade: true });
  });

  test('query location + metadata filtering', async () => {
    const { statusCode: updateStatusCode } = await apiCall()
      .put(`/v1/threads/${externalID}-1`)
      .send({ metadata: { meta: 1 } })
      .set('Authorization', `Bearer ${accessToken}`);
    expect(updateStatusCode).toBe(200);

    const { statusCode: updateStatusCode2 } = await apiCall()
      .put(`/v1/threads/${externalID}-2`)
      .send({ metadata: { meta: 2 } })
      .set('Authorization', `Bearer ${accessToken}`);
    expect(updateStatusCode2).toBe(200);

    const { statusCode: defaultStatusCode, body: defaultBody } = await apiCall()
      .get(`/v1/threads/`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(defaultStatusCode).toBe(200);
    expect(defaultBody.pagination.total).toBe(20);

    // Query for location 1 and metadata 1 which should only match thread1
    const { statusCode, body } = await apiCall()
      .get(
        `/v1/threads/?filter=${encodeURIComponent(
          JSON.stringify({ metadata: { meta: 1 }, location: { location: 1 } }),
        )}`,
      )
      .set('Authorization', `Bearer ${accessToken}`);
    expect(statusCode).toBe(200);
    expect(body.pagination.total).toBe(1);
    expect(body.threads.length).toBe(1);
    expect(body.threads[0].id).toBe(`${externalID}-1`);
    expect(body.pagination.token).toBeNull();
  });

  test.each([
    {
      mostRecentMessageTimestamp: {
        to: addDaysToTimestamp(nowTimestamp, 1),
      },
      length: 1,
    },
    {
      mostRecentMessageTimestamp: {
        from: addDaysToTimestamp(nowTimestamp, 1),
      },
      length: 1,
    },
    {
      mostRecentMessageTimestamp: {
        from: addDaysToTimestamp(nowTimestamp, -1),
        to: addDaysToTimestamp(nowTimestamp, 2),
      },
      length: 2,
    },
  ])('query mostRecentMessageTimestamp filtering', async (filter) => {
    await ThreadEntity.truncate({ cascade: true });

    await createThreadViaGraphQL(viewer, {});
    const { threadID: thread2ID, messageID: message2ID } =
      await createThreadViaGraphQL(viewer, {});
    const thread2ExternalID = (await ThreadEntity.findByPk(thread2ID))
      ?.externalID;
    const message2ExternalID = (await MessageEntity.findByPk(message2ID))
      ?.externalID;

    const { statusCode: threadMessageUpdateStatusCode } = await apiCall()
      .put(`/v1/threads/${thread2ExternalID}/messages/${message2ExternalID}`)
      .send({
        createdTimestamp: addDaysToTimestamp(nowTimestamp, 2),
        updatedTimestamp: addDaysToTimestamp(nowTimestamp, 2),
      })
      .set('Authorization', `Bearer ${accessToken}`);
    expect(threadMessageUpdateStatusCode).toBe(200);

    const mostRecentMessageTimestamp = filter.mostRecentMessageTimestamp;
    const { statusCode: statusCodeResponse, body: bodyResponse } =
      await apiCall()
        .get(
          `/v1/threads/?filter=${encodeURIComponent(
            JSON.stringify({ mostRecentMessageTimestamp }),
          )}`,
        )
        .set('Authorization', `Bearer ${accessToken}`);
    expect(statusCodeResponse).toBe(200);
    expect(bodyResponse.threads.length).toBe(filter.length);
  });

  test.each([
    {
      firstMessageTimestamp: { to: new Date('1 January 2020') },
      length: 0,
    },
    {
      firstMessageTimestamp: { from: new Date('4 January 2020') },
      length: 0,
    },
    {
      firstMessageTimestamp: {
        from: '1 January 2020',
        to: '3 January 2020',
      },
      length: 1,
    },
  ])('query firstMessageTimestamp filtering', async (filter) => {
    await ThreadEntity.truncate({ cascade: true });

    const { threadID, messageID } = await createThreadViaGraphQL(viewer, {});
    const threadExternalID = (await ThreadEntity.findByPk(threadID))
      ?.externalID;
    const messageExternalID = (await MessageEntity.findByPk(messageID))
      ?.externalID;

    const { statusCode: threadMessageUpdateStatusCode } = await apiCall()
      .put(`/v1/threads/${threadExternalID}/messages/${messageExternalID}`)
      .send({ createdTimestamp: new Date('2 January 2020') })
      .set('Authorization', `Bearer ${accessToken}`);
    expect(threadMessageUpdateStatusCode).toBe(200);

    const firstMessageTimestamp = filter.firstMessageTimestamp;
    const { statusCode: statusCodeResponse, body: bodyResponse } =
      await apiCall()
        .get(
          `/v1/threads/?filter=${encodeURIComponent(
            JSON.stringify({ firstMessageTimestamp }),
          )}`,
        )
        .set('Authorization', `Bearer ${accessToken}`);
    expect(statusCodeResponse).toBe(200);
    expect(bodyResponse.threads.length).toBe(filter.length);
  });

  test('pagination tokens with mixture of empty and nonempty threads', async () => {
    const thread2 = await ThreadEntity.findOne({
      where: { externalID: `${externalID}-2` },
    });
    expect(thread2).not.toBeNull();
    await addMessageViaGraphQL(viewer, { threadID: thread2!.id });

    const thread4 = await ThreadEntity.findOne({
      where: { externalID: `${externalID}-4` },
    });
    expect(thread4).not.toBeNull();
    await addMessageViaGraphQL(viewer, { threadID: thread4!.id });

    let { statusCode, body } = await apiCall()
      .get(`/v1/threads?limit=1`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.threads.length).toBe(1);
    expect(body.threads[0].id).toBe(`${externalID}-4`);

    ({ statusCode, body } = await apiCall()
      .get(`/v1/threads?limit=1&token=${body.pagination.token}`)
      .set('Authorization', `Bearer ${accessToken}`));

    expect(statusCode).toBe(200);
    expect(body.threads.length).toBe(1);
    expect(body.threads[0].id).toBe(`${externalID}-2`);
    ({ statusCode, body } = await apiCall()
      .get(`/v1/threads?limit=1&token=${body.pagination.token}`)
      .set('Authorization', `Bearer ${accessToken}`));

    expect(statusCode).toBe(200);
    expect(body.threads.length).toBe(1);
    expect(body.threads[0].id).toBe(`${externalID}-${threadsTotal - 1}`);
  });
});
