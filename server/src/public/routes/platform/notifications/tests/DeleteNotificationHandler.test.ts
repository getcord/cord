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

describe('Platform API: DELETE /v1/users/:userID/notifications/:notificationID', () => {
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
      .delete(`/v1/notifications/llama`)
      .set('Authorization', `Bearer llama`);

    expect(statusCode).toBe(401);
    expect(body.error).toBe('invalid_authorization_header');
  });

  test('delete notif', async () => {
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

    const notif = (await NotificationEntity.findOne({
      where: {
        messageID: replyID,
        recipientID: andreiUser.id,
      },
    }))!;
    expect(notif).toBeDefined();

    const { statusCode, body } = await apiCall()
      .delete(`/v1/notifications/${notif.externalID}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(await NotificationEntity.findByPk(notif.id)).toBeNull();

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);
  });
});
