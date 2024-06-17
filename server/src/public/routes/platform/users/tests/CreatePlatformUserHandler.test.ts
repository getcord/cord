import { AuthProviderType } from 'server/src/auth/index.ts';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { createUserAndOrgMember } from 'server/src/public/routes/tests/util.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';
import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';

let application: ApplicationEntity;
let andreiUser: UserEntity;
let accessToken: string;

describe('Platform API: /v1/users', () => {
  beforeAll(async () => {
    ({ application, andreiUser, accessToken } = await setupPlatformTest());
  });

  test('non-object request', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(['a', 'ray']);

    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid CreatePlatformUserVariables:\n' +
        'Expected JSON object.\n' +
        'Refer to https://docs.cord.com/rest-apis/users/',
    });
  });

  test('too many fields', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'wtp',
        fav_food: 'hunny',
        first_name: 'winnie',
        last_name: 'the pooh',
        hobby: 'eating',
        fav_color: 'red',
        boop: 'bap',
      });
    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid CreatePlatformUserVariables:\n' +
        'Input {"name":"wtp","fav_food":"hunny","first_name":"winnie","last_name":"the pooh","hobby":"eating","fav_color":"red","boop":"bap"} requires field: id,\n' +
        'Input {"name":"wtp","fav_food":"hunny","first_name":"winnie","last_name":"the pooh","hobby":"eating","fav_color":"red","boop":"bap"} has unexpected fields: fav_food, hobby, fav_color and boop.\n' +
        'Refer to https://docs.cord.com/rest-apis/users/',
    });
  });

  test('too few fields', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'wtp',
      });
    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid CreatePlatformUserVariables:\n' +
        'Input {"name":"wtp"} requires field: id.\n' +
        'Refer to https://docs.cord.com/rest-apis/users/',
    });
  });

  test('missing id field', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'wtp',
        first_name: 'winnie',
        last_name: 'the pooh',
        email: 'winne@the.pooh',
      });
    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid CreatePlatformUserVariables:\n' +
        'Input {"name":"wtp","first_name":"winnie","last_name":"the pooh","email":"winne@the.pooh"} requires field: id.\n' +
        'Refer to https://docs.cord.com/rest-apis/users/',
    });
  });

  test('missing name field', async () => {
    const PLATFORM_POST_USER_ID = 'P1at4mUser3';
    const PLATFORM_POST_EMAIL = 'winnie@the.pooh';

    const { statusCode, body } = await apiCall()
      .post('/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: PLATFORM_POST_USER_ID,
        email: PLATFORM_POST_EMAIL,
      });
    expect(statusCode).toBe(201);
    expect(body).toMatchObject({
      success: true,
    });
    const createdUser = await UserEntity.findOne({
      where: {
        externalID: PLATFORM_POST_USER_ID,
      },
    });

    expect(createdUser?.name).toBeNull();
  });

  test('invalid field', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: '1',
        name: 'wtp',
        first_name: 'winnie',
        last_name: 'the pooh',
        fav_food: 'hunny',
        email: 'winne@the.pooh',
      });
    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid CreatePlatformUserVariables:\n' +
        'Input {"id":"1","name":"wtp","first_name":"winnie","last_name":"the pooh","fav_food":"hunny","email":"winne@the.pooh"} has unexpected field: fav_food.\n' +
        'Refer to https://docs.cord.com/rest-apis/users/',
    });
  });

  test('invalid id input type', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: [1],
        name: 'wtp',
        first_name: 'winnie',
        last_name: 'the pooh',
        email: 'winne@the.pooh',
      });
    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid CreatePlatformUserVariables:\n' +
        'Input [1] for id must be type string or number.\n' +
        'Refer to https://docs.cord.com/rest-apis/users/',
    });
  });

  test('invalid id input length', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: '',
        name: 'wtp',
        first_name: 'winnie',
        last_name: 'the pooh',
        email: 'winne@the.pooh',
      });
    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid CreatePlatformUserVariables:\n' +
        'Input "" for id must NOT have fewer than 1 characters.\n' +
        'Refer to https://docs.cord.com/rest-apis/users/',
    });
  });

  test('invalid id characters', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: 'abc\n123',
        name: 'wtp',
        first_name: 'winnie',
        last_name: 'the pooh',
        email: 'winne@the.pooh',
      });
    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_field',
      message: 'Input type for id is not valid, expected identifier.',
    });
  });

  test('invalid name input type', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: '1',
        name: 1,
        last_name: 'the pooh',
        email: 'winne@the.pooh',
      });
    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid CreatePlatformUserVariables:\n' +
        'Input 1 for name must be type null or string.\n' +
        'Refer to https://docs.cord.com/rest-apis/users/',
    });
  });

  test('invalid short_name input type', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: '1',
        name: 'wtp',
        short_name: 1,
        last_name: 'the pooh',
        email: 'winne@the.pooh',
      });
    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid CreatePlatformUserVariables:\n' +
        'Input 1 for short_name must be type null or string.\n' +
        'Refer to https://docs.cord.com/rest-apis/users/',
    });
  });

  test('invalid email input type', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: '1',
        name: 'wtp',
        first_name: 'winnie',
        last_name: 'the pooh',
        email: [2],
      });
    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid CreatePlatformUserVariables:\n' +
        'Input [2] for email must be type null or string.\n' +
        'Refer to https://docs.cord.com/rest-apis/users/',
    });
  });

  test('invalid metadata input type', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: '1',
        name: 'wtp',
        first_name: 'winnie',
        last_name: 'the pooh',
        email: 'winnie@the.pooh',
        metadata: 'abc',
      });
    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid CreatePlatformUserVariables:\n' +
        'Input "abc" for metadata must be type object.\n' +
        'Refer to https://docs.cord.com/rest-apis/users/',
    });
  });

  test('invalid first_name input type', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: '1',
        name: 'wtp',
        first_name: 1,
        last_name: 'the pooh',
        email: 'winne@the.pooh',
      });
    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid CreatePlatformUserVariables:\n' +
        'Input 1 for first_name must be type null or string.\n' +
        'Refer to https://docs.cord.com/rest-apis/users/',
    });
  });

  test('invalid last_name input type', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: '1',
        name: 'wtp',
        first_name: 'winnie',
        last_name: 3,
        email: 'winne@the.pooh',
      });
    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid CreatePlatformUserVariables:\n' +
        'Input 3 for last_name must be type null or string.\n' +
        'Refer to https://docs.cord.com/rest-apis/users/',
    });
  });

  test('invalid profile_picture_url input type', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: '1',
        name: 'wtp',
        email: 'winne@the.pooh',
        profile_picture_url: 'piglet',
      });
    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid CreatePlatformUserVariables:\n' +
        'Input "piglet" for profile_picture_url must match format "uri".\n' +
        'Refer to https://docs.cord.com/rest-apis/users/',
    });
  });

  test('user already exists', async () => {
    const { statusCode, body } = await apiCall()
      .post('/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: andreiUser.externalID,
        name: andreiUser.name,
        email: andreiUser.email,
      });
    expect(statusCode).toBe(409);
    expect(body).toMatchObject({
      error: 'user_already_exists',
      message:
        'The platform user with id andrei already exists, to update user please make a PUT request to users/<USER_ID>.',
    });
  });

  test('can successfully create a user', async () => {
    const PLATFORM_POST_USER_ID = 'P1at4mUser';
    const PLATFORM_POST_NAME = 'PlatformTestUserName';
    const PLATFORM_POST_SHORT_NAME = 'PlatformShortName';
    const PLATFORM_POST_FIRST_NAME = 'PlatformFirstName';
    const PLATFORM_POST_LAST_NAME = 'PlatformLastName';
    const PLATFORM_POST_EMAIL = 'platform@test.com';
    const PLATFORM_POST_METADATA = { foo: 'bar' };
    const { statusCode, body } = await apiCall()
      .post('/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: PLATFORM_POST_USER_ID,
        name: PLATFORM_POST_NAME,
        short_name: PLATFORM_POST_SHORT_NAME,
        email: PLATFORM_POST_EMAIL,
        first_name: PLATFORM_POST_FIRST_NAME,
        last_name: PLATFORM_POST_LAST_NAME,
        metadata: PLATFORM_POST_METADATA,
      });
    expect(statusCode).toBe(201);
    expect(body).toMatchObject({
      success: true,
    });
    const createdUser = await UserEntity.findOne({
      where: {
        externalID: PLATFORM_POST_USER_ID,
        name: PLATFORM_POST_NAME,
        email: PLATFORM_POST_EMAIL,
      },
    });

    const { externalID, name, screenName, email, metadata } = createdUser!;
    expect(externalID).toEqual(PLATFORM_POST_USER_ID);
    expect(name).toEqual(PLATFORM_POST_NAME);
    expect(screenName).toEqual(PLATFORM_POST_SHORT_NAME);
    expect(email).toEqual(PLATFORM_POST_EMAIL);
    expect(metadata).toEqual(PLATFORM_POST_METADATA);

    const { statusCode: getStatusCode, body: getBody } = await apiCall()
      .get(`/v1/users/${PLATFORM_POST_USER_ID}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(getStatusCode).toBe(200);
    expect(getBody).toMatchObject({
      id: PLATFORM_POST_USER_ID,
      email: PLATFORM_POST_EMAIL,
      name: PLATFORM_POST_NAME,
      short_name: PLATFORM_POST_SHORT_NAME,
      status: 'active',
      first_name: null,
      last_name: null,
      profile_picture_url: null,
      organizations: [],
    });
  });

  test('can successfully create a user with id as number input', async () => {
    const PLATFORM_POST_USER_ID = 103;
    const PLATFORM_POST_USER_ID_TO_STRING = PLATFORM_POST_USER_ID.toString();
    const PLATFORM_POST_NAME = 'PlatformTestUserName';
    const PLATFORM_POST_EMAIL = 'platform@test.com';
    const { statusCode, body } = await apiCall()
      .post('/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: PLATFORM_POST_USER_ID,
        name: PLATFORM_POST_NAME,
        email: PLATFORM_POST_EMAIL,
      });
    expect(statusCode).toBe(201);
    expect(body).toMatchObject({
      success: true,
    });
    const createdUser = await UserEntity.findOne({
      where: {
        externalID: PLATFORM_POST_USER_ID_TO_STRING,
        name: PLATFORM_POST_NAME,
        email: PLATFORM_POST_EMAIL,
      },
    });

    const { externalID, name, email } = createdUser!;
    expect(externalID).toEqual(PLATFORM_POST_USER_ID_TO_STRING);
    expect(name).toEqual(PLATFORM_POST_NAME);
    expect(email).toEqual(PLATFORM_POST_EMAIL);

    const { statusCode: getStatusCode, body: getBody } = await apiCall()
      .get(`/v1/users/${PLATFORM_POST_USER_ID}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(getStatusCode).toBe(200);
    expect(getBody).toMatchObject({
      id: PLATFORM_POST_USER_ID_TO_STRING,
      email: PLATFORM_POST_EMAIL,
      name: PLATFORM_POST_NAME,
      short_name: null,
      status: 'active',
      first_name: null,
      last_name: null,
      profile_picture_url: null,
      organizations: [],
    });
  });

  test('can successfully create a deleted user', async () => {
    const PLATFORM_POST_USER_ID = 'P1at4mUser2';
    const PLATFORM_POST_NAME = 'PlatformTestUserName';
    const PLATFORM_POST_EMAIL = 'platform@test.com';
    const { statusCode, body } = await apiCall()
      .post('/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: PLATFORM_POST_USER_ID,
        name: PLATFORM_POST_NAME,
        email: PLATFORM_POST_EMAIL,
        status: 'deleted',
      });
    expect(statusCode).toBe(201);
    expect(body).toMatchObject({
      success: true,
    });
    const createdUser = await UserEntity.findOne({
      where: {
        externalID: PLATFORM_POST_USER_ID,
        name: PLATFORM_POST_NAME,
        email: PLATFORM_POST_EMAIL,
      },
    });

    const { state } = createdUser!;
    expect(state).toEqual('deleted');

    const { statusCode: getStatusCode, body: getBody } = await apiCall()
      .get(`/v1/users/${PLATFORM_POST_USER_ID}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(getStatusCode).toBe(200);
    expect(getBody).toMatchObject({
      id: PLATFORM_POST_USER_ID,
      email: PLATFORM_POST_EMAIL,
      name: PLATFORM_POST_NAME,
      short_name: null,
      status: 'deleted',
      first_name: null,
      last_name: null,
      profile_picture_url: null,
      organizations: [],
    });
  });

  test('Get correct organization memberships for user', async () => {
    const TEST_EXTERNAL_ID = 'nickID';
    const TEST_NAME = 'nick';
    const TEST_EMAIL = 'nick@nick.com';
    const TEST_ORG_EXTERNAL_ID = 'testOrgExternalIDNick';

    const testOrg = await OrgEntity.create({
      state: 'active',
      name: 'testOrgNick',
      externalID: TEST_ORG_EXTERNAL_ID,
      externalProvider: AuthProviderType.PLATFORM,
      platformApplicationID: application.id,
    });

    const createdPlatformUser = await createUserAndOrgMember({
      name: TEST_NAME,
      externalID: TEST_EXTERNAL_ID,
      appID: application.id,
      email: TEST_EMAIL,
      orgID: testOrg.id,
      externalProvider: AuthProviderType.PLATFORM,
    });

    expect(createdPlatformUser).toBeTruthy();

    const { statusCode: getStatusCode, body: getBody } = await apiCall()
      .get(`/v1/users/${TEST_EXTERNAL_ID}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(getStatusCode).toBe(200);
    expect(getBody).toMatchObject({
      id: TEST_EXTERNAL_ID,
      email: TEST_EMAIL,
      name: TEST_NAME,
      short_name: null,
      status: 'active',
      first_name: null,
      last_name: null,
      profile_picture_url: null,
      organizations: [TEST_ORG_EXTERNAL_ID],
    });
  });

  test('get a non-existing user', async () => {
    const { statusCode, body } = await apiCall()
      .get(`/v1/users/foo`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusCode).toBe(404);
    expect(body).toMatchObject({ error: 'user_not_found' });
  });
});
