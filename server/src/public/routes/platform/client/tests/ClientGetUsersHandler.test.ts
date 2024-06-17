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

describe('Platform list users API: /v1/client/users', () => {
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

  test('Users is required', async () => {
    const { statusCode, body } = await apiCall()
      .get(`/v1/client/users`)
      .set('Authorization', `Bearer ${clientAuthToken}`);

    expect(statusCode).toBe(400);
    expect(body.error).toBe('invalid_request');
  });

  test('Get users', async () => {
    // A bunch of characters that are weird in JSON and URLs
    const missingUser = '[]&=d7{3++/yep';
    const { statusCode, body } = await apiCall()
      .get(
        `/v1/client/users?users=${encodeURIComponent(
          JSON.stringify([
            andreiUser.externalID,
            otherUser.externalID,
            missingUser,
          ]),
        )}`,
      )
      .set('Authorization', `Bearer ${clientAuthToken}`);

    expect(statusCode).toBe(200);
    expect(body[andreiUser.externalID].name).toBe(andreiUser.name);
    expect(body[otherUser.externalID].name).toBe(otherUser.name);
    expect(body[missingUser]).toBeNull();
    expect(body['not a requested user']).toBeUndefined();
  });
});
