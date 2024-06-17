import { Viewer } from 'server/src/auth/index.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import {
  addMessageViaGraphQL,
  fetchOrCreateThreadByExternalIDViaGraphQL,
} from 'server/src/public/routes/tests/util.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';
import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { MessageNodeType } from 'common/types/index.ts';

let viewer: Viewer;
let andreiUser: UserEntity;
let accessToken: string;
let organization: OrgEntity;

describe('Platform API: GET /v1/threads/:threadID/messages/:messageID', () => {
  beforeAll(async () => {
    ({ andreiUser, accessToken, organization } = await setupPlatformTest());

    viewer = await Viewer.createLoggedInPlatformViewer({
      user: andreiUser,
      org: organization,
    });
  });

  beforeEach(async () => {
    await ThreadEntity.truncate({ cascade: true });
  });

  test('can successfully get a message', async () => {
    const externalThreadID = 'my-cool-thread';
    const { internalID: internalThreadID } =
      await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, {
        externalID: externalThreadID,
      });

    expect(await ThreadEntity.count()).toBe(1);

    const { messageID } = await addMessageViaGraphQL(viewer, {
      threadID: internalThreadID,
    });

    const messageExternalID = (await MessageEntity.findByPk(messageID))
      ?.externalID;

    const { statusCode, body } = await apiCall()
      .get(`/v1/threads/${externalThreadID}/messages/${messageExternalID}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);

    expect(body.id).toBe(messageExternalID);
    expect(body.metadata).toStrictEqual({});
  });

  test('convert internal user IDs to external ones in mentions', async () => {
    const externalThreadID = 'my-cool-thread';
    const { internalID: internalThreadID } =
      await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, {
        externalID: externalThreadID,
      });

    expect(await ThreadEntity.count()).toBe(1);

    const { messageID } = await addMessageViaGraphQL(viewer, {
      threadID: internalThreadID,
      content: [
        {
          type: MessageNodeType.PARAGRAPH,
          children: [
            { text: 'Hello ' },
            {
              type: MessageNodeType.MENTION,
              user: { id: andreiUser.externalID },
              children: [{ text: '@Andrei' }],
            },
          ],
        },
      ],
    });

    const messageExternalID = (await MessageEntity.findByPk(messageID))
      ?.externalID;

    const { statusCode, body } = await apiCall()
      .get(`/v1/threads/${externalThreadID}/messages/${messageExternalID}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);

    expect(body.id).toBe(messageExternalID);
    expect(body.content).toStrictEqual([
      {
        type: MessageNodeType.PARAGRAPH,
        children: [
          { text: 'Hello ' },
          {
            type: MessageNodeType.MENTION,
            user: { id: andreiUser.externalID },
            children: [{ text: '@Andrei' }],
          },
        ],
      },
    ]);
  });
});
