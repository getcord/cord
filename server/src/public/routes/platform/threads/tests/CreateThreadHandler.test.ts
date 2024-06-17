import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';
import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';

let accessToken: string;
let organization: OrgEntity;

describe('Platform API: POST /v1/threads/', () => {
  beforeAll(async () => {
    ({ accessToken, organization } = await setupPlatformTest());
  });

  beforeEach(async () => {
    await ThreadEntity.truncate({ cascade: true });
  });

  test('can successfully create a thread', async () => {
    const externalThreadID = 'my-cool-thread';

    expect(await ThreadEntity.count()).toBe(0);

    const { statusCode, body } = await apiCall()
      .post(`/v1/threads`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: externalThreadID,
        name: 'test0019',
        url: 'https://local.cord.com:8179/sdk/test/',
        groupID: 'cord',
        location: { page: 'testbed' },
      });
    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.threadID).toBe(externalThreadID);
    expect(await ThreadEntity.count()).toBe(1);
    expect(await MessageEntity.count()).toBe(0);
  });

  test('can create thread with no ID', async () => {
    const { statusCode, body } = await apiCall()
      .post(`/v1/threads`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'test thread with no id',
        url: 'https://local.cord.com:8179/sdk/test/index.html',
        groupID: 'cord',
        location: { page: 'testbed' },
      });

    const newThread = await ThreadEntity.findOne({
      where: {
        name: 'test thread with no id',
        orgID: organization.id,
      },
    });
    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);

    expect(body.threadID).toBe(newThread?.externalID);
    expect(await ThreadEntity.count()).toBe(1);
    expect(await MessageEntity.count()).toBe(0);
  });

  test('Unsuccessful creation of thread', async () => {
    const { statusCode, body } = await apiCall()
      .post(`/v1/threads`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'using org ID',
        url: 'https://local.cord.com:8179/sdk/test/index.html',
        location: {
          page: 'testbed',
        },
      });
    expect(statusCode).toBe(400);
    expect(body.error).toBe('invalid_request');
  });
});
