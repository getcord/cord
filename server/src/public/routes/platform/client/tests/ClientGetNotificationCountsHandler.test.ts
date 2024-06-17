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
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';

let andreiUser: UserEntity;
let organization: OrgEntity;
let viewer: Viewer;
let clientAuthToken: string;

describe('Client REST API: /v1/client/notificationCounts', () => {
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
      .get(`/v1/client/notificationCounts`)
      .set('Authorization', `Bearer ${clientAuthToken}`);

    expect(statusCode).toBe(200);
    expect(body.unread).toBe(0);
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
    await addMessageViaGraphQL(reactorViewer, { threadID });

    const { statusCode, body } = await apiCall()
      .get(`/v1/client/notificationCounts`)
      .set('Authorization', `Bearer ${clientAuthToken}`);

    expect(statusCode).toBe(200);
    expect(body.unread).toBe(1);
  });
});
