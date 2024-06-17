import * as jsonwebtoken from 'jsonwebtoken';

import { AuthProviderType } from 'server/src/auth/index.ts';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';
import {
  checkExpectedOrgMembers,
  createRandomPlatformOrg,
  createRandomPlatformUser,
} from 'server/src/public/routes/tests/util.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';

const MAX_ORGANIZATIONS = 1000;
const MAX_USERS = 10000;

let application: ApplicationEntity;
let andreiUser: UserEntity;
let accessToken: string;
let customerAccessToken: string;

describe('Platform API: /v1/batch', () => {
  beforeAll(async () => {
    ({ application, andreiUser, accessToken } = await setupPlatformTest());
    customerAccessToken = jsonwebtoken.sign(
      { app_id: application.id },
      'secret',
      { algorithm: 'HS512' },
    );
  });

  test('too many fields', async () => {
    const { statusCode, body } = await apiCall()
      .post(`/v1/batch`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        field1: 'field1',
        field2: 'field2',
        field3: 'field3',
      });

    expect(statusCode).toBe(400);
    expect(body).toEqual({
      error: 'invalid_request',
      message:
        'Invalid BatchAPIVariables:\n' +
        'Input {"field1":"field1","field2":"field2","field3":"field3"} has unexpected fields: field1, field2 and field3.\n' +
        'Refer to https://docs.cord.com/rest-apis/batch/',
    });
  });

  test('2 invalid fields', async () => {
    const { statusCode, body } = await apiCall()
      .post(`/v1/batch`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        field1: 'field1',
        field2: 'field2',
      });

    expect(statusCode).toBe(400);
    expect(body).toEqual({
      error: 'invalid_request',
      message:
        'Invalid BatchAPIVariables:\n' +
        'Input {"field1":"field1","field2":"field2"} has unexpected fields: field1 and field2.\n' +
        'Refer to https://docs.cord.com/rest-apis/batch/',
    });
  });

  test('1 valid and 1 invalid field', async () => {
    const { statusCode, body } = await apiCall()
      .post(`/v1/batch`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        field2: 'field2',
        organizations: 'orgs1',
      });

    expect(statusCode).toBe(400);
    expect(body).toEqual({
      error: 'invalid_request',
      message:
        'Invalid BatchAPIVariables:\n' +
        'Input "orgs1" for organizations must be type array,\n' +
        'Input {"field2":"field2","organizations":"orgs1"} has unexpected field: field2.\n' +
        'Refer to https://docs.cord.com/rest-apis/batch/',
    });
  });

  test('organizations field name but non-array value', async () => {
    const { statusCode, body } = await apiCall()
      .post(`/v1/batch`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        organizations: 'string',
      });

    expect(statusCode).toBe(400);
    expect(body).toEqual({
      error: 'invalid_request',
      message:
        'Invalid BatchAPIVariables:\n' +
        'Input "string" for organizations must be type array.\n' +
        'Refer to https://docs.cord.com/rest-apis/batch/',
    });
  });

  test('organizations field name but with an array of non-objects', async () => {
    const { statusCode, body } = await apiCall()
      .post(`/v1/batch`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        organizations: ['string1', 'string2'],
      });

    expect(statusCode).toBe(400);
    expect(body).toEqual({
      error: 'invalid_request',
      message:
        'Invalid BatchAPIVariables:\n' +
        'Input "string1" for organizations/0 must be type object,\n' +
        'Input "string2" for organizations/1 must be type object.\n' +
        'Refer to https://docs.cord.com/rest-apis/batch/',
    });
  });

  test('organizations field name but with an array of invalid objects', async () => {
    const { statusCode, body } = await apiCall()
      .post(`/v1/batch`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        organizations: [{ field1: 'field1', field2: 'field2' }],
      });

    expect(statusCode).toBe(400);
    expect(body).toEqual({
      error: 'invalid_request',
      message:
        'Invalid BatchAPIVariables:\n' +
        'Input {"field1":"field1","field2":"field2"} requires field: id,\n' +
        'Input {"field1":"field1","field2":"field2"} has unexpected fields: field1 and field2.\n' +
        'Refer to https://docs.cord.com/rest-apis/batch/',
    });
  });

  test('organizations field name with invalid id type', async () => {
    const { statusCode, body } = await apiCall()
      .post(`/v1/batch`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        organizations: [{ id: [6] }],
      });

    expect(statusCode).toBe(400);
    expect(body).toEqual({
      error: 'invalid_request',
      message:
        'Invalid BatchAPIVariables:\n' +
        'Input [6] for organizations/0/id must be type string or number.\n' +
        'Refer to https://docs.cord.com/rest-apis/batch/',
    });
  });

  test('users field name but non-array value', async () => {
    const { statusCode, body } = await apiCall()
      .post(`/v1/batch`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        users: 'string',
      });

    expect(statusCode).toBe(400);
    expect(body).toEqual({
      error: 'invalid_request',
      message:
        'Invalid BatchAPIVariables:\n' +
        'Input "string" for users must be type array.\n' +
        'Refer to https://docs.cord.com/rest-apis/batch/',
    });
  });

  test('users field name but with an array of non-objects', async () => {
    const { statusCode, body } = await apiCall()
      .post(`/v1/batch`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        users: ['string1', 'string2'],
      });

    expect(statusCode).toBe(400);
    expect(body).toEqual({
      error: 'invalid_request',
      message:
        'Invalid BatchAPIVariables:\n' +
        'Input "string1" for users/0 must be type object,\n' +
        'Input "string2" for users/1 must be type object.\n' +
        'Refer to https://docs.cord.com/rest-apis/batch/',
    });
  });

  test('users field name but with an array of invalid objects', async () => {
    const { statusCode, body } = await apiCall()
      .post(`/v1/batch`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        users: [{ field1: 'field1', field2: 'field2' }],
      });

    expect(statusCode).toBe(400);
    expect(body).toEqual({
      error: 'invalid_request',
      message:
        'Invalid BatchAPIVariables:\n' +
        'Input {"field1":"field1","field2":"field2"} requires field: id,\n' +
        'Input {"field1":"field1","field2":"field2"} has unexpected fields: field1 and field2.\n' +
        'Refer to https://docs.cord.com/rest-apis/batch/',
    });
  });

  test('users field name with invalid id type', async () => {
    const { statusCode, body } = await apiCall()
      .post(`/v1/batch`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        users: [{ id: [5] }],
      });

    expect(statusCode).toBe(400);
    expect(body).toEqual({
      error: 'invalid_request',
      message:
        'Invalid BatchAPIVariables:\n' +
        'Input [5] for users/0/id must be type string or number.\n' +
        'Refer to https://docs.cord.com/rest-apis/batch/',
    });
  });

  test('users field name with invalid email type', async () => {
    const { statusCode, body } = await apiCall()
      .post(`/v1/batch`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        users: [{ id: '5', email: 'trolololol' }],
      });

    expect(statusCode).toBe(400);
    expect(body).toEqual({
      error: 'invalid_request',
      message:
        'Invalid BatchAPIVariables:\n' +
        'Input "trolololol" for users/0/email must match format "email".\n' +
        'Refer to https://docs.cord.com/rest-apis/batch/',
    });
  });

  test('too many users', async () => {
    const { statusCode, body } = await apiCall()
      .post(`/v1/batch`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        users: Array.from({ length: MAX_USERS + 1 }).map((_, index) => ({
          id: 'too-many-users' + index,
          email: index + '@toomanyusers.com',
        })),
      });

    expect(statusCode).toBe(400);
    expect(body).toEqual({
      error: 'invalid_request',
      message:
        'Invalid BatchAPIVariables:\n' +
        'Input has 10001 items and must NOT have more than 10000 items.\n' +
        'Refer to https://docs.cord.com/rest-apis/batch/',
    });
  });

  test('too many organizations', async () => {
    const { statusCode, body } = await apiCall()
      .post(`/v1/batch`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        organizations: Array.from({
          length: MAX_ORGANIZATIONS + 1,
        }).map((_, index) => ({
          id: 'too-many-orgs' + index,
          name: 'too-many-orgs' + index,
        })),
      });

    expect(statusCode).toBe(400);
    expect(body).toEqual({
      error: 'invalid_request',
      message:
        'Invalid BatchAPIVariables:\n' +
        'Input has 1001 items and must NOT have more than 1000 items.\n' +
        'Refer to https://docs.cord.com/rest-apis/batch/',
    });
  });

  test('no creation as a member added to org does not exist ', async () => {
    const PLATFORM_POST_ORG_ID = 'org';
    const PLATFORM_POST_ORG_NAME = 'org ';
    const INVALID_MEMBER_ID = 'he_who_must_not_be_named';
    const PLATFORM_POST_ORG_MEMBERS = [INVALID_MEMBER_ID];

    const orgsArray = ['001', '002'];

    const orgsInput = orgsArray.map((org) => ({
      id: PLATFORM_POST_ORG_ID + org,
      name: PLATFORM_POST_ORG_NAME + org,
      members: PLATFORM_POST_ORG_MEMBERS,
    }));

    const { statusCode, body } = await apiCall()
      .post(`/v1/batch`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        organizations: orgsInput,
      });

    const orgs = await OrgEntity.findAll({
      where: { externalID: orgsArray, platformApplicationID: application.id },
    });

    expect(orgs.length).toBe(0);
    expect(statusCode).toBe(401);
    expect(body).toMatchObject({
      error: 'user_not_found',
      message: `Platform user ${INVALID_MEMBER_ID} not found.`,
    });
  });

  test('creating 2 new orgs', async () => {
    const PLATFORM_POST_ORG_ID = 'org';
    const PLATFORM_POST_ORG_NAME = 'org ';
    const PLATFORM_POST_ORG_MEMBERS = ['andrei'];

    const orgsArray = ['001', '002'];

    const orgsInput = orgsArray.map((org) => ({
      id: PLATFORM_POST_ORG_ID + org,
      name: PLATFORM_POST_ORG_NAME + org,
      members: PLATFORM_POST_ORG_MEMBERS,
    }));

    const { statusCode, body } = await apiCall()
      .post(`/v1/batch`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        organizations: orgsInput,
      });

    expect(statusCode).toBe(200);
    expect(body).toEqual({
      success: true,
      message: '✅ You successfully batch updated 0 users and 2 groups',
    });

    await Promise.all(
      orgsArray.map(async (org) => {
        const newOrg = await OrgEntity.findOne({
          where: {
            externalID: PLATFORM_POST_ORG_ID + org,
            externalProvider: AuthProviderType.PLATFORM,
            platformApplicationID: application.id,
          },
        });
        expect(newOrg).toBeTruthy();

        if (newOrg) {
          const orgMembers = await OrgMembersEntity.findAll({
            where: {
              orgID: newOrg.id,
            },
          });
          expect(orgMembers).toBeTruthy();

          if (orgMembers) {
            const andreiOrgMemberField = orgMembers.find(
              (orgMember) => orgMember.userID === andreiUser.id,
            );

            expect(andreiOrgMemberField).toBeTruthy();
          }
        }
      }),
    );
  });

  test('creating 2 new orgs with number ids', async () => {
    const PLATFORM_POST_ORG_NAME = 'org ';
    const PLATFORM_POST_ORG_MEMBERS = ['andrei'];

    const orgsArray = [104, 105];
    const orgsArrayString = orgsArray.map((orgName) => orgName.toString());

    const orgsInput = orgsArray.map((org) => ({
      id: org,
      name: PLATFORM_POST_ORG_NAME + org,
      members: PLATFORM_POST_ORG_MEMBERS,
    }));

    const { statusCode, body } = await apiCall()
      .post(`/v1/batch`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        organizations: orgsInput,
      });

    expect(statusCode).toBe(200);
    expect(body).toEqual({
      success: true,
      message: '✅ You successfully batch updated 0 users and 2 groups',
    });

    await Promise.all(
      orgsArrayString.map(async (org) => {
        const newOrg = await OrgEntity.findOne({
          where: {
            externalID: org,
            externalProvider: AuthProviderType.PLATFORM,
            platformApplicationID: application.id,
          },
        });
        expect(newOrg).toBeTruthy();

        if (newOrg) {
          const orgMembers = await OrgMembersEntity.findAll({
            where: {
              orgID: newOrg.id,
            },
          });
          expect(orgMembers).toBeTruthy();

          if (orgMembers) {
            const andreiOrgMemberField = orgMembers.find(
              (orgMember) => orgMember.userID === andreiUser.id,
            );

            expect(andreiOrgMemberField).toBeTruthy();
          }
        }
      }),
    );
  });

  test('only updating name of an org', async () => {
    const existingOrg = await createRandomPlatformOrg(application.id);

    const { statusCode, body } = await apiCall()
      .post(`/v1/batch`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        organizations: [
          {
            id: existingOrg.externalID,
            name: 'radical',
          },
        ],
      });

    expect(statusCode).toBe(200);
    expect(body).toEqual({
      success: true,
      message: '✅ You successfully batch updated 0 users and 1 group',
    });

    const updatedOrg = await OrgEntity.findOne({
      where: {
        externalID: existingOrg.externalID,
        name: 'radical',
        state: 'active',
        externalProvider: AuthProviderType.PLATFORM,
        platformApplicationID: application.id,
      },
    });

    expect(updatedOrg).toBeTruthy();

    if (updatedOrg) {
      expect(existingOrg.id).toEqual(updatedOrg.id);
    }
  });

  test('org does not update as member is invalid', async () => {
    const INVALID_MEMBER_ID = 'he_who_must_not_be_named';
    const EXTERNAL_ORG_ID = 'you_wizard';
    const randomOrg = await OrgEntity.create({
      state: 'active',
      name: 'testNumberOrg106',
      externalProvider: AuthProviderType.PLATFORM,
      platformApplicationID: application.id,
      externalID: EXTERNAL_ORG_ID,
    });

    const { statusCode, body } = await apiCall()
      .post(`/v1/batch`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        organizations: [
          {
            id: EXTERNAL_ORG_ID,
            name: 'radical',
            members: [INVALID_MEMBER_ID],
          },
        ],
      });

    expect(statusCode).toBe(401);
    expect(body).toMatchObject({
      error: 'user_not_found',
      message: `Platform user ${INVALID_MEMBER_ID} not found.`,
    });

    const updatedOrg = await OrgEntity.findOne({
      where: {
        externalID: randomOrg.externalID,
        name: 'radical',
        state: 'active',
        externalProvider: AuthProviderType.PLATFORM,
        platformApplicationID: application.id,
      },
    });

    expect(updatedOrg).toBeFalsy();
  });

  test('only updating name of an org using number as id', async () => {
    const EXTERNAL_ORG_ID = 106;
    const EXTERNAL_ORG_ID_TO_STRING = EXTERNAL_ORG_ID.toString();
    const randomOrg = await OrgEntity.create({
      state: 'active',
      name: 'testNumberOrg106',
      externalProvider: AuthProviderType.PLATFORM,
      platformApplicationID: application.id,
      externalID: EXTERNAL_ORG_ID_TO_STRING,
    });

    const { statusCode, body } = await apiCall()
      .post(`/v1/batch`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        organizations: [
          {
            id: EXTERNAL_ORG_ID,
            name: 'radical',
          },
        ],
      });

    expect(statusCode).toBe(200);
    expect(body).toEqual({
      success: true,
      message: '✅ You successfully batch updated 0 users and 1 group',
    });

    const updatedOrg = await OrgEntity.findOne({
      where: {
        externalID: randomOrg.externalID,
        name: 'radical',
        state: 'active',
        externalProvider: AuthProviderType.PLATFORM,
        platformApplicationID: application.id,
      },
    });

    expect(updatedOrg).toBeTruthy();

    if (updatedOrg) {
      expect(randomOrg.id).toEqual(updatedOrg.id);
    }
  });

  test('creating 2 new users with customer token authorization', async () => {
    const PLATFORM_POST_USER_ID = 'user';
    const PLATFORM_POST_NAME = 'user ';
    const PLATFORM_POST_EMAIL = 'user@test.com';

    const usersArray = ['001', '002'];

    const usersInput = usersArray.map((user) => ({
      id: PLATFORM_POST_USER_ID + user,
      name: PLATFORM_POST_NAME + user,
      email: user + PLATFORM_POST_EMAIL,
    }));

    const { statusCode, body } = await apiCall()
      .post(`/v1/batch`)
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .send({
        users: usersInput,
      });

    expect(statusCode).toBe(200);
    expect(body).toEqual({
      success: true,
      message: '✅ You successfully batch updated 2 users and 0 groups',
    });
  });

  test('creating 2 new users with customer token authorization using number as id', async () => {
    const PLATFORM_POST_NAME = 'user ';
    const PLATFORM_POST_EMAIL = 'user@test.com';

    const usersArray = [301, 302];

    const usersInput = usersArray.map((user) => ({
      id: user,
      name: PLATFORM_POST_NAME + user,
      email: user + PLATFORM_POST_EMAIL,
    }));

    const { statusCode, body } = await apiCall()
      .post(`/v1/batch`)
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .send({
        users: usersInput,
      });

    expect(statusCode).toBe(200);
    expect(body).toEqual({
      success: true,
      message: '✅ You successfully batch updated 2 users and 0 groups',
    });
  });

  test('creating 2 new users', async () => {
    const PLATFORM_POST_USER_ID = 'user';
    const PLATFORM_POST_NAME = 'user ';
    const PLATFORM_POST_EMAIL = 'user@test.com';

    const usersArray = ['001', '002'];

    const usersInput = usersArray.map((user) => ({
      id: PLATFORM_POST_USER_ID + user,
      name: PLATFORM_POST_NAME + user,
      email: user + PLATFORM_POST_EMAIL,
    }));

    const { statusCode, body } = await apiCall()
      .post(`/v1/batch`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        users: usersInput,
      });

    expect(statusCode).toBe(200);
    expect(body).toEqual({
      success: true,
      message: '✅ You successfully batch updated 2 users and 0 groups',
    });

    await Promise.all(
      usersArray.map(async (user) => {
        const newUser = await UserEntity.findOne({
          where: {
            externalID: PLATFORM_POST_USER_ID + user,
            name: PLATFORM_POST_NAME + user,
            email: user + PLATFORM_POST_EMAIL,
            externalProvider: AuthProviderType.PLATFORM,
            platformApplicationID: application.id,
          },
        });
        expect(newUser).toBeTruthy();
      }),
    );
  });

  test('only updating a user name', async () => {
    const existingUser = await createRandomPlatformUser(application.id);

    const { statusCode, body } = await apiCall()
      .post(`/v1/batch`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        users: [
          {
            id: existingUser.externalID,
            name: 'new updated name',
            email: existingUser.email,
          },
        ],
      });

    expect(statusCode).toBe(200);
    expect(body).toEqual({
      success: true,
      message: '✅ You successfully batch updated 1 user and 0 groups',
    });

    const updatedUser = await UserEntity.findOne({
      where: {
        externalID: existingUser.externalID,
        name: 'new updated name',
        email: existingUser.email,
        externalProvider: AuthProviderType.PLATFORM,
        platformApplicationID: application.id,
      },
    });

    expect(updatedUser).toBeTruthy();

    if (updatedUser) {
      expect(existingUser.id).toEqual(updatedUser.id);
    }
  });

  test('only updating a user name with user external id as number', async () => {
    const EXTERNAL_USER_ID = 303;
    const EXTERNAL_USER_ID_TO_STRING = EXTERNAL_USER_ID.toString();
    const randomUser = await createRandomPlatformUser(application.id, {
      externalID: EXTERNAL_USER_ID_TO_STRING,
      name: 'jane doe',
      email: 'jane@doe.com',
    });

    const { statusCode, body } = await apiCall()
      .post(`/v1/batch`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        users: [
          {
            id: EXTERNAL_USER_ID,
            name: 'new updated name',
            email: randomUser.email,
          },
        ],
      });
    expect(statusCode).toBe(200);
    expect(body).toEqual({
      success: true,
      message: '✅ You successfully batch updated 1 user and 0 groups',
    });

    const updatedUser = await UserEntity.findOne({
      where: {
        externalID: randomUser.externalID,
        name: 'new updated name',
        email: randomUser.email,
        externalProvider: AuthProviderType.PLATFORM,
        platformApplicationID: application.id,
      },
    });

    expect(updatedUser).toBeTruthy();

    if (updatedUser) {
      expect(randomUser.id).toEqual(updatedUser.id);
    }
  });

  test('creating a new org and new member, adding new member and existing member to org', async () => {
    const PLATFORM_POST_ORG_ID = 'org003';
    const PLATFORM_POST_ORG_NAME = 'org 003';
    const PLATFORM_POST_ORG_MEMBERS = ['andrei', 'user003'];

    const PLATFORM_POST_USER_ID = 'user003';
    const PLATFORM_POST_NAME = 'user 003';
    const PLATFORM_POST_EMAIL = 'user@test.com';

    const { statusCode, body } = await apiCall()
      .post(`/v1/batch`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        organizations: [
          {
            id: PLATFORM_POST_ORG_ID,
            name: PLATFORM_POST_ORG_NAME,
            members: PLATFORM_POST_ORG_MEMBERS,
          },
        ],
        users: [
          {
            id: PLATFORM_POST_USER_ID,
            name: PLATFORM_POST_NAME,
            email: PLATFORM_POST_EMAIL,
          },
        ],
      });

    expect(statusCode).toBe(200);
    expect(body).toEqual({
      success: true,
      message: '✅ You successfully batch updated 1 user and 1 group',
    });

    const newUser = await UserEntity.findOne({
      where: {
        externalID: PLATFORM_POST_USER_ID,
        name: PLATFORM_POST_NAME,
        email: PLATFORM_POST_EMAIL,
        externalProvider: AuthProviderType.PLATFORM,
        platformApplicationID: application.id,
      },
    });
    expect(newUser).toBeTruthy();

    const newOrg = await OrgEntity.findOne({
      where: {
        externalID: PLATFORM_POST_ORG_ID,
        externalProvider: AuthProviderType.PLATFORM,
        platformApplicationID: application.id,
      },
    });

    expect(newOrg).toBeTruthy();

    const orgMembers = await OrgMembersEntity.findAll({
      where: {
        orgID: newOrg!.id,
      },
    });

    expect(orgMembers).toBeTruthy();

    if (orgMembers && newUser) {
      const expectedOrgMembers = [newUser.id, andreiUser.id];

      expect(
        checkExpectedOrgMembers(expectedOrgMembers, orgMembers),
      ).toBeTruthy();
    }
  });

  test('add newly created member to existing org', async () => {
    const existingOrg = await createRandomPlatformOrg(application.id);

    const PLATFORM_POST_ORG_MEMBERS = ['andrei', 'user004'];

    const PLATFORM_POST_USER_ID = 'user004';
    const PLATFORM_POST_NAME = 'user 004';
    const PLATFORM_POST_EMAIL = 'user@test.com';

    const { statusCode, body } = await apiCall()
      .post(`/v1/batch`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        organizations: [
          {
            id: existingOrg.externalID,
            members: PLATFORM_POST_ORG_MEMBERS,
          },
        ],
        users: [
          {
            id: PLATFORM_POST_USER_ID,
            name: PLATFORM_POST_NAME,
            email: PLATFORM_POST_EMAIL,
          },
        ],
      });

    expect(statusCode).toBe(200);
    expect(body).toEqual({
      success: true,
      message: '✅ You successfully batch updated 1 user and 1 group',
    });

    const newUser = await UserEntity.findOne({
      where: {
        externalID: PLATFORM_POST_USER_ID,
        name: PLATFORM_POST_NAME,
        email: PLATFORM_POST_EMAIL,
        externalProvider: AuthProviderType.PLATFORM,
        platformApplicationID: application.id,
      },
    });

    const orgMembers = await OrgMembersEntity.findAll({
      where: {
        orgID: existingOrg.id,
      },
    });

    if (orgMembers && newUser) {
      const expectedOrgMembers = [newUser.id, andreiUser.id];

      expect(
        checkExpectedOrgMembers(expectedOrgMembers, orgMembers),
      ).toBeTruthy();
    }
  });

  test('remove members from org', async () => {
    const existingOrg = await createRandomPlatformOrg(application.id);
    const userOne = await createRandomPlatformUser(application.id);
    const userTwo = await createRandomPlatformUser(application.id);

    await OrgMembersEntity.create({
      userID: userOne.id,
      orgID: existingOrg.id,
    });

    await OrgMembersEntity.create({
      userID: userTwo.id,
      orgID: existingOrg.id,
    });

    const { statusCode, body } = await apiCall()
      .post(`/v1/batch`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        organizations: [
          {
            id: existingOrg.externalID,
            members: [],
          },
        ],
      });

    expect(statusCode).toBe(200);
    expect(body).toEqual({
      success: true,
      message: '✅ You successfully batch updated 0 users and 1 group',
    });

    const orgMembers = await OrgMembersEntity.findAll({
      where: {
        orgID: existingOrg.id,
      },
    });

    if (orgMembers) {
      expect(checkExpectedOrgMembers([], orgMembers)).toBeTruthy();
    }
  });

  test('only updating status of an org and short name of a user ', async () => {
    const existingOrg = await createRandomPlatformOrg(application.id);
    const existingUser = await createRandomPlatformUser(application.id, {
      screenName: 'terrance',
    });

    const { statusCode, body } = await apiCall()
      .post(`/v1/batch`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        organizations: [
          {
            id: existingOrg.externalID,
            status: 'deleted',
          },
        ],
        users: [
          {
            id: existingUser.externalID,
            short_name: 'terrence',
          },
        ],
      });

    expect(statusCode).toBe(200);
    expect(body).toEqual({
      success: true,
      message: '✅ You successfully batch updated 1 user and 1 group',
    });

    const updatedOrg = await OrgEntity.findOne({
      where: {
        externalID: existingOrg.externalID,
        name: existingOrg.name,
        state: 'inactive',
        externalProvider: AuthProviderType.PLATFORM,
        platformApplicationID: application.id,
      },
    });

    expect(updatedOrg).toBeTruthy();

    if (updatedOrg) {
      expect(existingOrg.id).toEqual(updatedOrg.id);
    }

    const updatedUser = await UserEntity.findOne({
      where: {
        externalID: existingUser.externalID,
        name: existingUser.name,
        email: existingUser.email,
        screenName: 'terrence',
        externalProvider: AuthProviderType.PLATFORM,
        platformApplicationID: application.id,
      },
    });

    expect(updatedUser).toBeTruthy();

    if (updatedUser) {
      expect(existingUser.id).toEqual(updatedUser.id);
    }
  });

  test('Adding orgs with duplicate existing member IDs', async () => {
    const userOne = await createRandomPlatformUser(application.id);
    const org = await createRandomPlatformOrg(application.id);
    await apiCall()
      .post('/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: userOne.id,
        name: userOne.name,
        email: userOne.email,
      });

    const { statusCode, body } = await apiCall()
      .post(`/v1/batch`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        organizations: [
          {
            name: org.name,
            id: org.externalID,
            members: [userOne.externalID, userOne.externalID],
          },
        ],
      });

    expect(statusCode).toBe(200);
    expect(body).toEqual({
      success: true,
      message: '✅ You successfully batch updated 0 users and 1 group',
    });

    const orgMembers = await OrgMembersEntity.findAll({
      where: {
        orgID: org.id,
      },
    });

    expect(checkExpectedOrgMembers([userOne.id], orgMembers)).toBeTruthy();
  });
});
