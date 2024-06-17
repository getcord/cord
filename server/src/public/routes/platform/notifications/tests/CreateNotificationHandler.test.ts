import * as jsonwebtoken from 'jsonwebtoken';
import type { UUID } from 'common/types/index.ts';
import { NotificationEntity } from 'server/src/entity/notification/NotificationEntity.ts';
import {
  createPlatformApplication,
  createRandomPlatformOrg,
  createRandomPlatformUserAndOrgMember,
} from 'server/src/public/routes/tests/util.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';

let token: string;
let appID: UUID;
let firstUserID: string;
let secondUserID: string;

// eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
function doPost(token: string, body: object) {
  return apiCall()
    .post('/v1/notifications')
    .set('Authorization', `Bearer ${token}`)
    .send(body);
}

describe('Platform API: /v1/notifications', () => {
  beforeAll(async () => {
    const secret = 'secret';
    const app = await createPlatformApplication('cool test app', secret);
    const org = await createRandomPlatformOrg(app.id);

    const [firstUser, secondUser] = await Promise.all([
      createRandomPlatformUserAndOrgMember(app.id, org.id),
      createRandomPlatformUserAndOrgMember(app.id, org.id),
    ]);

    firstUserID = firstUser.externalID;
    secondUserID = secondUser.externalID;

    token = jsonwebtoken.sign({ app_id: app.id }, secret, {
      algorithm: 'HS512',
    });
    appID = app.id;
  });

  beforeEach(async () => {
    await NotificationEntity.truncate();
  });

  test('empty request', async () => {
    const { statusCode, body } = await doPost(token, {});
    expect(statusCode).toBe(400);
    expect(body.error).toBe('invalid_request');
    expect(await NotificationEntity.count()).toBe(0);
  });

  test('IDs only', async () => {
    const { statusCode, body } = await doPost(token, {
      actor_id: firstUserID,
      recipient_id: secondUserID,
      type: 'url',
    });
    expect(statusCode).toBe(400);
    expect(body.error).toBe('invalid_request');
    expect(await NotificationEntity.count()).toBe(0);
  });

  test('text and URL only', async () => {
    const { statusCode, body } = await doPost(token, {
      template: '{{actor}} ate a sandwich',
      url: 'http://example.com',
      type: 'url',
    });
    expect(statusCode).toBe(400);
    expect(body.error).toBe('invalid_request');
    expect(await NotificationEntity.count()).toBe(0);
  });

  test('invalid type', async () => {
    const { statusCode, body } = await doPost(token, {
      template: '{{actor}} ate a sandwich',
      url: 'http://example.com',
      actor_id: firstUserID,
      recipient_id: secondUserID,
      type: 'garbage',
    });
    expect(statusCode).toBe(400);
    expect(body.error).toBe('invalid_request');
    expect(await NotificationEntity.count()).toBe(0);
  });

  test('garbage IDs', async () => {
    const { statusCode, body } = await doPost(token, {
      template: '{{actor}} ate a sandwich',
      url: 'http://example.com',
      actor_id: 'garbage',
      recipient_id: 'more garbage',
      type: 'url',
    });
    expect(statusCode).toBe(401);
    expect(body.error).toBe('invalid_user_id');
    expect(await NotificationEntity.count()).toBe(0);
  });

  test('valid template without actor', async () => {
    const { statusCode, body } = await doPost(token, {
      template: 'stuff',
      url: 'http://example.com',
      recipient_id: secondUserID,
      type: 'url',
    });
    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(await NotificationEntity.count()).toBe(1);
  });

  test('invalid template with {{actor}} in template but no actor_id', async () => {
    const { statusCode, body } = await doPost(token, {
      template: '{{actor}} ate a sandwich',
      url: 'http://example.com',
      actor_id: firstUserID,
      recipient_id: secondUserID,
      type: 'url',
    });
    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(await NotificationEntity.count()).toBe(1);
  });

  test('user from another app', async () => {
    const app2 = await createPlatformApplication('another app');
    const org = await createRandomPlatformOrg(app2.id);
    const app2User = await createRandomPlatformUserAndOrgMember(
      app2.id,
      org.id,
    );

    let { statusCode, body } = await doPost(token, {
      template: '{{actor}} ate a sandwich',
      url: 'http://example.com',
      actor_id: firstUserID,
      recipient_id: app2User.externalID,
      type: 'url',
    });
    expect(statusCode).toBe(401);
    expect(body.error).toBe('invalid_user_id');
    expect(await NotificationEntity.count()).toBe(0);

    ({ statusCode, body } = await doPost(token, {
      template: '{{actor}} ate a sandwich',
      url: 'http://example.com',
      actor_id: app2User.externalID,
      recipient_id: secondUserID,
      type: 'url',
    }));
    expect(statusCode).toBe(401);
    expect(body.error).toBe('invalid_user_id');
    expect(await NotificationEntity.count()).toBe(0);
  });

  test('invalid metadata', async () => {
    const { statusCode, body } = await doPost(token, {
      template: '{{actor}} ate a sandwich',
      url: 'http://example.com',
      actor_id: firstUserID,
      recipient_id: secondUserID,
      type: 'url',
      metadata: { foo: {} },
    });
    expect(statusCode).toBe(400);
    expect(body.error).toBe('invalid_request');
    expect(await NotificationEntity.count()).toBe(0);
  });

  test('valid call', async () => {
    const { statusCode, body } = await doPost(token, {
      template: '{{actor}} ate a sandwich',
      url: 'http://example.com',
      actor_id: firstUserID,
      recipient_id: secondUserID,
      type: 'url',
      metadata: { foo: 'bar' },
    });
    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(await NotificationEntity.count()).toBe(1);
  });

  test('valid call (no metadata)', async () => {
    const { statusCode, body } = await doPost(token, {
      template: '{{actor}} ate a sandwich',
      url: 'http://example.com',
      actor_id: firstUserID,
      recipient_id: secondUserID,
      type: 'url',
    });
    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(await NotificationEntity.count()).toBe(1);
  });

  test('incorrectly signed token', async () => {
    const badToken = jsonwebtoken.sign({ app_id: appID }, 'wrong secret', {
      algorithm: 'HS512',
    });
    const { statusCode, body } = await doPost(badToken, {
      template: '{{actor}} ate a sandwich',
      url: 'http://example.com',
      actor_id: firstUserID,
      recipient_id: secondUserID,
      type: 'url',
    });
    expect(statusCode).toBe(401);
    expect(body.error).toBe('invalid_project_token');
    expect(await NotificationEntity.count()).toBe(0);
  });
});
