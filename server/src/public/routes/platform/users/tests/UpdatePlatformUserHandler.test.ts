import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';

let andreiUser: UserEntity;
let accessToken: string;
let organization: OrgEntity;
let otherOrganization: OrgEntity;

describe('Platform API: /v1/users/:userID', () => {
  beforeAll(async () => {
    ({ andreiUser, accessToken, organization, otherOrganization } =
      await setupPlatformTest());
  });

  afterEach(async () => {
    await OrgMembersEntity.truncate();
  });

  test('too many fields', async () => {
    const { statusCode, body } = await apiCall()
      .put(`/v1/users/${andreiUser.externalID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: 1,
        name: 'wtp',
        fav_food: 'hunny',
        first_name: 'winnie',
        last_name: 'the pooh',
        hobby: 'eating',
        fav_color: 'red',
      });
    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid UpdatePlatformUserVariables:\n' +
        'Input {"id":1,"name":"wtp","fav_food":"hunny","first_name":"winnie","last_name":"the pooh","hobby":"eating","fav_color":"red"} has unexpected fields: id, fav_food, hobby and fav_color.\n' +
        'Refer to https://docs.cord.com/rest-apis/users/',
    });
  });

  test('invalid field', async () => {
    const { statusCode, body } = await apiCall()
      .put(`/v1/users/${andreiUser.externalID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
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
        'Invalid UpdatePlatformUserVariables:\n' +
        'Input {"name":"wtp","first_name":"winnie","last_name":"the pooh","fav_food":"hunny","email":"winne@the.pooh"} has unexpected field: fav_food.\n' +
        'Refer to https://docs.cord.com/rest-apis/users/',
    });
  });

  test('invalid userID characters', async () => {
    const { statusCode, body } = await apiCall()
      .put(`/v1/users/123\t456`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'wtp',
        last_name: 'the pooh',
        email: 'winne@the.pooh',
      });
    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_field',
      message: 'Input type for userID is not valid, expected identifier.',
    });
  });

  test('invalid name input type', async () => {
    const { statusCode, body } = await apiCall()
      .put(`/v1/users/${andreiUser.externalID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 1,
        last_name: 'the pooh',
        email: 'winne@the.pooh',
      });
    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid UpdatePlatformUserVariables:\n' +
        'Input 1 for name must be type null or string.\n' +
        'Refer to https://docs.cord.com/rest-apis/users/',
    });
  });

  test('invalid short_name input type', async () => {
    const { statusCode, body } = await apiCall()
      .put(`/v1/users/${andreiUser.externalID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'wtp',
        short_name: 1,
        last_name: 'the pooh',
        email: 'winne@the.pooh',
      });
    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid UpdatePlatformUserVariables:\n' +
        'Input 1 for short_name must be type null or string.\n' +
        'Refer to https://docs.cord.com/rest-apis/users/',
    });
  });

  test('invalid email input type', async () => {
    const { statusCode, body } = await apiCall()
      .put(`/v1/users/${andreiUser.externalID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'wtp',
        first_name: 'winnie',
        last_name: 'the pooh',
        email: [2],
      });
    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid UpdatePlatformUserVariables:\n' +
        'Input [2] for email must be type null or string.\n' +
        'Refer to https://docs.cord.com/rest-apis/users/',
    });
  });

  test('invalid first_name input type', async () => {
    const { statusCode, body } = await apiCall()
      .put(`/v1/users/${andreiUser.externalID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'wtp',
        first_name: 1,
        last_name: 'the pooh',
        email: 'winne@the.pooh',
      });
    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid UpdatePlatformUserVariables:\n' +
        'Input 1 for first_name must be type null or string.\n' +
        'Refer to https://docs.cord.com/rest-apis/users/',
    });
  });

  test('invalid last_name input type', async () => {
    const { statusCode, body } = await apiCall()
      .put(`/v1/users/${andreiUser.externalID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'wtp',
        first_name: 'winnie',
        last_name: [3],
        email: 'winne@the.pooh',
      });
    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid UpdatePlatformUserVariables:\n' +
        'Input [3] for last_name must be type null or string.\n' +
        'Refer to https://docs.cord.com/rest-apis/users/',
    });
  });

  test('invalid profile_picture_url input type', async () => {
    const { statusCode, body } = await apiCall()
      .put(`/v1/users/${andreiUser.externalID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'wtp',
        email: 'winne@the.pooh',
        profile_picture_url: 'piglet',
      });
    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid UpdatePlatformUserVariables:\n' +
        'Input "piglet" for profile_picture_url must match format "uri".\n' +
        'Refer to https://docs.cord.com/rest-apis/users/',
    });
  });

  test('invalid status input type', async () => {
    const { statusCode, body } = await apiCall()
      .put(`/v1/users/${andreiUser.externalID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'wtp',
        email: 'winne@the.pooh',
        status: 3,
      });
    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid UpdatePlatformUserVariables:\n' +
        'Input 3 for status must be type string,\n' +
        'Input 3 for status must be equal to one of the allowed values: active or deleted.\n' +
        'Refer to https://docs.cord.com/rest-apis/users/',
    });
  });

  test('email not a required input type', async () => {
    const { statusCode, body } = await apiCall()
      .put(`/v1/users/an-drei`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'An',
      });
    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      success: true,
      message: '✅ You successfully created user an-drei',
    });
  });

  test("will create a user if it doesn't exist", async () => {
    const { statusCode, body } = await apiCall()
      .put(`/v1/users/winnie`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'wtp',
        email: 'winne@the.pooh',
        profile_picture_url: 'https://www.winniethepooh.com/winne.jpg',
      });

    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      success: true,
      message: '✅ You successfully created user winnie',
    });

    const user = await UserEntity.findOne({
      where: {
        externalID: 'winnie',
        platformApplicationID: andreiUser.platformApplicationID,
        externalProvider: andreiUser.externalProvider,
      },
    });

    const { name, email, profilePictureURL } = user!;
    expect(name).toEqual('wtp');
    expect(email).toEqual('winne@the.pooh');
    expect(profilePictureURL).toEqual(
      'https://www.winniethepooh.com/winne.jpg',
    );
  });

  test('can successfully update a user', async () => {
    const PLATFORM_USER_ID = andreiUser.externalID;
    const PLATFORM_PUT_NAME = 'PlatformTestUserName';
    const PLATFORM_PUT_METADATA = { baz: 'wibble' };
    const { statusCode, body } = await apiCall()
      .put(`/v1/users/${PLATFORM_USER_ID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: PLATFORM_PUT_NAME,
        status: 'deleted',
        metadata: PLATFORM_PUT_METADATA,
      });
    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      success: true,
    });
    const updatedUser = await UserEntity.findOne({
      where: { id: andreiUser.id },
    });

    const { state, name, email, metadata } = updatedUser!;
    expect(name).toEqual(PLATFORM_PUT_NAME);
    expect(email).toEqual(andreiUser.email);
    expect(state).toEqual('deleted');
    expect(metadata).toEqual(PLATFORM_PUT_METADATA);
  });

  test('can successfully update a user (metadata only)', async () => {
    const PLATFORM_USER_ID = andreiUser.externalID;
    const PLATFORM_PUT_METADATA = { baz: 'wibble2' };
    const { statusCode, body } = await apiCall()
      .put(`/v1/users/${PLATFORM_USER_ID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        metadata: PLATFORM_PUT_METADATA,
      });
    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      success: true,
    });
    const updatedUser = await UserEntity.findOne({
      where: { id: andreiUser.id },
    });

    const { metadata } = updatedUser!;
    expect(metadata).toEqual(PLATFORM_PUT_METADATA);
  });

  test('Update user - sending empty string email does not update email', async () => {
    const PLATFORM_USER_ID = andreiUser.externalID;

    const { statusCode, body } = await apiCall()
      .put(`/v1/users/${PLATFORM_USER_ID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        email: '',
      });
    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      success: true,
    });
    const updatedUser = await UserEntity.findOne({
      where: { id: andreiUser.id },
    });

    const { email } = updatedUser!;
    expect(email).toEqual(andreiUser.email);
  });

  test('Create User - will ignore empty string email', async () => {
    const { statusCode, body } = await apiCall()
      .put(`/v1/users/piglet`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'piglet',
        email: '',
      });

    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      success: true,
      message: '✅ You successfully created user piglet',
    });

    const user = await UserEntity.findOne({
      where: {
        externalID: 'piglet',
        platformApplicationID: andreiUser.platformApplicationID,
        externalProvider: andreiUser.externalProvider,
      },
    });

    const { name, email } = user!;
    expect(name).toEqual('piglet');
    expect(email).toBeNull();
  });

  test('Create user - Add groups', async () => {
    const { statusCode, body } = await apiCall()
      .put(`/v1/users/roo`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'roo',
        addGroups: [organization.externalID, otherOrganization.externalID],
      });

    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      success: true,
      message: '✅ You successfully created user roo',
    });

    const user = await UserEntity.findOne({
      where: {
        externalID: 'roo',
        platformApplicationID: andreiUser.platformApplicationID,
        externalProvider: andreiUser.externalProvider,
      },
    });
    expect(user).toBeTruthy();

    expect(
      await OrgMembersEntity.findOne({
        where: { userID: user!.id, orgID: organization.id },
      }),
    ).toBeTruthy();

    expect(
      await OrgMembersEntity.findOne({
        where: { userID: user!.id, orgID: otherOrganization.id },
      }),
    ).toBeTruthy();
  });

  test('Update user - Add group', async () => {
    const { statusCode, body } = await apiCall()
      .put(`/v1/users/${andreiUser.externalID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        addGroups: [otherOrganization.externalID],
      });

    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      success: true,
      message: `✅ You successfully updated user ${andreiUser.externalID}`,
    });

    expect(
      await OrgMembersEntity.findOne({
        where: { userID: andreiUser.id, orgID: otherOrganization.id },
      }),
    ).toBeTruthy();

    expect(
      await OrgMembersEntity.findOne({
        where: { userID: andreiUser.id, orgID: organization.id },
      }),
    ).toBeNull();
  });

  test('Update user - Remove group', async () => {
    let { statusCode, body } = await apiCall()
      .put(`/v1/users/${andreiUser.externalID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        addGroups: [organization.externalID],
      });

    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      success: true,
      message: `✅ You successfully updated user ${andreiUser.externalID}`,
    });

    expect(
      await OrgMembersEntity.findOne({
        where: { userID: andreiUser.id, orgID: organization.id },
      }),
    ).toBeTruthy();

    ({ statusCode, body } = await apiCall()
      .put(`/v1/users/${andreiUser.externalID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        removeGroups: [organization.externalID],
      }));

    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      success: true,
      message: `✅ You successfully updated user ${andreiUser.externalID}`,
    });

    expect(
      await OrgMembersEntity.findOne({
        where: { userID: andreiUser.id, orgID: organization.id },
      }),
    ).toBeNull();
  });

  test("Update user - Can't add and remove the same group", async () => {
    const { statusCode, body } = await apiCall()
      .put(`/v1/users/${andreiUser.externalID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        addGroups: [organization.externalID],
        removeGroups: [organization.externalID],
      });

    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_field',
    });
  });

  test("Update user - Can't remove nonexistent group", async () => {
    const { statusCode, body } = await apiCall()
      .put(`/v1/users/${andreiUser.externalID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        removeGroups: ['doesnotexist'],
      });

    expect(statusCode).toBe(401);
    expect(body).toMatchObject({
      error: 'group_not_found',
    });
  });

  test('Update user - Can remove group not a member of', async () => {
    expect(
      await OrgMembersEntity.findOne({
        where: { userID: andreiUser.id, orgID: organization.id },
      }),
    ).toBeNull();

    const { statusCode, body } = await apiCall()
      .put(`/v1/users/${andreiUser.externalID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        removeGroups: [organization.externalID],
      });

    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      success: true,
      message: `✅ You successfully updated user ${andreiUser.externalID}`,
    });
    expect(
      await OrgMembersEntity.findOne({
        where: { userID: andreiUser.id, orgID: organization.id },
      }),
    ).toBeNull();
  });
});
