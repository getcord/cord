import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';

let andreiUser: UserEntity;
let accessToken: string;

describe('Platform API: PUT /v1/users/:userID/preferences', () => {
  beforeAll(async () => {
    ({ andreiUser, accessToken } = await setupPlatformTest());
  });

  test('invalid access token', async () => {
    const { statusCode, body } = await apiCall()
      .put(`/v1/users/${andreiUser.externalID}/preferences`)
      .send({
        key: 'notification_channels',
        value: { sendViaSlack: false, sendViaEmail: false },
      })
      .set('Authorization', `Bearer llama`);

    expect(statusCode).toBe(401);
    expect(body.error).toBe('invalid_authorization_header');
  });

  test('update all user preferences', async () => {
    const { statusCode, body: updateBody } = await apiCall()
      .put(`/v1/users/${andreiUser.externalID}/preferences`)
      .send({
        key: 'notification_channels',
        value: { sendViaSlack: false, sendViaEmail: false },
      })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(updateBody.success).toBe(true);

    const { body: getBody } = await apiCall()
      .get(`/v1/users/${andreiUser.externalID}/preferences`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(getBody.notification_channels.sendViaEmail).toBe(false);
    expect(getBody.notification_channels.sendViaSlack).toBe(false);
  });

  test('update partial user preferences', async () => {
    const { statusCode, body: updateBody } = await apiCall()
      .put(`/v1/users/${andreiUser.externalID}/preferences`)
      .send({
        key: 'notification_channels',
        value: { sendViaSlack: true },
      })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(updateBody.success).toBe(true);

    const { body: getBody } = await apiCall()
      .get(`/v1/users/${andreiUser.externalID}/preferences`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(getBody.notification_channels.sendViaSlack).toBe(true);
    expect(getBody.notification_channels.sendViaEmail).toBe(false);
  });

  test('not passing a key', async () => {
    const { statusCode, body } = await apiCall()
      .put(`/v1/users/${andreiUser.externalID}/preferences`)
      .send({
        value: { sendViaSlack: false, sendViaEmail: false },
      })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(400);
    expect(body.error).toBe('invalid_request');
  });
});
