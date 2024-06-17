import { MessageNodeType } from 'common/types/index.ts';
import type { MessageContent } from 'common/types/index.ts';
import { Viewer } from 'server/src/auth/index.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';
import { createThreadViaGraphQL } from 'server/src/public/routes/tests/util.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';

let andreiUser: UserEntity;
let viewer: Viewer;
let organization: OrgEntity;
let accessToken: string;

describe('Platform API: POST /v1/threads/:threadID/message/:messageID/append', () => {
  beforeAll(async () => {
    ({ andreiUser, organization, accessToken } = await setupPlatformTest());
    viewer = await Viewer.createLoggedInPlatformViewer({
      user: andreiUser,
      org: organization,
    });
  });

  test('stream update content', async () => {
    const beforeText = 'some markdown **with ';
    const afterText = 'bold marks** included';

    const content: MessageContent = [
      {
        type: MessageNodeType.MARKDOWN,
        children: [{ text: beforeText }],
      },
    ];
    const { messageID, threadID } = await createThreadViaGraphQL(viewer, {
      content: content,
    });
    const message = await MessageEntity.findByPk(messageID);
    const threadExternalID = (await ThreadEntity.findByPk(threadID))
      ?.externalID;

    const { statusCode, body } = await apiCall()
      .post(
        `/v1/threads/${threadExternalID}/messages/${message?.externalID}/append`,
      )
      .send({ text: afterText })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);

    const expectedContent: MessageContent = [
      {
        type: MessageNodeType.MARKDOWN,
        children: [{ text: beforeText + afterText }],
      },
    ];
    const updatedMessage = await MessageEntity.findByPk(messageID);
    expect(updatedMessage?.content).toStrictEqual(expectedContent);
  });

  test('stream api invalid content types', async () => {
    const content: MessageContent = [
      {
        type: MessageNodeType.PARAGRAPH,
        children: [
          {
            text: 'new message',
          },
        ],
      },
    ];
    const { messageID, threadID } = await createThreadViaGraphQL(viewer, {
      content: content,
    });

    const message = await MessageEntity.findByPk(messageID);
    const threadExternalID = (await ThreadEntity.findByPk(threadID))
      ?.externalID;

    const { statusCode, body } = await apiCall()
      .post(
        `/v1/threads/${threadExternalID}/messages/${message?.externalID}/append`,
      )
      .send({ text: 'bold marks** included' })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(400);
    expect(body.error).toBe('message_not_appendable');
  });

  test('stream api invalid too many content types', async () => {
    const content: MessageContent = [
      {
        type: MessageNodeType.MARKDOWN,
        children: [{ text: 'some markdown text' }],
      },
      {
        type: MessageNodeType.PARAGRAPH,
        children: [
          {
            text: 'some message',
          },
        ],
      },
    ];
    const { messageID, threadID } = await createThreadViaGraphQL(viewer, {
      content: content,
    });

    const message = await MessageEntity.findByPk(messageID);
    const threadExternalID = (await ThreadEntity.findByPk(threadID))
      ?.externalID;

    const { statusCode, body } = await apiCall()
      .post(
        `/v1/threads/${threadExternalID}/messages/${message?.externalID}/append`,
      )
      .send({ text: 'bold marks** included' })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(400);
    expect(body.error).toBe('message_not_appendable');
  });
});
