import { v4 as uuid } from 'uuid';
import { MessageAttachmentType } from 'common/types/index.ts';
import type { MessageContent } from 'common/types/index.ts';
import { AuthProviderType, Viewer } from 'server/src/auth/index.ts';
import { FileEntity } from 'server/src/entity/file/FileEntity.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { internalizeContent } from 'server/src/public/routes/platform/messages/util.ts';
import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';
import {
  createThreadViaGraphQL,
  createUserAndOrgMember,
  fetchOrCreateThreadByExternalIDViaGraphQL,
} from 'server/src/public/routes/tests/util.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';
import type { MessageFileAttachmentData } from 'server/src/entity/message_attachment/MessageAttachmentEntity.ts';
import { MessageAttachmentEntity } from 'server/src/entity/message_attachment/MessageAttachmentEntity.ts';

let andreiUser: UserEntity;
let viewer: Viewer;
let organization: OrgEntity;
let otherOrganization: OrgEntity;
let accessToken: string;

describe('Platform API: PUT /v1/threads/:threadID/messages/:messageID', () => {
  beforeAll(async () => {
    ({ andreiUser, organization, accessToken, otherOrganization } =
      await setupPlatformTest());
    viewer = await Viewer.createLoggedInPlatformViewer({
      user: andreiUser,
      org: organization,
    });
  });

  test('update externalID', async () => {
    const { messageID, threadID } = await createThreadViaGraphQL(viewer, {});
    const threadExternalID = (await ThreadEntity.findByPk(threadID))
      ?.externalID;
    const messageExternalID = (await MessageEntity.findByPk(messageID))
      ?.externalID;

    const newExternalID = 'my-cool-message';
    const { statusCode, body } = await apiCall()
      .put(`/v1/threads/${threadExternalID}/messages/${messageExternalID}`)
      .send({ id: newExternalID })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);

    expect(
      await MessageEntity.findOne({ where: { externalID: messageExternalID } }),
    ).toBeNull();
    expect(
      await MessageEntity.findOne({
        where: { externalID: newExternalID },
      }),
    ).toBeDefined();
  });

  test('update deletedTimestamp', async () => {
    const { messageID, threadID } = await createThreadViaGraphQL(viewer, {});
    const messageExternalID = (await MessageEntity.findByPk(messageID))
      ?.externalID;
    const threadExternalID = (await ThreadEntity.findByPk(threadID))
      ?.externalID;
    const deletedTimestamp = new Date('20 April 2020');

    const { statusCode, body } = await apiCall()
      .put(`/v1/threads/${threadExternalID}/messages/${messageExternalID}`)
      .send({ deletedTimestamp: deletedTimestamp.toISOString() })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);

    const message = await MessageEntity.findByPk(messageID);
    expect(message?.deletedTimestamp).toStrictEqual(deletedTimestamp);

    // deletedTimestamp always takes priority
    const { statusCode: statusCode1, body: body1 } = await apiCall()
      .put(`/v1/threads/${threadExternalID}/messages/${messageExternalID}`)
      .send({
        deletedTimestamp: deletedTimestamp.toISOString(),
        deleted: false,
      })
      .set('Authorization', `Bearer ${accessToken}`);
    expect(statusCode1).toBe(200);
    expect(body1.success).toBe(true);

    const message1 = await MessageEntity.findByPk(messageID);
    expect(message1?.deletedTimestamp).toStrictEqual(deletedTimestamp);

    const { statusCode: statusCode2, body: body2 } = await apiCall()
      .put(`/v1/threads/${threadExternalID}/messages/${messageExternalID}`)
      .send({
        deletedTimestamp: null,
        deleted: true,
      })
      .set('Authorization', `Bearer ${accessToken}`);
    expect(statusCode2).toBe(200);
    expect(body2.success).toBe(true);

    const message2 = await MessageEntity.findByPk(messageID);
    expect(message2?.deletedTimestamp).toBeNull();
  });

  test('update deleted', async () => {
    const { messageID, threadID } = await createThreadViaGraphQL(viewer, {});
    const messageExternalID = (await MessageEntity.findByPk(messageID))
      ?.externalID;
    const threadExternalID = (await ThreadEntity.findByPk(threadID))
      ?.externalID;

    const { statusCode, body } = await apiCall()
      .put(`/v1/threads/${threadExternalID}/messages/${messageExternalID}`)
      .send({ deleted: true })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);

    const message = await MessageEntity.findByPk(messageID);
    expect(message?.deletedTimestamp).toBeDefined();
    expect(message?.deletedTimestamp).not.toBeNull();

    // Restore message
    const { statusCode: statusCode1, body: body1 } = await apiCall()
      .put(`/v1/threads/${threadExternalID}/messages/${messageExternalID}`)
      .send({ deleted: false })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode1).toBe(200);
    expect(body1.success).toBe(true);

    const message1 = await MessageEntity.findByPk(messageID);

    expect(message1?.deletedTimestamp).toBeNull();
  });

  test('update content', async () => {
    const content = [
      {
        type: 'p',
        children: [
          {
            text: 'new message',
          },
          {
            type: 'mention',
            user: {
              id: andreiUser.externalID,
            },
            children: [
              {
                text: '@AndreiUser',
              },
            ],
          },
        ],
      },
    ];
    const { messageID, threadID } = await createThreadViaGraphQL(viewer, {});
    const message = await MessageEntity.findByPk(messageID);
    const threadExternalID = (await ThreadEntity.findByPk(threadID))
      ?.externalID;

    const { statusCode, body } = await apiCall()
      .put(`/v1/threads/${threadExternalID}/messages/${message?.externalID}`)
      .send({ content })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);

    const updatedMessage = await MessageEntity.findByPk(messageID);
    expect(updatedMessage?.content).toStrictEqual(
      await internalizeContent(
        content as MessageContent,
        andreiUser.platformApplicationID!,
        message!.orgID,
      ),
    );
    expect(updatedMessage?.lastUpdatedTimestamp).not.toBeNull();
    expect(updatedMessage?.lastUpdatedTimestamp).not.toBeUndefined();
  });

  test('wrong app', async () => {
    const { accessToken: altToken } = await setupPlatformTest();
    const { messageID, threadID } = await createThreadViaGraphQL(viewer, {});
    const messageExternalID = (await MessageEntity.findByPk(messageID))
      ?.externalID;
    const threadExternalID = (await ThreadEntity.findByPk(threadID))
      ?.externalID;

    const { statusCode, body } = await apiCall()
      .put(`/v1/threads/${threadExternalID}/messages/${messageExternalID}`)
      .send({ deleted: true })
      .set('Authorization', `Bearer ${altToken}`);

    expect(statusCode).toBe(404);
    expect(body.error).toBe('thread_not_found');
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
      .put(`/v1/threads/${threadExternalID}/messages/${messageExternalID}`)
      .send({ deleted: true })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(404);
    expect(body.error).toBe('message_not_found');
  });

  test('attaching and removing a file - success', async () => {
    const { messageID, threadID } = await createThreadViaGraphQL(viewer, {});
    const messageExternalID = (await MessageEntity.findByPk(messageID))
      ?.externalID;
    const threadExternalID = (await ThreadEntity.findByPk(threadID))
      ?.externalID;

    const file = await FileEntity.create({
      id: uuid(),
      userID: andreiUser.id,
      platformApplicationID: viewer.platformApplicationID!,
      name: 'rolo2.png',
      mimeType: 'image/png',
      size: 12345,
      timestamp: new Date(),
      uploadStatus: 'uploaded',
    });

    const { statusCode, body } = await apiCall()
      .put(`/v1/threads/${threadExternalID}/messages/${messageExternalID}`)
      .send({ addAttachments: [{ type: 'file', id: file.id }] })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);

    let attachments = await MessageAttachmentEntity.findAll({
      where: {
        messageID,
      },
    });

    expect(attachments).toHaveLength(1);
    expect(attachments[0].type).toBe(MessageAttachmentType.FILE);
    expect((attachments[0].data as MessageFileAttachmentData).fileID).toBe(
      file.id,
    );

    const { statusCode: removeStatus, body: removeBody } = await apiCall()
      .put(`/v1/threads/${threadExternalID}/messages/${messageExternalID}`)
      .send({ removeAttachments: [{ type: 'file', id: file.id }] })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(removeStatus).toBe(200);
    expect(removeBody.success).toBe(true);

    attachments = await MessageAttachmentEntity.findAll({
      where: {
        messageID,
      },
    });

    expect(attachments).toHaveLength(0);
    const updatedMessage = await MessageEntity.findByPk(messageID);
    expect(updatedMessage?.lastUpdatedTimestamp).toBeNull();
  });

  test('attaching a file - wrong owner', async () => {
    const flooeyUser = await createUserAndOrgMember({
      name: 'flooey',
      externalID: 'flooey',
      appID: viewer.platformApplicationID!,
      email: 'flooey@flooey.org',
      orgID: organization.id,
      externalProvider: AuthProviderType.PLATFORM,
    });

    const { messageID, threadID } = await createThreadViaGraphQL(viewer, {});
    const messageExternalID = (await MessageEntity.findByPk(messageID))
      ?.externalID;
    const threadExternalID = (await ThreadEntity.findByPk(threadID))
      ?.externalID;

    const file = await FileEntity.create({
      id: uuid(),
      userID: flooeyUser.id,
      platformApplicationID: viewer.platformApplicationID!,
      name: 'rolo2.png',
      mimeType: 'image/png',
      size: 12345,
      timestamp: new Date(),
      uploadStatus: 'uploaded',
    });

    const { statusCode, body } = await apiCall()
      .put(`/v1/threads/${threadExternalID}/messages/${messageExternalID}`)
      .send({ addAttachments: [{ type: 'file', id: file.id }] })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(403);
    expect(body.error).toBe('file_belongs_to_different_user');
  });

  test('add and remove the same file', async () => {
    const { messageID, threadID } = await createThreadViaGraphQL(viewer, {});
    const messageExternalID = (await MessageEntity.findByPk(messageID))
      ?.externalID;
    const threadExternalID = (await ThreadEntity.findByPk(threadID))
      ?.externalID;

    const file = await FileEntity.create({
      id: uuid(),
      userID: andreiUser.id,
      platformApplicationID: viewer.platformApplicationID!,
      name: 'rolo2.png',
      mimeType: 'image/png',
      size: 12345,
      timestamp: new Date(),
      uploadStatus: 'uploaded',
    });

    const { statusCode, body } = await apiCall()
      .put(`/v1/threads/${threadExternalID}/messages/${messageExternalID}`)
      .send({
        addAttachments: [{ type: 'file', id: file.id }],
        removeAttachments: [{ type: 'file', id: file.id }],
      })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(400);
    expect(body.error).toBe('invalid_field');
  });

  test('attaching a file - cannot attach a file multiple times', async () => {
    const { messageID, threadID } = await createThreadViaGraphQL(viewer, {});
    const messageExternalID = (await MessageEntity.findByPk(messageID))
      ?.externalID;
    const threadExternalID = (await ThreadEntity.findByPk(threadID))
      ?.externalID;

    const file = await FileEntity.create({
      id: uuid(),
      userID: andreiUser.id,
      platformApplicationID: viewer.platformApplicationID!,
      name: 'rolo2.png',
      mimeType: 'image/png',
      size: 12345,
      timestamp: new Date(),
      uploadStatus: 'uploaded',
    });

    const { statusCode, body } = await apiCall()
      .put(`/v1/threads/${threadExternalID}/messages/${messageExternalID}`)
      .send({
        addAttachments: [
          { type: 'file', id: file.id },
          { type: 'file', id: file.id },
        ],
      })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(400);
    expect(body.error).toBe('invalid_field');
  });

  test('attaching a file - cannot attach an already-attached file', async () => {
    const { messageID, threadID } = await createThreadViaGraphQL(viewer, {});
    const messageExternalID = (await MessageEntity.findByPk(messageID))
      ?.externalID;
    const threadExternalID = (await ThreadEntity.findByPk(threadID))
      ?.externalID;

    const file = await FileEntity.create({
      id: uuid(),
      userID: andreiUser.id,
      platformApplicationID: viewer.platformApplicationID!,
      name: 'rolo2.png',
      mimeType: 'image/png',
      size: 12345,
      timestamp: new Date(),
      uploadStatus: 'uploaded',
    });

    const { statusCode, body } = await apiCall()
      .put(`/v1/threads/${threadExternalID}/messages/${messageExternalID}`)
      .send({ addAttachments: [{ type: 'file', id: file.id }] })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);

    const { statusCode: secondStatusCode, body: secondBody } = await apiCall()
      .put(`/v1/threads/${threadExternalID}/messages/${messageExternalID}`)
      .send({ addAttachments: [{ type: 'file', id: file.id }] })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(secondStatusCode).toBe(400);
    expect(secondBody.error).toBe('invalid_field');
  });

  test('adding a reaction - should not update `lastUpdatedTimestamp`', async () => {
    const { messageID, threadID } = await createThreadViaGraphQL(viewer, {});
    const messageExternalID = (await MessageEntity.findByPk(messageID))
      ?.externalID;
    const threadExternalID = (await ThreadEntity.findByPk(threadID))
      ?.externalID;

    const { statusCode, body } = await apiCall()
      .put(`/v1/threads/${threadExternalID}/messages/${messageExternalID}`)
      .send({
        addReactions: [{ userID: andreiUser.externalID, reaction: 'rolo' }],
      })
      .set('Authorization', `Bearer ${accessToken}`);

    const updatedMessage = await MessageEntity.findByPk(messageID);
    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(updatedMessage?.lastUpdatedTimestamp).toBeNull();
  });
});

describe('Platform API: PUT /v1/threads/:threadID', () => {
  beforeAll(async () => {
    ({ andreiUser, organization, accessToken, otherOrganization } =
      await setupPlatformTest());
    viewer = await Viewer.createLoggedInPlatformViewer({
      user: andreiUser,
      org: organization,
    });
  });

  test('update organizationID', async () => {
    const { threadID } = await createThreadViaGraphQL(viewer, {});
    const threadExternalID = (await ThreadEntity.findByPk(threadID))
      ?.externalID;

    const { statusCode, body } = await apiCall()
      .put(`/v1/threads/${threadExternalID}`)
      .send({ organizationID: otherOrganization.externalID })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);

    const updatedThread = await ThreadEntity.findByPk(threadID);

    expect(updatedThread?.orgID).toBe(otherOrganization.id);
  });

  test('update groupID', async () => {
    const { threadID } = await createThreadViaGraphQL(viewer, {});
    const threadExternalID = (await ThreadEntity.findByPk(threadID))
      ?.externalID;

    const { statusCode, body } = await apiCall()
      .put(`/v1/threads/${threadExternalID}`)
      .send({ groupID: otherOrganization.externalID })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);

    const updatedThread = await ThreadEntity.findByPk(threadID);

    expect(updatedThread?.orgID).toBe(otherOrganization.id);
  });
});
