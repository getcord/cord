import { Sequelize } from 'sequelize';
import * as jsonwebtoken from 'jsonwebtoken';
import { ACCESS_TOKEN_TTL_HOURS } from 'common/const/IntegrationAPI.ts';
import { AuthProviderType } from 'server/src/auth/index.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { SessionEntity } from 'server/src/entity/session/SessionEntity.ts';
import {
  createPlatformApplication,
  createRandomPlatformUser,
} from 'server/src/public/routes/tests/util.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import env from 'server/src/config/Env.ts';
import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';

let application: ApplicationEntity;
let organization: OrgEntity;
let andreiUser: UserEntity;
let accessToken: string;

describe('Platform API: /v1/organizations', () => {
  beforeAll(async () => {
    ({ application, organization, andreiUser, accessToken } =
      await setupPlatformTest());
  });

  test('non-object request', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/organizations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(['bar']);

    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid CreatePlatformOrganizationVariables:\n' +
        'Expected JSON object.',
    });
  });

  test('wrong fields', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/organizations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        foo: 'bar',
      });

    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid CreatePlatformOrganizationVariables:\n' +
        'Input {"foo":"bar"} requires fields: id and name,\n' +
        'Input {"foo":"bar"} has unexpected field: foo.',
    });
  });

  test('too many fields', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/organizations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        foo: 'bar',
        bar: 'baz',
        baz: 'foo',
        jazz: 'pop',
        boop: 'bap',
      });

    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid CreatePlatformOrganizationVariables:\n' +
        'Input {"foo":"bar","bar":"baz","baz":"foo","jazz":"pop","boop":"bap"} requires fields: id and name,\n' +
        'Input {"foo":"bar","bar":"baz","baz":"foo","jazz":"pop","boop":"bap"} has unexpected fields: foo, bar, baz, jazz and boop.',
    });
  });

  test('missing id field', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/organizations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'she-ra',
        member: [],
      });
    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid CreatePlatformOrganizationVariables:\n' +
        'Input {"name":"she-ra","member":[]} requires field: id,\n' +
        'Input {"name":"she-ra","member":[]} has unexpected field: member.',
    });
  });

  test('missing name field', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/organizations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: '123',
        member: [],
      });
    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid CreatePlatformOrganizationVariables:\n' +
        'Input {"id":"123","member":[]} requires field: name,\n' +
        'Input {"id":"123","member":[]} has unexpected field: member.',
    });
  });

  test('invalid field', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/organizations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: '123',
        name: 'she-ra',
        screen_name: 'Adora',
      });
    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid CreatePlatformOrganizationVariables:\n' +
        'Input {"id":"123","name":"she-ra","screen_name":"Adora"} has unexpected field: screen_name.',
    });
  });

  test('invalid id field - wrong type', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/organizations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: [123],
        name: 'she-ra',
      });

    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid CreatePlatformOrganizationVariables:\n' +
        'Input [123] for id must be type string or number.',
    });
  });

  test('invalid id field - empty string', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/organizations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: '',
        name: 'she-ra',
      });

    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid CreatePlatformOrganizationVariables:\n' +
        'Input "" for id must NOT have fewer than 1 characters.',
    });
  });

  test('invalid id field - invalid character', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/organizations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: 'abc\n123',
        name: 'she-ra',
      });

    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_field',
      message: 'Input type for id is not valid, expected identifier.',
    });
  });

  test('invalid name field', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/organizations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: '123',
        name: 123,
      });

    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid CreatePlatformOrganizationVariables:\n' +
        'Input 123 for name must be type string.',
    });
  });

  test('invalid members field', async () => {
    {
      const { statusCode, body } = await apiCall()
        .post('/v1/organizations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          id: '123',
          name: 'she-ra',
          members: 123,
        });

      expect(statusCode).toBe(400);
      expect(body).toMatchObject({
        error: 'invalid_request',
        message:
          'Invalid CreatePlatformOrganizationVariables:\n' +
          'Input 123 for members must be type array.',
      });
    }

    {
      const { statusCode, body } = await apiCall()
        .post('/v1/organizations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          id: '123',
          name: 'she-ra',
          members: [{ member: 123 }, 456],
        });

      expect(statusCode).toBe(400);
      expect(body).toMatchObject({
        error: 'invalid_request',
        message:
          'Invalid CreatePlatformOrganizationVariables:\n' +
          'Input {"member":123} for members/0 must be type string or number.',
      });
    }
  });

  test('member user does not exist, should not create org', async () => {
    const INVALID_MEMBER_ID = 'InvalidMemberID';
    const ORG_ID = '123';
    const { statusCode, body } = await apiCall()
      .post('/v1/organizations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: ORG_ID,
        name: 'greyskull',
        members: [INVALID_MEMBER_ID],
      });

    const org = await OrgEntity.findOne({
      where: {
        externalID: ORG_ID,
        platformApplicationID: application.id,
      },
    });

    expect(org).toBeFalsy();
    expect(statusCode).toBe(401);
    expect(body).toMatchObject({
      error: 'user_not_found',
      message: `Platform user ${INVALID_MEMBER_ID} not found.`,
    });
  });

  test('organization already exists', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/organizations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: organization.externalID,
        name: organization.name,
      });

    expect(statusCode).toBe(409);
    expect(body).toMatchObject({
      error: 'organization_already_exists',
      message: `The platform organization with id ${organization.name} already exists, to update organization please make a PUT request to organizations/<ORGANIZATION_ID>.`,
    });
  });

  test('can successfully create an organization', async () => {
    const PLATFORM_ORG_ID = 'PlatformTestOrgID';
    const PLATFORM_ORG_NAME = 'PlatformTestOrgName';

    const { statusCode, body } = await apiCall()
      .post('/v1/organizations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: PLATFORM_ORG_ID,
        name: PLATFORM_ORG_NAME,
        members: [andreiUser.externalID],
      });

    expect(statusCode).toBe(201);
    expect(body).toMatchObject({
      success: true,
    });

    const org = await OrgEntity.findOne({
      where: {
        externalID: PLATFORM_ORG_ID,
        externalProvider: AuthProviderType.PLATFORM,
        platformApplicationID: application.id,
      },
    });

    expect(org).toBeTruthy();
    expect(org?.name).toBe(PLATFORM_ORG_NAME);
    expect(org?.state).toBe('active');

    const orgMember = await OrgMembersEntity.findOne({
      where: {
        userID: andreiUser.id,
        orgID: org!.id,
      },
    });

    expect(orgMember).toBeTruthy();
    expect(orgMember?.orgID).toBe(org?.id);
    expect(orgMember?.userID).toBe(andreiUser.id);

    const { statusCode: getStatusCode, body: getBody } = await apiCall()
      .get(`/v1/organizations/${PLATFORM_ORG_ID}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(getStatusCode).toBe(200);
    expect(getBody).toMatchObject({
      id: PLATFORM_ORG_ID,
      members: [andreiUser.externalID],
      name: PLATFORM_ORG_NAME,
      status: 'active',
    });
  });

  test('can successfully create an organization using number input for id', async () => {
    const PLATFORM_ORG_ID = 123456;
    const PLATFORM_ORG_NAME = 'PlatformOrgNameWithNumber';
    const PLATFORM_ORG_ID_TO_STRING = PLATFORM_ORG_ID.toString();

    const EXTERNAL_USER_ID = 34;
    const EXTERNAL_USER_ID_TO_STRING = EXTERNAL_USER_ID.toString();

    await createRandomPlatformUser(application.id, {
      externalID: EXTERNAL_USER_ID_TO_STRING,
      name: 'jane doe',
    });

    const { statusCode, body } = await apiCall()
      .post('/v1/organizations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: PLATFORM_ORG_ID,
        name: PLATFORM_ORG_NAME,
        members: [EXTERNAL_USER_ID],
      });

    expect(statusCode).toBe(201);
    expect(body).toMatchObject({
      success: true,
    });

    const org = await OrgEntity.findOne({
      where: {
        externalID: PLATFORM_ORG_ID_TO_STRING,
        externalProvider: AuthProviderType.PLATFORM,
        platformApplicationID: application.id,
      },
    });

    expect(org).toBeTruthy();
    expect(org?.name).toBe(PLATFORM_ORG_NAME);
    expect(org?.state).toBe('active');

    const { statusCode: getStatusCode, body: getBody } = await apiCall()
      .get(`/v1/organizations/${PLATFORM_ORG_ID}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(getStatusCode).toBe(200);
    expect(getBody).toMatchObject({
      id: PLATFORM_ORG_ID_TO_STRING,
      members: [EXTERNAL_USER_ID_TO_STRING],
      name: PLATFORM_ORG_NAME,
      status: 'active',
    });
  });

  test('can successfully create a deleted organization', async () => {
    const PLATFORM_ORG_ID = 'PlatformTestOrgID2';
    const PLATFORM_ORG_NAME = 'PlatformTestOrgName';

    const { statusCode, body } = await apiCall()
      .post('/v1/organizations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: PLATFORM_ORG_ID,
        name: PLATFORM_ORG_NAME,
        status: 'deleted',
      });

    expect(statusCode).toBe(201);
    expect(body).toMatchObject({
      success: true,
    });

    const org = await OrgEntity.findOne({
      where: {
        externalID: PLATFORM_ORG_ID,
        externalProvider: AuthProviderType.PLATFORM,
        platformApplicationID: application.id,
      },
    });

    expect(org).toBeTruthy();
    expect(org?.state).toBe('inactive');
  });

  test('get a non-existing organization', async () => {
    const { statusCode, body } = await apiCall()
      .get(`/v1/organizations/foo`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(404);
    expect(body).toMatchObject({ error: 'group_not_found' });
  });

  test('list organizations', async () => {
    // setting up a separate application so that the list of organizations
    // isn't polluted with data from other tests

    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    const application = await createPlatformApplication(
      'platform app',
      'secret',
    );
    const session = await SessionEntity.create({
      applicationID: application.id,
      expiresAt: Sequelize.literal(
        `NOW() + INTERVAL '${ACCESS_TOKEN_TTL_HOURS} hours'`,
      ),
    });
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    const accessToken = jsonwebtoken.sign(
      { session_id: session.id },
      env.JWT_SIGNING_SECRET,
      { algorithm: 'HS512' },
    );

    const PLATFORM_ORG_1_ID = 'PlatformTestOrgID_1';
    const PLATFORM_ORG_1_NAME = 'PlatformTestOrgName1';
    const PLATFORM_ORG_2_ID = 'PlatformTestOrgID_2';
    const PLATFORM_ORG_2_NAME = 'PlatformTestOrgName2';

    const { statusCode: create1StatusCode } = await apiCall()
      .post('/v1/organizations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: PLATFORM_ORG_1_ID,
        name: PLATFORM_ORG_1_NAME,
      });

    expect(create1StatusCode).toBe(201);

    const { statusCode: create2StatusCode } = await apiCall()
      .post('/v1/organizations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: PLATFORM_ORG_2_ID,
        name: PLATFORM_ORG_2_NAME,
        status: 'deleted',
      });

    expect(create2StatusCode).toBe(201);

    const { statusCode, body } = await apiCall()
      .get('/v1/organizations')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(200);
    expect(body).toMatchObject([
      {
        id: PLATFORM_ORG_1_ID,
        name: PLATFORM_ORG_1_NAME,
        status: 'active',
      },
      {
        id: PLATFORM_ORG_2_ID,
        name: PLATFORM_ORG_2_NAME,
        status: 'deleted',
      },
    ]);
  });
});
