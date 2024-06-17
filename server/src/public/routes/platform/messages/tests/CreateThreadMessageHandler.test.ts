import { v4 as uuid } from 'uuid';
import { AuthProviderType, Viewer } from 'server/src/auth/index.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import {
  createPageAndThread,
  createRandomPlatformOrg,
  createRandomPlatformUserAndOrgMember,
  createUserAndOrgMember,
  fetchOrCreateThreadByExternalIDViaGraphQL,
} from 'server/src/public/routes/tests/util.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';
import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { MessageAttachmentType, MessageNodeType } from 'common/types/index.ts';
import type { MessageFileAttachmentData } from 'server/src/entity/message_attachment/MessageAttachmentEntity.ts';
import { MessageAttachmentEntity } from 'server/src/entity/message_attachment/MessageAttachmentEntity.ts';
import { FileEntity } from 'server/src/entity/file/FileEntity.ts';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { ThreadParticipantMutator } from 'server/src/entity/thread_participant/ThreadParticipantMutator.ts';

let application: ApplicationEntity;
let viewer: Viewer;
let andreiUser: UserEntity;
let accessToken: string;
let organization: OrgEntity;

describe('Platform API: POST /v1/threads/:threadID/messages', () => {
  beforeAll(async () => {
    ({ andreiUser, accessToken, organization, application } =
      await setupPlatformTest());

    viewer = await Viewer.createLoggedInPlatformViewer({
      user: andreiUser,
      org: organization,
    });
  });

  beforeEach(async () => {
    await ThreadEntity.truncate({ cascade: true });
  });

  test('can successfully create a message', async () => {
    const externalThreadID = 'my-cool-thread';
    const { internalID: internalThreadID } =
      await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, {
        externalID: externalThreadID,
      });

    expect(await ThreadEntity.count()).toBe(1);

    const newMessageExternalID = 'my-cool-message';

    const { statusCode, body } = await apiCall()
      .post(`/v1/threads/${externalThreadID}/messages`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: newMessageExternalID,
        authorID: andreiUser.externalID,
        content: [{ type: 'p', children: [{ text: '🐾 Hello Rolo!' }] }],
        metadata: { rolo: 'woof' },
      });

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);

    const createdMessage = await MessageEntity.findOne({
      where: {
        externalID: newMessageExternalID,
        threadID: internalThreadID,
        orgID: organization.id,
      },
    });

    const { metadata } = createdMessage!;

    expect(metadata).toStrictEqual({ rolo: 'woof' });
  });

  test('external IDs are converted to internal in mentions', async () => {
    const externalThreadID = 'my-cool-thread';
    const { internalID: internalThreadID } =
      await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, {
        externalID: externalThreadID,
      });

    expect(await ThreadEntity.count()).toBe(1);

    const newMessageExternalID = 'my-cool-message';

    const { statusCode, body } = await apiCall()
      .post(`/v1/threads/${externalThreadID}/messages`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: newMessageExternalID,
        authorID: andreiUser.externalID,
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

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);

    const createdMessage = await MessageEntity.findOne({
      where: {
        externalID: newMessageExternalID,
        threadID: internalThreadID,
        orgID: organization.id,
      },
    });

    const { content } = createdMessage!;

    expect(content).toStrictEqual([
      {
        type: MessageNodeType.PARAGRAPH,
        children: [
          { text: 'Hello ' },
          {
            type: MessageNodeType.MENTION,
            user: { id: andreiUser.id },
            children: [{ text: '@Andrei' }],
          },
        ],
      },
    ]);
  });

  test('can create message with no ID', async () => {
    const externalThreadID = 'my-cool-thread';
    const { internalID: internalThreadID } =
      await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, {
        externalID: externalThreadID,
      });

    const { statusCode, body } = await apiCall()
      .post(`/v1/threads/${externalThreadID}/messages`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        authorID: andreiUser.externalID,
        content: [{ type: 'p', children: [{ text: '🐾 Hello Rolo!' }] }],
      });

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);

    const createdMessage = await MessageEntity.findOne({
      where: {
        threadID: internalThreadID,
        orgID: organization.id,
      },
    });

    expect(body.messageID).toBe(createdMessage?.externalID);
  });

  test('creating message subscribes user', async () => {
    const externalThreadID = 'my-cool-thread';
    const { internalID: internalThreadID } =
      await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, {
        externalID: externalThreadID,
      });

    expect(await ThreadEntity.count()).toBe(1);
    const thread = await ThreadEntity.findByPk(internalThreadID);
    expect(thread).toBeDefined();
    await new ThreadParticipantMutator(viewer, null).setViewerSubscribed(
      thread!,
      false,
    );

    let { statusCode, body } = await apiCall()
      .get(`/v1/threads/${externalThreadID}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(statusCode).toBe(200);
    expect(body.subscribers).toEqual([]);

    const newMessageExternalID = 'my-cool-message';

    ({ statusCode, body } = await apiCall()
      .post(`/v1/threads/${externalThreadID}/messages`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: newMessageExternalID,
        authorID: andreiUser.externalID,
        content: [{ type: 'p', children: [{ text: '🐾 Hello Rolo!' }] }],
        metadata: { rolo: 'woof' },
      }));

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);

    ({ statusCode, body } = await apiCall()
      .get(`/v1/threads/${externalThreadID}`)
      .set('Authorization', `Bearer ${accessToken}`));
    expect(statusCode).toBe(200);
    expect(body.subscribers).toEqual([andreiUser.externalID]);
  });

  test('can disable subscribing user', async () => {
    const externalThreadID = 'my-cool-thread';
    const { internalID: internalThreadID } =
      await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, {
        externalID: externalThreadID,
      });

    expect(await ThreadEntity.count()).toBe(1);
    const thread = await ThreadEntity.findByPk(internalThreadID);
    expect(thread).toBeDefined();
    await new ThreadParticipantMutator(viewer, null).setViewerSubscribed(
      thread!,
      false,
    );

    let { statusCode, body } = await apiCall()
      .get(`/v1/threads/${externalThreadID}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(statusCode).toBe(200);
    expect(body.subscribers).toEqual([]);

    const newMessageExternalID = 'my-cool-message';

    ({ statusCode, body } = await apiCall()
      .post(`/v1/threads/${externalThreadID}/messages`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: newMessageExternalID,
        authorID: andreiUser.externalID,
        content: [{ type: 'p', children: [{ text: '🐾 Hello Rolo!' }] }],
        metadata: { rolo: 'woof' },
        subscribeToThread: false,
      }));

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);

    ({ statusCode, body } = await apiCall()
      .get(`/v1/threads/${externalThreadID}`)
      .set('Authorization', `Bearer ${accessToken}`));
    expect(statusCode).toBe(200);
    expect(body.subscribers).toEqual([]);
  });

  describe('attaching a file', () => {
    test('success', async () => {
      const externalThreadID = 'my-cool-thread';
      const newMessageExternalID = 'message-with-attachment';

      const { internalID: internalThreadID } =
        await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, {
          externalID: externalThreadID,
        });

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
        .post(`/v1/threads/${externalThreadID}/messages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          id: newMessageExternalID,
          authorID: andreiUser.externalID,
          content: [{ type: 'p', children: [{ text: '🐾 Hello Rolo!' }] }],
          addAttachments: [{ type: 'file', id: file.id }],
        });

      expect(statusCode).toBe(200);
      expect(body.success).toBe(true);

      const createdMessage = await MessageEntity.findOne({
        where: {
          externalID: newMessageExternalID,
          threadID: internalThreadID,
          orgID: organization.id,
        },
      });

      expect(createdMessage).toBeDefined();

      const attachments = await MessageAttachmentEntity.findAll({
        where: {
          messageID: createdMessage!.id,
        },
      });

      expect(attachments).toHaveLength(1);
      expect(attachments[0].type).toBe(MessageAttachmentType.FILE);
      expect((attachments[0].data as MessageFileAttachmentData).fileID).toBe(
        file.id,
      );
    });

    test('wrong owner', async () => {
      const flooeyUser = await createUserAndOrgMember({
        name: 'flooey',
        externalID: 'flooey',
        appID: viewer.platformApplicationID!,
        email: 'flooey@flooey.org',
        orgID: organization.id,
        externalProvider: AuthProviderType.PLATFORM,
      });

      const externalThreadID = 'my-cool-thread';
      const newMessageExternalID = 'message-with-attachment';

      await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, {
        externalID: externalThreadID,
      });

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
        .post(`/v1/threads/${externalThreadID}/messages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          id: newMessageExternalID,
          authorID: andreiUser.externalID,
          content: [{ type: 'p', children: [{ text: '🐾 Hello Rolo!' }] }],
          addAttachments: [{ type: 'file', id: file.id }],
        });

      expect(statusCode).toBe(403);
      expect(body.error).toBe('file_belongs_to_different_user');
    });

    test('cannot attach a file multiple times', async () => {
      const externalThreadID = 'my-cool-thread';
      const newMessageExternalID = 'message-with-attachment';

      await fetchOrCreateThreadByExternalIDViaGraphQL(viewer, {
        externalID: externalThreadID,
      });

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
        .post(`/v1/threads/${externalThreadID}/messages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          id: newMessageExternalID,
          authorID: andreiUser.externalID,
          content: [{ type: 'p', children: [{ text: '🐾 Hello Rolo!' }] }],
          addAttachments: [
            { type: 'file', id: file.id },
            { type: 'file', id: file.id },
          ],
        });

      expect(statusCode).toBe(400);
      expect(body.error).toBe('invalid_field');
    });
  });

  describe('Unsuccessful creation of thread and message', () => {
    test('Create thread without specifying org', async () => {
      const externalThreadID = 'my-cool-new-thread';
      const threadExist = await ThreadEntity.findOne({
        where: { externalID: externalThreadID },
      });

      expect(threadExist).toBeNull();

      const { statusCode, body } = await apiCall()
        .post(`/v1/threads/${externalThreadID}/messages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          authorID: andreiUser.externalID,
          content: [{ type: 'p', children: [{ text: '🐾 Hello Rolo!' }] }],
          metadata: { rolo: 'woof' },
          createThread: {
            name: 'using org ID',
            url: 'https://local.cord.com:8179/sdk/test/index.html',
            location: {
              page: 'testbed',
            },
          },
        });

      expect(statusCode).toBe(400);
      expect(body.error).toBe('invalid_request');
    });

    test('Create thread in org author is not in', async () => {
      const externalThreadID = 'my-cool-new-thread';
      const threadExist = await ThreadEntity.findOne({
        where: { externalID: externalThreadID },
      });

      expect(threadExist).toBeNull();

      const randomOrg = await createRandomPlatformOrg(application.id);

      const { statusCode, body } = await apiCall()
        .post(`/v1/threads/${externalThreadID}/messages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          authorID: andreiUser.externalID,
          content: [{ type: 'p', children: [{ text: '🐾 Hello Rolo!' }] }],
          metadata: { rolo: 'woof' },
          createThread: {
            name: 'using org ID',
            url: 'https://local.cord.com:8179/sdk/test/index.html',
            location: {
              page: 'testbed',
            },
            organizationID: randomOrg.externalID,
          },
        });

      expect(statusCode).toBe(400);
      expect(body.error).toBe('invalid_request');
    });

    test('Create message in thread author cannot see', async () => {
      const { thread } = await createPageAndThread(viewer, application.id, {});

      const randomOrg = await createRandomPlatformOrg(application.id);
      const randomUser = await createRandomPlatformUserAndOrgMember(
        application.id,
        randomOrg.id,
      );

      const { statusCode, body } = await apiCall()
        .post(`/v1/threads/${thread.externalID}/messages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          authorID: randomUser.externalID,
          content: [{ type: 'p', children: [{ text: '🐾 Hello Rolo!' }] }],
          metadata: { rolo: 'woof' },
        });

      expect(statusCode).toBe(400);
      expect(body.error).toBe('invalid_request');
    });
  });

  test('Successfully creating a new thread and a message using organizationID', async () => {
    const externalThreadID = 'my-cool-new-thread';
    const threadExist = await ThreadEntity.findOne({
      where: { externalID: externalThreadID },
    });

    expect(threadExist).toBeNull();

    const { statusCode, body } = await apiCall()
      .post(`/v1/threads/${externalThreadID}/messages`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        authorID: andreiUser.externalID,
        content: [{ type: 'p', children: [{ text: '🐾 Hello Rolo!' }] }],
        metadata: { rolo: 'woof' },
        createThread: {
          name: 'using org ID',
          url: 'https://local.cord.com:8179/sdk/test/index.html',
          location: {
            page: 'testbed',
          },
          organizationID: 'cord',
        },
      });

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);

    const createdThread = await ThreadEntity.findOne({
      where: { externalID: externalThreadID },
    });

    expect(createdThread?.externalID).toBe(externalThreadID);

    const createdMessageID = body.messageID;

    const createdMessage = await MessageEntity.findOne({
      where: {
        externalID: createdMessageID,
        threadID: createdThread?.id,
        orgID: organization.id,
      },
    });

    expect(createdMessage?.threadID).toBe(createdThread?.id);
  });

  test('Successfully creating a new thread and a message using groupID', async () => {
    const externalThreadID = 'my-cool-new-thread';
    const threadExist = await ThreadEntity.findOne({
      where: { externalID: externalThreadID },
    });

    expect(threadExist).toBeNull();

    const { statusCode, body } = await apiCall()
      .post(`/v1/threads/${externalThreadID}/messages`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        authorID: andreiUser.externalID,
        content: [{ type: 'p', children: [{ text: '🐾 Hello Rolo!' }] }],
        metadata: { rolo: 'woof' },
        createThread: {
          name: 'using org ID',
          url: 'https://local.cord.com:8179/sdk/test/index.html',
          location: {
            page: 'testbed',
          },
          groupID: 'cord',
        },
      });

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);

    const createdThread = await ThreadEntity.findOne({
      where: { externalID: externalThreadID },
    });

    expect(createdThread?.externalID).toBe(externalThreadID);

    const createdMessageID = body.messageID;

    const createdMessage = await MessageEntity.findOne({
      where: {
        externalID: createdMessageID,
        threadID: createdThread?.id,
        orgID: organization.id,
      },
    });

    expect(createdMessage?.threadID).toBe(createdThread?.id);
  });
});
