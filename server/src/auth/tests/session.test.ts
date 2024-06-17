import * as jsonwebtoken from 'jsonwebtoken';
import { Op, QueryTypes } from 'sequelize';
import { AuthProviderType } from 'server/src/auth/index.ts';

import { decodeSessionFromJWT } from 'server/src/auth/session.ts';
import type { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { ApiCallerError } from 'server/src/public/routes/platform/util.ts';
import {
  createPlatformApplication,
  createRandomPlatformUserAndOrgMember,
} from 'server/src/public/routes/tests/util.ts';
import 'server/src/tests/setupEnvironment';

let application: ApplicationEntity;
let organization: OrgEntity;

function sign(data: any) {
  return jsonwebtoken.sign(data, application.sharedSecret, {
    expiresIn: '1 min',
    algorithm: 'HS512',
  });
}

describe('Test decoding JWT', () => {
  beforeAll(async () => {
    application = await createPlatformApplication('platform app', 'secret');
    organization = await OrgEntity.create({
      state: 'active',
      name: 'cord',
      externalID: 'cord',
      externalProvider: AuthProviderType.PLATFORM,
      platformApplicationID: application.id,
    });
  });

  afterEach(async () => {
    await getSequelize().transaction(async (transaction) => {
      await getSequelize().query(
        `DELETE FROM org_members USING users
           WHERE org_members."userID"=users.id
           AND users."platformApplicationID"=$1;`,
        {
          type: QueryTypes.DELETE,
          bind: [application.id],
          transaction,
        },
      );
      await UserEntity.destroy({
        where: {
          platformApplicationID: application.id,
        },
        transaction,
      });
      await OrgEntity.destroy({
        where: {
          platformApplicationID: application.id,
          externalID: { [Op.ne]: 'cord' },
        },
        transaction,
      });
    });
  });

  test('Decode session JWT with existing user', async () => {
    const user = await createRandomPlatformUserAndOrgMember(
      application.id,
      organization.id,
    );

    const session = await decodeSessionFromJWT(
      sign({
        app_id: application.id,
        user_id: user.externalID,
        organization_id: organization.externalID,
      }),
    );

    expect(session.viewer).toMatchObject({
      userID: user.id,
      orgID: organization.id,
      externalUserID: user.externalID,
      externalOrgID: organization.externalID,
      platformApplicationID: application.id,
    });
  });

  test('Decode session JWT with incorrect user', async () => {
    const user = await createRandomPlatformUserAndOrgMember(
      application.id,
      organization.id,
    );

    await expect(
      decodeSessionFromJWT(
        sign({
          app_id: application.id,
          user_id: user.externalID + 'whoops',
          organization_id: organization.externalID,
        }),
      ),
    ).rejects.toBeInstanceOf(ApiCallerError);
  });

  test('Decode session JWT with incorrect org', async () => {
    const user = await createRandomPlatformUserAndOrgMember(
      application.id,
      organization.id,
    );

    await expect(
      decodeSessionFromJWT(
        sign({
          app_id: application.id,
          user_id: user.externalID,
          organization_id: organization.externalID + 'whoops',
        }),
      ),
    ).rejects.toBeInstanceOf(ApiCallerError);
  });

  test('Decode session JWT with missing org', async () => {
    const user = await createRandomPlatformUserAndOrgMember(
      application.id,
      organization.id,
    );

    const session = await decodeSessionFromJWT(
      sign({
        app_id: application.id,
        user_id: user.externalID,
      }),
    );

    expect(session.viewer).toMatchObject({
      userID: user.id,
      orgID: undefined,
      externalUserID: user.externalID,
      externalOrgID: undefined,
      platformApplicationID: application.id,
      relevantOrgIDs: [organization.id],
    });
  });

  test('Decode session JWT with new user', async () => {
    const session = await decodeSessionFromJWT(
      sign({
        app_id: application.id,
        user_id: 'new_user',
        organization_id: organization.externalID,
        user_details: {
          email: 'new_user@cord.com',
          name: 'New User',
          first_name: 'New',
          last_name: 'User',
        },
      }),
    );

    const user = await UserEntity.findOne({
      where: {
        platformApplicationID: application.id,
        externalID: 'new_user',
      },
    });
    expect(user).not.toBeNull();
    expect(user!.name).toBe('New User');
    expect(user!.email).toBe('new_user@cord.com');

    expect(session.viewer).toMatchObject({
      userID: user!.id,
      orgID: organization.id,
      externalUserID: user!.externalID,
      externalOrgID: organization.externalID,
      platformApplicationID: application.id,
    });
  });

  test('Decode session JWT with new user empty string email', async () => {
    const session = await decodeSessionFromJWT(
      sign({
        app_id: application.id,
        user_id: 'new_user',
        organization_id: organization.externalID,
        user_details: {
          email: '',
          name: 'New User',
          first_name: 'New',
          last_name: 'User',
        },
      }),
    );

    const user = await UserEntity.findOne({
      where: {
        platformApplicationID: application.id,
        externalID: 'new_user',
      },
    });
    expect(user).not.toBeNull();
    expect(user!.name).toBe('New User');
    expect(user!.email).toBeNull();

    expect(session.viewer).toMatchObject({
      userID: user!.id,
      orgID: organization.id,
      externalUserID: user!.externalID,
      externalOrgID: organization.externalID,
      platformApplicationID: application.id,
    });
  });

  test('Decode session JWT with new organization', async () => {
    const user = await createRandomPlatformUserAndOrgMember(
      application.id,
      organization.id,
    );

    const session = await decodeSessionFromJWT(
      sign({
        app_id: application.id,
        user_id: user.externalID,
        organization_id: 'new_org',
        organization_details: {
          name: 'New Org',
        },
      }),
    );

    const org = await OrgEntity.findOne({
      where: {
        platformApplicationID: application.id,
        externalID: 'new_org',
      },
    });
    expect(org).not.toBeNull();
    expect(org!.name).toBe('New Org');

    expect(session.viewer).toMatchObject({
      userID: user.id,
      orgID: org!.id,
      externalUserID: user.externalID,
      externalOrgID: org!.externalID,
      platformApplicationID: application.id,
    });
  });

  test('Decode session JWT with invalid new organization', async () => {
    const user = await createRandomPlatformUserAndOrgMember(
      application.id,
      organization.id,
    );

    await expect(
      decodeSessionFromJWT(
        sign({
          app_id: application.id,
          user_id: user.externalID,
          organization_id: 'new_org',
          organization_details: {
            // Missing name
          },
        }),
      ),
    ).rejects.toBeInstanceOf(ApiCallerError);
  });

  test('Decode session JWT with new user and org', async () => {
    const session = await decodeSessionFromJWT(
      sign({
        app_id: application.id,
        user_id: 'new_user',
        organization_id: 'new_org',
        user_details: {
          email: 'new_user@cord.com',
          name: 'New User',
          first_name: 'New',
          last_name: 'User',
        },
        organization_details: {
          name: 'New Org',
        },
      }),
    );

    const user = await UserEntity.findOne({
      where: {
        platformApplicationID: application.id,
        externalID: 'new_user',
      },
    });
    expect(user).not.toBeNull();
    expect(user!.name).toBe('New User');
    expect(user!.email).toBe('new_user@cord.com');

    const org = await OrgEntity.findOne({
      where: {
        platformApplicationID: application.id,
        externalID: 'new_org',
      },
    });
    expect(org).not.toBeNull();
    expect(org!.name).toBe('New Org');

    expect(session.viewer).toMatchObject({
      userID: user!.id,
      orgID: org!.id,
      externalUserID: user!.externalID,
      externalOrgID: org!.externalID,
      platformApplicationID: application.id,
    });
  });

  test('Handle session JWT with two users that have the same externalID in different applications', async () => {
    const [app1, app2] = await Promise.all([
      createPlatformApplication('platform app 1', 'secret'),
      createPlatformApplication('platform app 2', 'secret'),
    ]);

    // Note: it seems like it's important that these two decodeSessionFromJWT happen serially rather than in a Promise.all

    const session1 = await decodeSessionFromJWT(
      sign({
        app_id: app1.id,
        user_id: 'andrei',
        organization_id: 'cord',
        user_details: {
          email: 'andrei@cord.com',
          name: 'andrei',
          first_name: 'andrei',
          last_name: 'g',
        },
        organization_details: {
          name: 'cord',
        },
      }),
    );

    const session2 = await decodeSessionFromJWT(
      sign({
        app_id: app2.id,
        user_id: 'andrei',
        organization_id: 'cord',
        user_details: {
          email: 'andrei@cord.com',
          name: 'andrei',
          first_name: 'andrei',
          last_name: 'g',
        },
        organization_details: {
          name: 'cord',
        },
      }),
    );

    const [user1, user2] = await Promise.all([
      UserEntity.findOne({
        where: {
          platformApplicationID: app1.id,
          externalID: 'andrei',
        },
      }),
      UserEntity.findOne({
        where: {
          platformApplicationID: app2.id,
          externalID: 'andrei',
        },
      }),
    ]);

    expect(user1).not.toBeNull();
    expect(user1!.name).toBe('andrei');
    expect(user1!.email).toBe('andrei@cord.com');

    expect(user2).not.toBeNull();
    expect(user2!.name).toBe('andrei');
    expect(user2!.email).toBe('andrei@cord.com');

    const [org1, org2] = await Promise.all([
      OrgEntity.findOne({
        where: {
          platformApplicationID: app1.id,
          externalID: 'cord',
        },
      }),
      OrgEntity.findOne({
        where: {
          platformApplicationID: app2.id,
          externalID: 'cord',
        },
      }),
    ]);

    expect(org1).not.toBeNull();
    expect(org1!.name).toBe('cord');
    expect(org2).not.toBeNull();
    expect(org2!.name).toBe('cord');

    expect(session1.viewer).toMatchObject({
      userID: user1!.id,
      orgID: org1!.id,
      externalUserID: 'andrei',
      externalOrgID: 'cord',
      platformApplicationID: app1.id,
    });

    expect(session2.viewer).toMatchObject({
      userID: user2!.id,
      orgID: org2!.id,
      externalUserID: 'andrei',
      externalOrgID: 'cord',
      platformApplicationID: app2.id,
    });
  });
});

test('Decode session JWT with group parameters', async () => {
  const user = await createRandomPlatformUserAndOrgMember(
    application.id,
    organization.id,
  );

  const session = await decodeSessionFromJWT(
    sign({
      app_id: application.id,
      user_id: user.externalID,
      group_id: organization.externalID,
      group_details: {
        name: 'Cordy McCordface',
      },
    }),
  );

  expect(session.viewer).toMatchObject({
    userID: user.id,
    orgID: organization.id,
    externalUserID: user.externalID,
    externalOrgID: organization.externalID,
    platformApplicationID: application.id,
  });

  const org = await OrgEntity.findByPk(organization.id);

  expect(org?.name).toBe('Cordy McCordface');
});
