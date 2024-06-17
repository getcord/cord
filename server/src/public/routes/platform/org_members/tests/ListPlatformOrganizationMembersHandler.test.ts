import { AuthProviderType } from 'server/src/auth/index.ts';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { createUserAndOrgMember } from 'server/src/public/routes/tests/util.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';
import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';

let application: ApplicationEntity;
let accessToken: string;
let organization: OrgEntity;

describe('Platform list org-members API: /v1/:orgID/members', () => {
  const USER_EXTERNAL_ID = 'red-velvet';
  const NUM_USERS = 20;
  const limit = 15;
  beforeAll(async () => {
    ({ application, organization, accessToken } = await setupPlatformTest());

    for (let index = 0; index < NUM_USERS; index++) {
      await createUserAndOrgMember({
        name: 'Red',
        externalID: `${USER_EXTERNAL_ID}-${index}`,
        email: `red.velvet.${index}@cord.com`,
        orgID: organization.id,
        externalProvider: AuthProviderType.PLATFORM,
        appID: application.id,
      });
    }
  });

  test('Get all org members', async () => {
    const { statusCode, body } = await apiCall()
      .get(`/v1/groups/${organization.externalID}/members?limit=${limit}`)
      .set('Authorization', `Bearer ${accessToken}`);

    const total_users = NUM_USERS + 1; // +1 for andreiUser

    expect(statusCode).toBe(200);
    expect(body.pagination.total).toBe(total_users);
    expect(body.users.length).toBe(limit);

    const token = body.pagination.token;
    expect(token).not.toBeNull();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(10);

    // 2nd call with the pagination token that was received in the 1st call
    const { statusCode: statusCode2, body: body2 } = await apiCall()
      .get(
        `/v1/groups/${organization.externalID}/members?limit=${limit}&token=${token}`,
      )
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode2).toBe(200);
    expect(body2.pagination.total).toBe(total_users);
    expect(body2.users.length).toBe(total_users - 15);

    const token2 = body2.pagination.token;
    expect(token2).toBeNull();
  });
});
