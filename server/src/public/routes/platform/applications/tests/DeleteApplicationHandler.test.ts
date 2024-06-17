import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import type { CustomerEntity } from 'server/src/entity/customer/CustomerEntity.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';
import {
  createRandomPlatformOrg,
  createRandomPlatformUser,
  createPlatformApplication,
} from 'server/src/public/routes/tests/util.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';

let customerAccessToken: string;
let customer: CustomerEntity;
let application: ApplicationEntity;

describe.only('Platform API: DELETE /v1/applications/:appID', () => {
  beforeAll(async () => {
    ({ customerAccessToken, customer } = await setupPlatformTest());
  });

  beforeEach(async () => {
    application = await createPlatformApplication(
      'platform app',
      'secret',
      customer.id,
    );
  });

  test('can successfully delete an application', async () => {
    expect(application).toBeTruthy();
    const { statusCode, body } = await apiCall()
      .delete(`/v1/applications/${application.id}`)
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .send({
        secret: application.sharedSecret,
      });

    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      success: true,
    });

    const app = await ApplicationEntity.findOne({
      where: {
        id: application.id,
      },
    });

    expect(app).toBeNull();
  });

  test('delete app with orgs', async () => {
    const organization1 = await createRandomPlatformOrg(application.id);
    const organization2 = await createRandomPlatformOrg(application.id);

    expect(organization1).toBeTruthy();
    expect(organization2).toBeTruthy();

    const { statusCode, body } = await apiCall()
      .delete(`/v1/applications/${application.id}`)
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .send({
        secret: application.sharedSecret,
      });
    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      success: true,
    });

    // Verify the associated orgs were deleted
    const org1 = await OrgEntity.findByPk(organization1.id);
    const org2 = await OrgEntity.findByPk(organization2.id);
    expect(org1).toBeNull();
    expect(org2).toBeNull();
  });

  test('delete app with users', async () => {
    const user1 = await createRandomPlatformUser(application.id);
    const user2 = await createRandomPlatformUser(application.id);

    expect(user1).toBeTruthy();
    expect(user2).toBeTruthy();

    const { statusCode, body } = await apiCall()
      .delete(`/v1/applications/${application.id}`)
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .send({
        secret: application.sharedSecret,
      });
    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      success: true,
    });

    // Verify the associated users were deleted
    const userTest1 = await OrgEntity.findByPk(user1.id);
    const userTest2 = await OrgEntity.findByPk(user2.id);
    expect(userTest1).toBeNull();
    expect(userTest2).toBeNull();
  });
});
