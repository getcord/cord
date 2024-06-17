import type { CoreNotificationData } from '@cord-sdk/types';
import { externalizeID } from 'common/util/externalIDs.ts';

import { Viewer } from 'server/src/auth/index.ts';
import { NotificationEntity } from 'server/src/entity/notification/NotificationEntity.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';
import {
  addMessageViaGraphQL,
  createRandomPlatformUserAndOrgMember,
  createThreadViaGraphQL,
} from 'server/src/public/routes/tests/util.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';

let andreiUser: UserEntity;
let viewer: Viewer;
let organization: OrgEntity;
let accessToken: string;

describe('Platform API: /v1/users/:userID/notifications', () => {
  beforeAll(async () => {
    ({ andreiUser, organization, accessToken } = await setupPlatformTest());

    viewer = await Viewer.createLoggedInPlatformViewer({
      user: andreiUser,
      org: organization,
    });
  });

  beforeEach(async () => {
    await Promise.all([
      ThreadEntity.truncate({ cascade: true }),
      NotificationEntity.truncate({ cascade: true }),
    ]);
  });

  test('invalid access token', async () => {
    const { statusCode, body } = await apiCall()
      .get(`/v1/users/${andreiUser.externalID}/notifications`)
      .set('Authorization', `Bearer llama`);

    expect(statusCode).toBe(401);
    expect(body.error).toBe('invalid_authorization_header');
  });

  test('get notifs', async () => {
    const reactor = await createRandomPlatformUserAndOrgMember(
      viewer.platformApplicationID!,
      organization.id,
    );
    const reactorViewer = await Viewer.createLoggedInPlatformViewer({
      user: reactor,
      org: organization,
    });

    const { threadID } = await createThreadViaGraphQL(viewer, {});
    const { messageID: replyID } = await addMessageViaGraphQL(reactorViewer, {
      threadID,
    });

    const { statusCode, body } = await apiCall()
      .get(`/v1/users/${andreiUser.externalID}/notifications`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.length).toBe(1);

    const notif: CoreNotificationData = body[0];
    expect(notif.senderUserIDs).toStrictEqual([reactor.externalID]);
    expect(notif.iconUrl).toBeNull();
    expect(notif.header.length).toBe(3);
    expect(notif.attachment).toMatchObject({
      type: 'message',
      messageID: externalizeID(replyID),
      threadID: externalizeID(threadID),
      message: {
        id: externalizeID(replyID),
        threadID: externalizeID(threadID),
        organizationID: organization.externalID,
        type: 'user_message',
      },
    });
    expect(notif.readStatus).toBe('unread');
  });

  test('get empty notifs', async () => {
    const { statusCode, body } = await apiCall()
      .get(`/v1/users/${andreiUser.externalID}/notifications`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.length).toBe(0);
  });

  test('unknown user', async () => {
    const { statusCode, body } = await apiCall()
      .get(`/v1/users/billgatesdoesnotexist/notifications`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(401);
    expect(body.error).toBe('user_not_found');
  });
});
