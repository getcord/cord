import * as jsonwebtoken from 'jsonwebtoken';
import { AuthProviderType } from 'server/src/auth/index.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';
import { createUserAndOrgMember } from 'server/src/public/routes/tests/util.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import type { ClientUserData } from '@cord-sdk/types';

let andreiUser: UserEntity;
let secondUser: UserEntity;
let organization: OrgEntity;
let clientAuthToken: string;

function sortByID(arr: ClientUserData[]) {
  return arr.sort((a, b) => {
    if (a.id < b.id) {
      return -1;
    } else if (a.id > b.id) {
      return 1;
    } else {
      return 0;
    }
  });
}

describe('Client REST API: /v1/client/groupMembers', () => {
  beforeAll(async () => {
    let application;
    ({ application, andreiUser, organization } = await setupPlatformTest());
    secondUser = await createUserAndOrgMember({
      name: 'Second User',
      externalID: 'seconduser',
      appID: organization.platformApplicationID!,
      email: 'user2@example.com',
      orgID: organization.id,
      externalProvider: AuthProviderType.PLATFORM,
    });

    clientAuthToken = jsonwebtoken.sign(
      { project_id: application.id, user_id: andreiUser.externalID },
      application.sharedSecret,
      { algorithm: 'HS512' },
    );
  });

  test('Get group members', async () => {
    const { statusCode, body } = await apiCall()
      .get(`/v1/client/groupMembers/${organization.externalID}`)
      .set('Authorization', `Bearer ${clientAuthToken}`);

    expect(statusCode).toBe(200);
    expect(body.loading).toBe(false);
    expect(body.hasMore).toBe(false);
    const sortedUsers = sortByID(body.groupMembers);
    expect(sortedUsers).toMatchObject([
      { id: andreiUser.externalID },
      { id: secondUser.externalID },
    ]);
  });

  test('Pagination', async () => {
    for (let i = 1; i < 20; i++) {
      await createUserAndOrgMember({
        name: 'Second User',
        externalID: `testuser${i}`,
        appID: organization.platformApplicationID!,
        email: 'user2@example.com',
        orgID: organization.id,
        externalProvider: AuthProviderType.PLATFORM,
      });
    }
    const { statusCode, body } = await apiCall()
      .get(`/v1/client/groupMembers/${organization.externalID}`)
      .set('Authorization', `Bearer ${clientAuthToken}`);

    expect(statusCode).toBe(200);
    expect(body.loading).toBe(false);
    expect(body.hasMore).toBe(true);
    expect(body.groupMembers.length).toBe(10);
  });
});
