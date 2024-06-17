import * as jsonwebtoken from 'jsonwebtoken';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { createRandomPlatformUserAndOrgMember } from 'server/src/public/routes/tests/util.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';
import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';

let application: ApplicationEntity;
let clientAuthToken: string;
let andreiUser: UserEntity;
let otherUser: UserEntity;

describe('Platform list users API: /v1/client/user', () => {
  beforeAll(async () => {
    let organization;
    ({ application, organization, andreiUser } = await setupPlatformTest());

    otherUser = await createRandomPlatformUserAndOrgMember(
      application.id,
      organization.id,
    );

    clientAuthToken = jsonwebtoken.sign(
      { project_id: application.id, user_id: andreiUser.externalID },
      application.sharedSecret,
      { algorithm: 'HS512' },
    );
  });

  test('Get viewer', async () => {
    const { statusCode, body } = await apiCall()
      .get(`/v1/client/user/${andreiUser.externalID}`)
      .set('Authorization', `Bearer ${clientAuthToken}`);

    expect(statusCode).toBe(200);
    expect(body.name).toBe(andreiUser.name);
  });

  test('Get other user', async () => {
    const { statusCode, body } = await apiCall()
      .get(`/v1/client/user/${otherUser.externalID}`)
      .set('Authorization', `Bearer ${clientAuthToken}`);

    expect(statusCode).toBe(200);
    expect(body.name).toBe(otherUser.name);
  });

  test("Get user that doesn't exist", async () => {
    const { statusCode, body } = await apiCall()
      .get(`/v1/client/user/keyser-söze`)
      .set('Authorization', `Bearer ${clientAuthToken}`);

    expect(statusCode).not.toBe(200);
    expect(body.error).toBe('user_not_found');
  });
});
