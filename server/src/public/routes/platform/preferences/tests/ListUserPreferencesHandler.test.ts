import { defaultNotificationPreference } from 'common/util/notifications.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';

let andreiUser: UserEntity;
let accessToken: string;

describe('Platform API: GET /v1/users/:userID/preferences', () => {
  beforeAll(async () => {
    ({ andreiUser, accessToken } = await setupPlatformTest());
  });

  test('invalid access token', async () => {
    const { statusCode, body } = await apiCall()
      .get(`/v1/users/${andreiUser.externalID}/preferences`)
      .set('Authorization', `Bearer llama`);

    expect(statusCode).toBe(401);
    expect(body.error).toBe('invalid_authorization_header');
  });

  test('default user preferences', async () => {
    const { statusCode, body } = await apiCall()
      .get(`/v1/users/${andreiUser.externalID}/preferences`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.notification_channels).toBeDefined();
    expect(body.notification_channels.sendViaSlack).toBe(
      defaultNotificationPreference.slack,
    );
    expect(body.notification_channels.sendViaEmail).toBe(
      defaultNotificationPreference.email,
    );
  });

  test('list user preferences', async () => {
    const { statusCode: updateStatusCode } = await apiCall()
      .put(`/v1/users/${andreiUser.externalID}/preferences`)
      .send({
        key: 'notification_channels',
        value: { sendViaSlack: false, sendViaEmail: false },
      })
      .set('Authorization', `Bearer ${accessToken}`);
    if (updateStatusCode !== 200) {
      throw new Error('Error while updating preferences');
    }

    const { statusCode, body } = await apiCall()
      .get(`/v1/users/${andreiUser.externalID}/preferences`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body.notification_channels).toBeDefined();
    expect(body.notification_channels.sendViaSlack).toBe(false);
    expect(body.notification_channels.sendViaEmail).toBe(false);
  });
});
