import * as jsonwebtoken from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';

import { Viewer, AuthProviderType } from 'server/src/auth/index.ts';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import {
  createPageAndThread,
  createPlatformApplication,
  createRandomPlatformOrg,
  createUserAndOrgMember,
  addMessage,
  createRandomSlackOrg,
} from 'server/src/public/routes/tests/util.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { MessageAttachmentEntity } from 'server/src/entity/message_attachment/MessageAttachmentEntity.ts';
import { MessageAttachmentType } from 'common/types/index.ts';
import { FileEntity } from 'server/src/entity/file/FileEntity.ts';
import { MessageEntity } from 'server/src/entity/message/MessageEntity.ts';
import { LinkedUsersEntity } from 'server/src/entity/linked_users/LinkedUsersEntity.ts';
import { LinkedOrgsEntity } from 'server/src/entity/linked_orgs/LinkedOrgsEntity.ts';

describe('Platform delete user and data API: /v1/users/:userID', () => {
  let newApp: ApplicationEntity;
  const APP_SECRET = 'eggs';

  beforeAll(async () => {
    newApp = await createPlatformApplication('Bake Club', APP_SECRET);
  });

  describe('Authorized access to api route', () => {
    let userToBeDeleted: UserEntity;
    let viewerToBeDeleted: Viewer;
    let dummyUser: UserEntity;
    let dummyViewer: Viewer;
    let newOrg: OrgEntity;
    const ORG_1_EXTERNAL_ID = 'cake';
    const ORG_2_EXTERNAL_ID = 'bread';
    const USER_EXTERNAL_ID = 'red-velvet';
    const USER_EMAIL = 'red.velvet@cord.com';
    beforeAll(async () => {
      newOrg = await createRandomPlatformOrg(newApp.id, ORG_1_EXTERNAL_ID);

      dummyUser = await createUserAndOrgMember({
        name: 'Carrot',
        externalID: 'carrot-cake',
        email: 'carrot.cake@cord.com',
        orgID: newOrg.id,
        externalProvider: AuthProviderType.PLATFORM,
        appID: newApp.id,
      });

      dummyViewer = await Viewer.createLoggedInPlatformViewer({
        user: dummyUser,
        org: newOrg,
      });
    });

    beforeEach(async () => {
      userToBeDeleted = await createUserAndOrgMember({
        name: 'Red',
        externalID: USER_EXTERNAL_ID,
        email: USER_EMAIL,
        orgID: newOrg.id,
        externalProvider: AuthProviderType.PLATFORM,
        appID: newApp.id,
      });

      viewerToBeDeleted = await Viewer.createLoggedInPlatformViewer({
        user: userToBeDeleted,
        org: newOrg,
      });
    });

    test('UserID does not exist', async () => {
      const UNKNOWN_USER_EXTERNAL_ID = 'victoria';
      const { statusCode, body } = await apiCall()
        .delete(`/v1/users/${UNKNOWN_USER_EXTERNAL_ID}`)
        .set(
          'Authorization',
          `Bearer ${jsonwebtoken.sign(
            {
              app_id: newApp.id,
            },
            APP_SECRET,
            { algorithm: 'HS512' },
          )}`,
        )
        .send({ permanently_delete: true });
      expect(statusCode).toBe(401);
      expect(body).toMatchObject({
        error: 'invalid_user_id',
        message: `Invalid user id: ${UNKNOWN_USER_EXTERNAL_ID}.`,
      });
    });

    test('Email passed does not correspond to user id', async () => {
      const UNKNOWN_USER_EXTERNAL_ID = 'victoria';
      const { statusCode } = await apiCall()
        .delete(`/v1/users/${UNKNOWN_USER_EXTERNAL_ID}`)
        .set(
          'Authorization',
          `Bearer ${jsonwebtoken.sign(
            {
              app_id: newApp.id,
            },
            APP_SECRET,
            { algorithm: 'HS512' },
          )}`,
        );
      expect(statusCode).toBe(400);
    });

    test('Successfully delete a user in multiple orgs', async () => {
      const anotherOrg = await createRandomPlatformOrg(
        newApp.id,
        ORG_2_EXTERNAL_ID,
      );

      await OrgMembersEntity.upsert({
        userID: userToBeDeleted.id,
        orgID: anotherOrg.id,
      });

      const { statusCode, body } = await apiCall()
        .delete(`/v1/users/${USER_EXTERNAL_ID}`)
        .set(
          'Authorization',
          `Bearer ${jsonwebtoken.sign(
            {
              app_id: newApp.id,
            },
            APP_SECRET,
            { algorithm: 'HS512' },
          )}`,
        )
        .send({ permanently_delete: true });

      const users = await UserEntity.findAll({
        where: {
          externalID: USER_EXTERNAL_ID,
          platformApplicationID: newApp.id,
        },
      });

      const orgMembers = await OrgMembersEntity.findAll({
        where: { userID: userToBeDeleted.id },
      });
      expect(users.length).toEqual(0);
      expect(orgMembers.length).toEqual(0);
      expect(statusCode).toBe(200);
      expect(body).toMatchObject({
        success: true,
        message: `User deleted.`,
        userID: USER_EXTERNAL_ID,
      });
    });

    test('Successfully delete a user and user messages', async () => {
      const threadID = uuid();
      const firstMessageToBeDeletedID = uuid();

      await getSequelize().transaction(async (transaction) => {
        const { thread } = await createPageAndThread(dummyViewer, newApp.id, {
          threadURL: 'https://cake.com/recipes',
          location: { page: 'https://cake.com/recipes' },
          threadID,
          transaction,
          externalID: 'recipes',
        });

        await addMessage({ thread, viewer: dummyViewer, transaction });
        await addMessage({
          thread,
          viewer: viewerToBeDeleted,
          transaction,
          messageID: firstMessageToBeDeletedID,
        });
        await MessageAttachmentEntity.create(
          {
            id: uuid(),
            messageID: firstMessageToBeDeletedID,
            type: MessageAttachmentType.ANNOTATION,
            data: { fileID: 'test' },
          },
          { transaction },
        );
        await FileEntity.create(
          {
            id: uuid(),
            userID: viewerToBeDeleted.userID!,
            platformApplicationID: viewerToBeDeleted.platformApplicationID!,
            mimeType: 'image/png',
            name: 'annotation.png',
            size: 12345,
            uploadStatus: 'uploaded',
          },
          { transaction },
        );
        await addMessage({ thread, viewer: dummyViewer, transaction });
        await addMessage({
          thread,
          viewer: viewerToBeDeleted,
          transaction,
        });
      });

      const messagesInThread = await MessageEntity.findAll({
        where: {
          orgID: dummyViewer.orgID,
          threadID: threadID,
        },
      });

      expect(messagesInThread.length).toEqual(4);

      const { statusCode, body } = await apiCall()
        .delete(`/v1/users/${USER_EXTERNAL_ID}`)
        .set(
          'Authorization',
          `Bearer ${jsonwebtoken.sign(
            {
              app_id: newApp.id,
            },
            APP_SECRET,
            { algorithm: 'HS512' },
          )}`,
        )
        .send({ permanently_delete: true });

      const [
        user,
        orgMembers,
        messagesInThreadAfterUserDeleted,
        messagesByDeletedUser,
        messageAttachment,
        files,
      ] = await Promise.all([
        UserEntity.findAll({
          where: {
            externalID: USER_EXTERNAL_ID,
            platformApplicationID: newApp.id,
          },
        }),
        OrgMembersEntity.findAll({
          where: { userID: userToBeDeleted.id },
        }),
        MessageEntity.findAll({
          where: {
            orgID: dummyViewer.orgID,
            threadID: threadID,
          },
        }),
        MessageEntity.findAll({
          where: {
            sourceID: viewerToBeDeleted.userID,
          },
        }),
        MessageAttachmentEntity.findOne({
          where: {
            messageID: firstMessageToBeDeletedID,
          },
        }),
        FileEntity.findAll({
          where: {
            userID: viewerToBeDeleted.userID,
          },
        }),
      ]);

      expect(user.length).toEqual(0);
      expect(orgMembers.length).toEqual(0);
      expect(messagesInThreadAfterUserDeleted.length).toEqual(2);
      expect(messagesByDeletedUser.length).toEqual(0);
      expect(messageAttachment).toBeNull();
      expect(files.length).toBe(0);
      expect(statusCode).toBe(200);
      expect(body).toMatchObject({
        success: true,
        message: `User deleted.`,
        userID: USER_EXTERNAL_ID,
      });
    });

    test('Successfully delete a user that is linked to a slack user and user messages', async () => {
      const slackOrg = await createRandomSlackOrg('icing', 'icing', 'active');

      const slackUser = await createUserAndOrgMember({
        name: 'Royal',
        externalID: 'royal',
        email: 'royal.icing@cord.com',
        orgID: slackOrg.id,
        externalProvider: AuthProviderType.SLACK,
      });

      // linking orgs to slack
      await LinkedOrgsEntity.create({
        sourceOrgID: newOrg.id,
        sourceExternalProvider: AuthProviderType.PLATFORM,
        linkedOrgID: slackOrg.id,
        linkedExternalProvider: AuthProviderType.SLACK,
        mergerUserID: userToBeDeleted.id,
      });

      await LinkedUsersEntity.upsert({
        sourceUserID: userToBeDeleted.id,
        sourceOrgID: newOrg.id,
        linkedUserID: slackUser.id,
        linkedOrgID: slackOrg.id,
      });

      const threadID = uuid();

      await getSequelize().transaction(async (transaction) => {
        const { thread } = await createPageAndThread(dummyViewer, newApp.id, {
          threadURL: 'https://cake.com/ovens',
          location: { page: 'https://cake.com/ovens' },
          threadID,
          transaction,
          externalID: 'ovens',
        });

        // Creating slack viewer that mocks a reply from slack
        const slackViewer = Viewer.createLoggedInViewer(
          slackUser.id,
          thread.orgID,
        );

        await addMessage({ thread, viewer: dummyViewer, transaction });
        await addMessage({ thread, viewer: viewerToBeDeleted, transaction });
        await addMessage({ thread, viewer: dummyViewer, transaction });
        await addMessage({ thread, viewer: slackViewer, transaction });
      });

      const messagesInThread = await MessageEntity.findAll({
        where: {
          orgID: dummyViewer.orgID,
          threadID: threadID,
        },
      });

      expect(messagesInThread.length).toEqual(4);

      const { statusCode, body } = await apiCall()
        .delete(`/v1/users/${USER_EXTERNAL_ID}`)
        .set(
          'Authorization',
          `Bearer ${jsonwebtoken.sign(
            {
              app_id: newApp.id,
            },
            APP_SECRET,
            { algorithm: 'HS512' },
          )}`,
        )
        .send({ permanently_delete: true });

      const [
        user,
        orgMembers,
        messagesInThreadAfterUserDeleted,
        messagesByDeletedUser,
        linkedOrgEntity,
        linkedUserEntities,
      ] = await Promise.all([
        UserEntity.findAll({
          where: {
            externalID: USER_EXTERNAL_ID,
            platformApplicationID: newApp.id,
          },
        }),
        OrgMembersEntity.findAll({
          where: { userID: userToBeDeleted.id },
        }),
        MessageEntity.findAll({
          where: {
            orgID: dummyViewer.orgID,
            threadID: threadID,
          },
        }),
        MessageEntity.findAll({
          where: {
            sourceID: viewerToBeDeleted.userID,
          },
        }),
        LinkedOrgsEntity.findOne({
          where: {
            sourceOrgID: newOrg.id,
            linkedOrgID: slackOrg.id,
          },
        }),
        LinkedUsersEntity.findAll({
          where: {
            sourceUserID: viewerToBeDeleted.userID,
            linkedUserID: slackUser.id,
          },
        }),
      ]);

      expect(user.length).toEqual(0);
      expect(orgMembers.length).toEqual(0);
      expect(messagesInThreadAfterUserDeleted.length).toEqual(2);
      expect(messagesByDeletedUser.length).toEqual(0);
      expect(linkedOrgEntity).toEqual(expect.anything());
      expect(linkedOrgEntity?.mergerUserID).toBe(null);
      expect(linkedUserEntities.length).toBe(0);
      expect(statusCode).toBe(200);
      expect(body).toMatchObject({
        success: true,
        message: `User deleted.`,
        userID: USER_EXTERNAL_ID,
      });
    });
  });
});
