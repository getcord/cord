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

describe('Platform API: /v1/organizations/:orgID/members', () => {
  beforeAll(async () => {
    ({ application, organization, andreiUser, accessToken } =
      await setupPlatformTest());
  });

  test('too many fields', async () => {
    const { statusCode, body } = await apiCall()
      .post(`/v1/organizations/${organization.externalID}/members`)
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
        'Invalid UpdatePlatformGroupMembersVariables:\n' +
        'Input {"foo":"bar","bar":"baz","baz":"foo","jazz":"pop"} has unexpected fields: foo, bar, baz and jazz.\n' +
        'Refer to https://docs.cord.com/rest-apis/groups/',
    });
  });

  test('invalid add field', async () => {
    {
      const { statusCode, body } = await apiCall()
        .post(`/v1/organizations/${organization.externalID}/members`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          add: 123,
        });

      expect(statusCode).toBe(400);
      expect(body).toMatchObject({
        error: 'invalid_request',
        message:
          'Invalid UpdatePlatformGroupMembersVariables:\n' +
          'Input 123 for add must be type array.\n' +
          'Refer to https://docs.cord.com/rest-apis/groups/',
      });
    }

    {
      const { statusCode, body } = await apiCall()
        .post(`/v1/organizations/${organization.externalID}/members`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          add: [{ member: 123 }, { member: 456 }],
        });

      expect(statusCode).toBe(400);
      expect(body).toMatchObject({
        error: 'invalid_request',
        message:
          'Invalid UpdatePlatformGroupMembersVariables:\n' +
          'Input {"member":123} for add/0 must be type string or number,\n' +
          'Input {"member":456} for add/1 must be type string or number.\n' +
          'Refer to https://docs.cord.com/rest-apis/groups/',
      });
    }
  });

  test('invalid remove field', async () => {
    {
      const { statusCode, body } = await apiCall()
        .post(`/v1/organizations/${organization.externalID}/members`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          remove: 123,
        });

      expect(statusCode).toBe(400);
      expect(body).toMatchObject({
        error: 'invalid_request',
        message:
          'Invalid UpdatePlatformGroupMembersVariables:\n' +
          'Input 123 for remove must be type array.\n' +
          'Refer to https://docs.cord.com/rest-apis/groups/',
      });
    }

    {
      const { statusCode, body } = await apiCall()
        .post(`/v1/organizations/${organization.externalID}/members`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          remove: [{ member: 123 }, { member: 456 }],
        });

      expect(statusCode).toBe(400);
      expect(body).toMatchObject({
        error: 'invalid_request',
        message:
          'Invalid UpdatePlatformGroupMembersVariables:\n' +
          'Input {"member":123} for remove/0 must be type string or number,\n' +
          'Input {"member":456} for remove/1 must be type string or number.\n' +
          'Refer to https://docs.cord.com/rest-apis/groups/',
      });
    }
  });

  test('cannot add and remove same member', async () => {
    const { statusCode, body } = await apiCall()
      .post(`/v1/organizations/${organization.externalID}/members`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        add: [andreiUser.externalID],
        remove: [andreiUser.externalID],
      });

    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      error: 'invalid_field',
      message: `Platform member ${andreiUser.externalID} both added and removed.`,
    });
  });

  test('member user does not exist', async () => {
    const INVALID_MEMBER_ID = 'InvalidMemberID';
    {
      const { statusCode, body } = await apiCall()
        .post(`/v1/organizations/${organization.externalID}/members`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          add: [INVALID_MEMBER_ID],
        });

      expect(statusCode).toBe(401);
      expect(body).toMatchObject({
        error: 'user_not_found',
        message: `Platform user ${INVALID_MEMBER_ID} not found. If you wanted to create a new user, add user_details to your request. Refer to https://docs.cord.com/reference/authentication#JSON-user-details for details.`,
      });
    }

    {
      const { statusCode, body } = await apiCall()
        .post(`/v1/organizations/${organization.externalID}/members`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          remove: [INVALID_MEMBER_ID],
        });

      expect(statusCode).toBe(401);
      expect(body).toMatchObject({
        error: 'user_not_found',
        message: `Platform user ${INVALID_MEMBER_ID} not found. If you wanted to create a new user, add user_details to your request. Refer to https://docs.cord.com/reference/authentication#JSON-user-details for details.`,
      });
    }
  });

  test('can successfully add member', async () => {
    const testOrg = await OrgEntity.create({
      state: 'active',
      name: 'testOrg4',
      externalID: 'testOrgExternalID4',
      externalProvider: AuthProviderType.PLATFORM,
      platformApplicationID: application.id,
    });

    const { statusCode, body } = await apiCall()
      .post(`/v1/organizations/${testOrg.externalID}/members`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        add: [andreiUser.externalID],
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
    expect(org?.name).toBe('testOrg4');

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

  test('can successfully add member using number input', async () => {
    const testOrg = await OrgEntity.create({
      state: 'active',
      name: 'testOrg101',
      externalID: 'testOrgExternalID101',
      externalProvider: AuthProviderType.PLATFORM,
      platformApplicationID: application.id,
    });

    const EXTERNAL_USER_ID = 101;

    const randomUser = await createRandomPlatformUser(application.id, {
      externalID: EXTERNAL_USER_ID.toString(),
      name: 'jane doe',
    });

    const { statusCode, body } = await apiCall()
      .post(`/v1/organizations/${testOrg.externalID}/members`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        add: [EXTERNAL_USER_ID],
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
    expect(org?.name).toBe('testOrg101');

    const orgMembers = await OrgMembersEntity.findAll({
      where: {
        orgID: org!.id,
      },
    });

    expect(orgMembers).toBeTruthy();
    expect(orgMembers.length).toBe(1);

    const randomUserOrgMemberField = orgMembers.find(
      (orgMember) => orgMember.userID === randomUser.id,
    );

    expect(randomUserOrgMemberField).toBeTruthy();
    expect(randomUserOrgMemberField?.userID).toBe(randomUser.id);
  });

  test('can successfully remove member', async () => {
    const testOrg = await OrgEntity.create({
      state: 'active',
      name: 'testOrg5',
      externalID: 'testOrgExternalID5',
      externalProvider: AuthProviderType.PLATFORM,
      platformApplicationID: application.id,
    });

    const myhoaUser = await createUserAndOrgMember({
      name: 'myhoa',
      externalID: 'myhoa',
      appID: application.id,
      email: 'myhoa@myhoa.com',
      orgID: testOrg.id,
      externalProvider: AuthProviderType.PLATFORM,
    });

    const { statusCode, body } = await apiCall()
      .post(`/v1/organizations/${testOrg.externalID}/members`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        remove: [myhoaUser.externalID],
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
    expect(org?.name).toBe('testOrg5');

    const orgMembers = await OrgMembersEntity.findAll({
      where: {
        orgID: org!.id,
      },
    });

    expect(orgMembers).toBeTruthy();
    expect(orgMembers.length).toBe(0);
  });

  test('can successfully remove member using number input', async () => {
    const EXTERNAL_USER_ID = 102;
    const EXTERNAL_USER_ID_TO_STRING = EXTERNAL_USER_ID.toString();

    const testOrg = await OrgEntity.create({
      state: 'active',
      name: 'testOrg102',
      externalID: 'testOrgExternalID102',
      externalProvider: AuthProviderType.PLATFORM,
      platformApplicationID: application.id,
    });

    await createUserAndOrgMember({
      name: 'myhoa',
      externalID: EXTERNAL_USER_ID_TO_STRING,
      appID: application.id,
      email: 'myhoa@myhoa.com',
      orgID: testOrg.id,
      externalProvider: AuthProviderType.PLATFORM,
    });

    const { statusCode, body } = await apiCall()
      .post(`/v1/organizations/${testOrg.externalID}/members`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        remove: [EXTERNAL_USER_ID],
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
    expect(org?.name).toBe('testOrg102');

    const orgMembers = await OrgMembersEntity.findAll({
      where: {
        orgID: org!.id,
      },
    });

    expect(orgMembers).toBeTruthy();
    expect(orgMembers.length).toBe(0);
  });

  test('can successfully add and remove member simultaneously', async () => {
    const testOrg = await OrgEntity.create({
      state: 'active',
      name: 'testOrg6',
      externalID: 'testOrgExternalID6',
      externalProvider: AuthProviderType.PLATFORM,
      platformApplicationID: application.id,
    });

    const myhoaUser = await createUserAndOrgMember({
      name: 'myhoa',
      externalID: 'myhoa',
      appID: application.id,
      email: 'myhoa@myhoa.com',
      orgID: testOrg.id,
      externalProvider: AuthProviderType.PLATFORM,
    });
    const terrenceUser = await createUserAndOrgMember({
      name: 'terrence',
      externalID: 'terrence',
      appID: application.id,
      email: 'terrence@terrence.com',
      orgID: testOrg.id,
      externalProvider: AuthProviderType.PLATFORM,
    });

    const { statusCode, body } = await apiCall()
      .post(`/v1/organizations/${testOrg.externalID}/members`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        add: [andreiUser.externalID],
        remove: [myhoaUser.externalID],
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
    expect(org?.name).toBe('testOrg6');

    const orgMembers = await OrgMembersEntity.findAll({
      where: {
        orgID: org!.id,
      },
    });

    expect(orgMembers).toBeTruthy();
    expect(orgMembers.length).toBe(2);

    const andreiOrgMemberField = orgMembers.find(
      (orgMember) => orgMember.userID === andreiUser.id,
    );

    expect(andreiOrgMemberField).toBeTruthy();
    expect(andreiOrgMemberField?.userID).toBe(andreiUser.id);

    const terrenceOrgMemberField = orgMembers.find(
      (orgMember) => orgMember.userID === terrenceUser.id,
    );

    expect(terrenceOrgMemberField).toBeTruthy();
    expect(terrenceOrgMemberField?.userID).toBe(terrenceUser.id);
  });

  test('can call multiple times without issues', async () => {
    const testOrg = await OrgEntity.create({
      state: 'active',
      name: 'testOrg7',
      externalID: 'testOrgExternalID7',
      externalProvider: AuthProviderType.PLATFORM,
      platformApplicationID: application.id,
    });

    const { statusCode, body } = await apiCall()
      .post(`/v1/organizations/${testOrg.externalID}/members`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        add: [andreiUser.externalID],
      });

    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      success: true,
    });

    const { statusCode: statusCode2, body: body2 } = await apiCall()
      .post(`/v1/organizations/${testOrg.externalID}/members`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        add: [andreiUser.externalID],
      });

    expect(statusCode2).toBe(200);
    expect(body2).toMatchObject({
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
    expect(org?.name).toBe('testOrg7');

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

  test('can successfully add member on groups route', async () => {
    const testOrg = await OrgEntity.create({
      state: 'active',
      name: 'testOrg8',
      externalID: 'testOrgExternalID8',
      externalProvider: AuthProviderType.PLATFORM,
      platformApplicationID: application.id,
    });

    const { statusCode, body } = await apiCall()
      .post(`/v1/groups/${testOrg.externalID}/members`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        add: [andreiUser.externalID],
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
    expect(andreiOrgMemberField?.userID).toBe(andreiUser.id);
  });
});
