import * as jsonwebtoken from 'jsonwebtoken';
import { Viewer } from 'server/src/auth/index.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';
import {
  addMessageViaGraphQL,
  createRandomPlatformUserAndOrgMember,
  createThreadViaGraphQL,
} from 'server/src/public/routes/tests/util.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';
import { externalizeID } from 'common/util/externalIDs.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import type { ClientNotificationData } from '@cord-sdk/types';

let andreiUser: UserEntity;
let organization: OrgEntity;
let viewer: Viewer;
let clientAuthToken: string;

describe('Client REST API: /v1/client/notifications', () => {
  beforeAll(async () => {
    let application;
    ({ application, andreiUser, organization } = await setupPlatformTest());
    viewer = await Viewer.createLoggedInPlatformViewer({
      user: andreiUser,
      org: organization,
    });

    clientAuthToken = jsonwebtoken.sign(
      { project_id: application.id, user_id: andreiUser.externalID },
      application.sharedSecret,
      { algorithm: 'HS512' },
    );
  });

  beforeEach(async () => {
    await ThreadEntity.truncate({ cascade: true });
  });

  test('Empty', async () => {
    const { statusCode, body } = await apiCall()
      .get(`/v1/client/notifications`)
      .set('Authorization', `Bearer ${clientAuthToken}`);

    expect(statusCode).toBe(200);
    expect(body.notifications.length).toBe(0);
    expect(body.hasMore).toBe(false);
  });

  test('Notification', async () => {
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

    const {
      statusCode,
      body,
    }: { statusCode: number; body: ClientNotificationData } = await apiCall()
      .get(`/v1/client/notifications`)
      .set('Authorization', `Bearer ${clientAuthToken}`);

    expect(statusCode).toBe(200);
    expect(body.notifications.length).toBe(1);

    const notif = body.notifications[0];
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
});
