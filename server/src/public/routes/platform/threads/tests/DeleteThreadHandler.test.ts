import { Viewer } from 'server/src/auth/index.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';
import {
  addMessageViaGraphQL,
  fetchOrCreateThreadByExternalIDViaGraphQL,
} from 'server/src/public/routes/tests/util.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';

let andreiUser: UserEntity;
let viewer: Viewer;
let organization: OrgEntity;
let accessToken: string;

describe('Platform API: DELETE /v1/threads/:threadID', () => {
  beforeAll(async () => {
    ({ andreiUser, organization, accessToken } = await setupPlatformTest());
    viewer = await Viewer.createLoggedInPlatformViewer({
      user: andreiUser,
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
      .delete(`/v1/threads/${externalID}`)
      .set('Authorization', `Bearer llama`);

    expect(statusCode).toBe(401);
    expect(body.error).toBe('invalid_authorization_header');
  });

  test('delete thread', async () => {
    const externalID1 = 'my-cool-thread';
    const externalID2 = 'another-cool-thread';
    const { internalID: internalID1 } =
      await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, {
        externalID: externalID1,
      });
    const { internalID: internalID2 } =
      await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, {
        externalID: externalID2,
      });
    expect(await ThreadEntity.count()).toBe(2);

    const { messageID: messageID1 } = await addMessageViaGraphQL(viewer, {
      threadID: internalID1,
    });
    const { messageID: messageID2 } = await addMessageViaGraphQL(viewer, {
      threadID: internalID2,
    });
    expect(await MessageEntity.count()).toBe(2);

    const { statusCode, body } = await apiCall()
      .delete(`/v1/threads/${externalID1}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);

    expect(await ThreadEntity.count()).toBe(1);
    expect(await MessageEntity.count()).toBe(1);

    const thread1 = await ThreadEntity.findOne({
      where: { externalID: externalID1 },
    });
    expect(thread1).toBeNull();

    const message1 = await MessageEntity.findByPk(messageID1);
    expect(message1).toBeNull();

    const thread2 = await ThreadEntity.findOne({
      where: { externalID: externalID2 },
    });
    expect(thread2).toBeDefined();

    const message2 = await MessageEntity.findByPk(messageID2);
    expect(message2).toBeDefined();
  });

  test('thread does not exist', async () => {
    const externalID = 'my-cool-thread';

    const { statusCode, body } = await apiCall()
      .delete(`/v1/threads/${externalID}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(404);
    expect(body.error).toBe('thread_not_found');
  });

  test('wrong app', async () => {
    const { accessToken: altToken } = await setupPlatformTest();

    const externalID = 'my-cool-thread';
    await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, { externalID });

    const { statusCode, body } = await apiCall()
      .delete(`/v1/threads/${externalID}`)
      .set('Authorization', `Bearer ${altToken}`);

    expect(statusCode).toBe(404);
    expect(body.error).toBe('thread_not_found');
  });
});
