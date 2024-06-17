import { Viewer } from 'server/src/auth/index.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';
import {
  addMessageViaGraphQL,
  createThreadViaGraphQL,
  fetchOrCreateThreadByExternalIDViaGraphQL,
} from 'server/src/public/routes/tests/util.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';

let andreiUser: UserEntity;
let viewer: Viewer;
let organization: OrgEntity;
let accessToken: string;

describe('Platform API: DELETE /v1/threads/:threadID/messages/:messageID', () => {
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

  test('delete thread message', async () => {
    const externalID = 'my-cool-thread';
    const { internalID: internalThreadID } =
      await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, {
        externalID: externalID,
      });

    const { messageID: messageID1 } = await addMessageViaGraphQL(viewer, {
      threadID: internalThreadID,
    });
    const { messageID: messageID2 } = await addMessageViaGraphQL(viewer, {
      threadID: internalThreadID,
    });
    expect(await MessageEntity.count()).toBe(2);

    const message1ExternalID = (await MessageEntity.findByPk(messageID1))
      ?.externalID;
    const { statusCode, body } = await apiCall()
      .delete(`/v1/threads/${externalID}/messages/${message1ExternalID}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);

    const message1 = await MessageEntity.findByPk(messageID1);
    expect(message1).toBeNull();
    const message2 = await MessageEntity.findByPk(messageID2);
    expect(message2).toBeDefined();

    const thread = await ThreadEntity.findByPk(internalThreadID);
    expect(thread).toBeDefined();
  });

  test('message does not exist', async () => {
    const threadExternalID = 'my-cool-thread';
    const messageExternalID = 'my-cool-message';
    await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, {
      externalID: threadExternalID,
    });

    const { statusCode, body } = await apiCall()
      .delete(`/v1/threads/${threadExternalID}/messages/${messageExternalID}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(404);
    expect(body.error).toBe('message_not_found');
  });

  test('wrong thread', async () => {
    const threadExternalID = 'my-cool-thread';
    await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, {
      externalID: threadExternalID,
    });

    const { messageID } = await createThreadViaGraphQL(viewer, {});
    const messageExternalID = (await MessageEntity.findByPk(messageID))
      ?.externalID;

    const { statusCode, body } = await apiCall()
      .delete(`/v1/threads/${threadExternalID}/messages/${messageExternalID}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(404);
    expect(body.error).toBe('message_not_found');
  });
});
