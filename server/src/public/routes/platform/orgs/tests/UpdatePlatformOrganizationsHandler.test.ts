import { AuthProviderType } from 'server/src/auth/index.ts';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { setupPlatformTest } from 'server/src/public/routes/platform/tests/util.ts';
import {
  createRandomPlatformUser,
  createUserAndOrgMember,
} from 'server/src/public/routes/tests/util.ts';
import { apiCall } from 'server/src/tests/setupEnvironment.ts';

let application: ApplicationEntity;
let organization: OrgEntity;
let andreiUser: UserEntity;
let accessToken: string;

describe('Platform API: /v1/organizations/:orgID', () => {
  beforeAll(async () => {
    ({ application, organization, andreiUser, accessToken } =
      await setupPlatformTest());
  });

  test('too many fields', async () => {
    const { statusCode, body } = await apiCall()
      .put(`/v1/organizations/${organization.externalID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        foo: 'bar',
        bar: 'baz',
        baz: 'foo',
        jazz: 'pop',
      });

    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid UpdatePlatformGroupVariables:\n' +
        'Input {"foo":"bar","bar":"baz","baz":"foo","jazz":"pop"} has unexpected fields: foo, bar, baz and jazz.\n' +
        'Refer to https://docs.cord.com/rest-apis/groups/',
    });
  });

  test('invalid orgID characters', async () => {
    const { statusCode, body } = await apiCall()
      .put(`/v1/organizations/123\t456`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'name',
      });

    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_field',
      message: 'Input type for orgID is not valid, expected identifier.',
    });
  });

  test('invalid name field', async () => {
    const { statusCode, body } = await apiCall()
      .put(`/v1/organizations/${organization.externalID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 123,
      });

    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid UpdatePlatformGroupVariables:\n' +
        'Input 123 for name must be type string.\n' +
        'Refer to https://docs.cord.com/rest-apis/groups/',
    });
  });

  test('invalid status field', async () => {
    const { statusCode, body } = await apiCall()
      .put(`/v1/organizations/${organization.externalID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        status: 123,
      });

    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid UpdatePlatformGroupVariables:\n' +
        'Input 123 for status must be type string,\n' +
        'Input 123 for status must be equal to one of the allowed values: active or deleted.\n' +
        'Refer to https://docs.cord.com/rest-apis/groups/',
    });
  });

  test('invalid members field', async () => {
    {
      const { statusCode, body } = await apiCall()
        .put(`/v1/organizations/${organization.externalID}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          members: 123,
        });

      expect(statusCode).toBe(400);
      expect(body).toMatchObject({
        error: 'invalid_request',
        message:
          'Invalid UpdatePlatformGroupVariables:\n' +
          'Input 123 for members must be type array.\n' +
          'Refer to https://docs.cord.com/rest-apis/groups/',
      });
    }

    {
      const { statusCode, body } = await apiCall()
        .put(`/v1/organizations/${organization.externalID}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          members: [{ member: 123 }, 456],
        });

      expect(statusCode).toBe(400);
      expect(body).toMatchObject({
        error: 'invalid_request',
        message:
          'Invalid UpdatePlatformGroupVariables:\n' +
          'Input {"member":123} for members/0 must be type string or number.\n' +
          'Refer to https://docs.cord.com/rest-apis/groups/',
      });
    }
  });

  test('member user does not exist', async () => {
    const INVALID_MEMBER_ID = 'InvalidMemberID';
    const { statusCode, body } = await apiCall()
      .put(`/v1/organizations/${organization.externalID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        members: [INVALID_MEMBER_ID],
      });

    expect(statusCode).toBe(401);
    expect(body).toMatchObject({
      error: 'user_not_found',
      message: `Platform user ${INVALID_MEMBER_ID} not found.`,
    });
  });

  test('invalid field', async () => {
    const { statusCode, body } = await apiCall()
      .put(`/v1/organizations/${organization.externalID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        screen_name: 'Adora',
      });

    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_request',
      message:
        'Invalid UpdatePlatformGroupVariables:\n' +
        'Input {"screen_name":"Adora"} has unexpected field: screen_name.\n' +
        'Refer to https://docs.cord.com/rest-apis/groups/',
    });
  });

  test('missing name input type', async () => {
    const { statusCode, body } = await apiCall()
      .put(`/v1/organizations/cordgi`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        members: ['andrei'],
      });
    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'missing_field',
      message:
        'Invalid UpdatePlatformGroupVariables:\n' +
        'Group does not exist, "name" is a required field to create a new group.',
    });
  });

  test('will not create org if one member user does not exist', async () => {
    const INVALID_MEMBER_ID = 'InvalidMemberID';
    const VALID_MEMBER_ID = andreiUser.externalID;
    const ORG_ID = 'new_org';
    const { statusCode, body } = await apiCall()
      .put(`/v1/organizations/${ORG_ID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'foo',
        members: [VALID_MEMBER_ID, INVALID_MEMBER_ID],
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

  test('will not create org if member users do not exist', async () => {
    const INVALID_MEMBER_ID = 'InvalidMemberID';
    const ANOTHER_INVALID_MEMBER_ID = 'AnotherInValidMemberID';
    const ORG_ID = 'new_org';
    const { statusCode, body } = await apiCall()
      .put(`/v1/organizations/${ORG_ID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'foo',
        members: [INVALID_MEMBER_ID, ANOTHER_INVALID_MEMBER_ID],
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
      message: `Platform users ${INVALID_MEMBER_ID} and ${ANOTHER_INVALID_MEMBER_ID} not found.`,
    });
  });

  test("will create an organization if it doesn't exist", async () => {
    const ORG_ID = 'org_id_that_doesnt_exist';

    const { statusCode, body } = await apiCall()
      .put(`/v1/organizations/${ORG_ID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'foo',
        members: [andreiUser.externalID],
      });

    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      success: true,
    });

    const org = await OrgEntity.findOne({
      where: {
        externalID: ORG_ID,
        externalProvider: AuthProviderType.PLATFORM,
        platformApplicationID: application.id,
      },
    });

    expect(org).toBeTruthy();
    expect(org?.name).toBe('foo');
    expect(org?.state).toBe('active');

    const orgMembers = await OrgMembersEntity.findAll({
      where: {
        orgID: org!.id,
      },
    });

    expect(orgMembers).toBeTruthy();
    expect(orgMembers.length).toBe(1);

    const andreiOrgMemberField = orgMembers.find(
      (orgMember) => orgMember.userID === andreiUser.id,
    );

    expect(andreiOrgMemberField).toBeTruthy();
    expect(andreiOrgMemberField?.userID).toBe(andreiUser.id);
  });

  test('can successfully update an organization', async () => {
    const testOrg = await OrgEntity.create({
      state: 'active',
      name: 'testOrg1',
      externalID: 'testOrgExternalID1',
      externalProvider: AuthProviderType.PLATFORM,
      platformApplicationID: application.id,
    });

    const { statusCode, body } = await apiCall()
      .put(`/v1/organizations/${testOrg.externalID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'baz',
        status: 'deleted',
        members: [andreiUser.externalID],
      });

    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      success: true,
    });

    const org = await OrgEntity.findOne({
      where: {
        externalID: testOrg.externalID,
        externalProvider: AuthProviderType.PLATFORM,
        platformApplicationID: application.id,
      },
    });

    expect(org).toBeTruthy();
    expect(org?.name).toBe('baz');
    expect(org?.state).toBe('inactive');

    const orgMembers = await OrgMembersEntity.findAll({
      where: {
        orgID: org!.id,
      },
    });

    expect(orgMembers).toBeTruthy();
    expect(orgMembers.length).toBe(1);

    const andreiOrgMemberField = orgMembers.find(
      (orgMember) => orgMember.userID === andreiUser.id,
    );

    expect(andreiOrgMemberField).toBeTruthy();
    expect(andreiOrgMemberField?.userID).toBe(andreiUser.id);
  });

  test('can successfully update an organization from 2 active members to one new active member', async () => {
    const testOrg = await OrgEntity.create({
      state: 'active',
      name: 'testOrg2',
      externalID: 'testOrgExternalID2',
      externalProvider: AuthProviderType.PLATFORM,
      platformApplicationID: application.id,
    });

    await createUserAndOrgMember({
      name: 'myhoa',
      externalID: 'myhoa',
      appID: application.id,
      email: 'myhoa@myhoa.com',
      orgID: testOrg.id,
      externalProvider: AuthProviderType.PLATFORM,
    });
    await createUserAndOrgMember({
      name: 'terrence',
      externalID: 'terrence',
      appID: application.id,
      email: 'terrence@terrence.com',
      orgID: testOrg.id,
      externalProvider: AuthProviderType.PLATFORM,
    });

    const { statusCode, body } = await apiCall()
      .put(`/v1/organizations/${testOrg.externalID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        members: [andreiUser.externalID],
      });

    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      success: true,
    });

    const org = await OrgEntity.findOne({
      where: {
        externalID: testOrg.externalID,
        externalProvider: AuthProviderType.PLATFORM,
        platformApplicationID: application.id,
      },
    });

    expect(org).toBeTruthy();

    const orgMembers = await OrgMembersEntity.findAll({
      where: {
        orgID: org!.id,
      },
    });

    expect(orgMembers).toBeTruthy();
    expect(orgMembers.length).toBe(1);

    const andreiOrgMemberField = orgMembers.find(
      (orgMember) => orgMember.userID === andreiUser.id,
    );

    expect(andreiOrgMemberField).toBeTruthy();
  });

  test('can successfully update an organization from 2 active members to no active members', async () => {
    const testOrg = await OrgEntity.create({
      state: 'active',
      name: 'testOrg3',
      externalID: 'testOrgExternalID3',
      externalProvider: AuthProviderType.PLATFORM,
      platformApplicationID: application.id,
    });

    await createUserAndOrgMember({
      name: 'myhoa',
      externalID: 'myhoa',
      appID: application.id,
      email: 'myhoa@myhoa.com',
      orgID: testOrg.id,
      externalProvider: AuthProviderType.PLATFORM,
    });
    await createUserAndOrgMember({
      name: 'terrence',
      externalID: 'terrence',
      appID: application.id,
      email: 'terrence@terrence.com',
      orgID: testOrg.id,
      externalProvider: AuthProviderType.PLATFORM,
    });

    const { statusCode, body } = await apiCall()
      .put(`/v1/organizations/${testOrg.externalID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        members: [],
      });

    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      success: true,
    });

    const org = await OrgEntity.findOne({
      where: {
        externalID: testOrg.externalID,
        externalProvider: AuthProviderType.PLATFORM,
        platformApplicationID: application.id,
      },
    });

    expect(org).toBeTruthy();

    const orgMembers = await OrgMembersEntity.findAll({
      where: {
        orgID: org!.id,
      },
    });

    expect(orgMembers).toBeTruthy();
    expect(orgMembers.length).toBe(0);
  });

  test('can successfully add new member to organization using number input for member', async () => {
    const testOrg = await OrgEntity.create({
      state: 'active',
      name: 'testOrg100',
      externalID: 'testOrgExternalID100',
      externalProvider: AuthProviderType.PLATFORM,
      platformApplicationID: application.id,
    });

    const EXTERNAL_USER_ID = 100;
    const EXTERNAL_USER_ID_TO_STRING = EXTERNAL_USER_ID.toString();

    await createRandomPlatformUser(application.id, {
      externalID: EXTERNAL_USER_ID_TO_STRING,
      name: 'jane doe',
    });

    const { statusCode, body } = await apiCall()
      .put(`/v1/organizations/${testOrg.externalID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        members: [EXTERNAL_USER_ID],
      });

    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      success: true,
    });

    const { statusCode: getStatusCode, body: getBody } = await apiCall()
      .get(`/v1/organizations/${testOrg.externalID}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(getStatusCode).toBe(200);
    expect(getBody).toMatchObject({
      id: testOrg.externalID,
      status: testOrg.state,
      name: testOrg.name,
      members: [EXTERNAL_USER_ID_TO_STRING],
    });
  });
});

test('create platform org on groups route', async () => {
  const ORG_ID = 'org_id_that_doesnt_exist';

  const { statusCode, body } = await apiCall()
    .put(`/v1/groups/${ORG_ID}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      name: 'foo',
      members: [andreiUser.externalID],
    });

  expect(statusCode).toBe(200);
  expect(body).toMatchObject({
    success: true,
  });

  const org = await OrgEntity.findOne({
    where: {
      externalID: ORG_ID,
      externalProvider: AuthProviderType.PLATFORM,
      platformApplicationID: application.id,
    },
  });

  expect(org).toBeTruthy();
  expect(org?.name).toBe('foo');
  expect(org?.state).toBe('active');

  const orgMembers = await OrgMembersEntity.findAll({
    where: {
      orgID: org!.id,
    },
  });

  expect(orgMembers).toBeTruthy();
  expect(orgMembers.length).toBe(1);

  const andreiOrgMemberField = orgMembers.find(
    (orgMember) => orgMember.userID === andreiUser.id,
  );

  expect(andreiOrgMemberField).toBeTruthy();
  expect(andreiOrgMemberField?.userID).toBe(andreiUser.id);
});

test('can successfully update a group on groups route', async () => {
  const testOrg = await OrgEntity.create({
    state: 'active',
    name: 'testOrg4',
    externalID: 'testOrgExternalID4',
    externalProvider: AuthProviderType.PLATFORM,
    platformApplicationID: application.id,
  });

  const { statusCode, body } = await apiCall()
    .put(`/v1/groups/${testOrg.externalID}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      name: 'baz',
      status: 'deleted',
      members: [andreiUser.externalID],
    });

  expect(statusCode).toBe(200);
  expect(body).toMatchObject({
    success: true,
  });
});
