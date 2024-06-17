import { apiCall } from 'server/src/tests/setupEnvironment.ts';
import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';

let customerAccessToken: string;

describe('Platform API: /v1/applications', () => {
  beforeAll(async () => {
    ({ customerAccessToken } = await setupPlatformTest());
  });

  test('non-object request', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/applications')
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .send(['bar']);

    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid CreateApplicationVariables:\n' +
        'Expected JSON object.\n' +
        'Refer to https://docs.cord.com/rest-apis/applications/',
    });
  });

  test('invalid name field - wrong type', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/applications')
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .send({
        name: 1,
      });

    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid CreateApplicationVariables:\n' +
        'Input 1 for name must be type string.\n' +
        'Refer to https://docs.cord.com/rest-apis/applications/',
    });
  });

  test('invalid name field - empty string', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/applications')
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .send({
        name: '',
      });

    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid CreateApplicationVariables:\n' +
        'Input "" for name must NOT have fewer than 1 characters.\n' +
        'Refer to https://docs.cord.com/rest-apis/applications/',
    });
  });

  test('customEmailTemplate value', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/applications')
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .send({
        name: 'Test',
        emailSettings: {
          name: 'test-app-notifs',
        },
      });
    expect(statusCode).toBe(200);

    const app = await ApplicationEntity.findOne({
      where: {
        id: body.applicationID,
      },
    });

    expect(app?.name).toBe('Test');
    expect(app?.customEmailTemplate?.partnerName).toBe('test-app-notifs');
    expect(app?.customEmailTemplate?.sender).toBe(
      'test-app-notifs <test-notifications@cord.fyi>',
    );
    expect(app?.customEmailTemplate?.logoConfig).toMatchObject({
      width: '140',
      height: 'auto',
    });
  });

  test('verify project creation', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/projects')
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .send({
        name: 'Test',
      });
    expect(statusCode).toBe(200);
    expect(body.projectID).toBe(body.applicationID);

    const app = await ApplicationEntity.findOne({
      where: {
        id: body.projectID,
      },
    });

    expect(app?.name).toBe('Test');
  });
});
