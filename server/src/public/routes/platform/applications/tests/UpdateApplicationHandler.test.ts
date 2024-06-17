import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import type { CustomerEntity } from 'server/src/entity/customer/CustomerEntity.ts';
import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';

let customerAccessToken: string;
let customer: CustomerEntity;

describe('Platform API: /v1/applications/:appID', () => {
  beforeAll(async () => {
    ({ customerAccessToken, customer } = await setupPlatformTest());
  });

  test('can successfully update an application', async () => {
    const newApp = await ApplicationEntity.create({
      name: 'testApp',
      customerID: customer.id,
    });

    const { statusCode, body } = await apiCall()
      .put(`/v1/applications/${newApp.id}`)
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .send({
        name: 'updatedTestApp',
      });

    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      success: true,
    });

    const app = await ApplicationEntity.findOne({
      where: {
        id: newApp.id,
      },
    });

    expect(app).toBeTruthy();
    expect(app?.name).toBe('updatedTestApp');
  });

  test('can successfully update application`s customEmailTemplate', async () => {
    const newApp = await ApplicationEntity.create({
      name: 'testApp',
      customerID: customer.id,
    });

    const { statusCode, body } = await apiCall()
      .put(`/v1/applications/${newApp.id}`)
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .send({
        emailSettings: {
          name: 'Notifications',
        },
      });

    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      success: true,
    });

    const app = await ApplicationEntity.findOne({
      where: {
        id: newApp.id,
      },
    });
    expect(app).toBeTruthy();
    expect(app?.customEmailTemplate?.partnerName).toBe('Notifications');
    expect(app?.customEmailTemplate?.sender).toBe(
      'Notifications <testapp-notifications@cord.fyi>',
    );
    expect(app?.customEmailTemplate?.logoConfig).toMatchObject({
      width: '140',
      height: 'auto',
    });

    const { statusCode: statusCode1, body: body1 } = await apiCall()
      .put(`/v1/applications/${newApp.id}`)
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .send({
        emailSettings: {
          sender: 'test-notifs@cord.com',
          logoConfig: {
            width: 239.2,
          },
        },
      });

    expect(statusCode1).toBe(200);
    expect(body1).toMatchObject({
      success: true,
    });

    const { statusCode: statusCode2, body: body2 } = await apiCall()
      .put(`/v1/applications/${newApp.id}`)
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .send({
        name: 'updated appName',
      });

    expect(statusCode2).toBe(200);
    expect(body2).toMatchObject({
      success: true,
    });

    const app1 = await ApplicationEntity.findOne({
      where: {
        id: newApp.id,
      },
    });

    expect(app1).toBeTruthy();
    expect(app1?.customEmailTemplate?.partnerName).toBe('Notifications');
    expect(app1?.customEmailTemplate?.sender).toBe(
      'Notifications <test-notifs@cord.com>',
    );
    expect(app1?.customEmailTemplate?.logoConfig).toMatchObject({
      width: '239',
      height: 'auto',
    });
  });
});
