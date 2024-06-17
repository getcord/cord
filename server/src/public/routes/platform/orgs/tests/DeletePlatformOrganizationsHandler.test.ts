import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import {
  createPage,
  createThread,
} from 'server/src/public/routes/tests/util.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';

let application: ApplicationEntity;
let organization: OrgEntity;
let accessToken: string;

describe('Platform API: DELETE /v1/organizations/:orgID', () => {
  beforeEach(async () => {
    ({ application, organization, accessToken } = await setupPlatformTest());
  });

  test('non existent org', async () => {
    const { statusCode, body } = await apiCall()
      .delete('/v1/organizations/non_existent_org')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(401);
    expect(body).toMatchObject({
      error: 'group_not_found',
    });
  });

  test('existing org', async () => {
    const { statusCode, body } = await apiCall()
      .delete(`/v1/organizations/${organization.externalID}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      success: true,
    });
  });

  test('org with threads', async () => {
    const page = await createPage(organization.id);
    const thread = await createThread(
      'temp',
      organization.id,
      page.contextHash,
      application.id,
    );

    const { statusCode, body } = await apiCall()
      .delete(`/v1/organizations/${organization.externalID}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      success: true,
    });

    // Verify the associated thread was deleted
    const t2 = await ThreadEntity.findByPk(thread.id);
    expect(t2).toBeNull();
  });

  test('existing org on groups route', async () => {
    const { statusCode, body } = await apiCall()
      .delete(`/v1/groups/${organization.externalID}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      success: true,
    });
  });
});
