import { Sequelize } from 'sequelize';
import * as jsonwebtoken from 'jsonwebtoken';
import env from 'server/src/config/Env.ts';
import { AuthProviderType } from 'server/src/auth/index.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { SessionEntity } from 'server/src/entity/session/SessionEntity.ts';
import {
  createPlatformApplication,
  createUserAndOrgMember,
} from 'server/src/public/routes/tests/util.ts';
import { ACCESS_TOKEN_TTL_HOURS } from 'common/const/IntegrationAPI.ts';
import { CustomerEntity } from 'server/src/entity/customer/CustomerEntity.ts';

export async function setupPlatformTest() {
  const customer = await CustomerEntity.create({
    name: 'andrei customer',
  });
  const application = await createPlatformApplication(
    'platform app',
    'secret',
    customer.id,
  );
  const organization = await OrgEntity.create({
    state: 'active',
    name: 'cord',
    externalID: 'cord',
    externalProvider: AuthProviderType.PLATFORM,
    platformApplicationID: application.id,
  });

  const otherOrganization = await OrgEntity.create({
    state: 'active',
    name: 'cord other',
    externalID: 'cord-other',
    externalProvider: AuthProviderType.PLATFORM,
    platformApplicationID: application.id,
  });

  const andreiUser = await createUserAndOrgMember({
    name: 'andrei',
    externalID: 'andrei',
    appID: application.id,
    email: 'andrei@andrei.com',
    orgID: organization.id,
    additionalOrgID: otherOrganization.id,
    externalProvider: AuthProviderType.PLATFORM,
  });

  const session = await SessionEntity.create({
    applicationID: application.id,
    expiresAt: Sequelize.literal(
      `NOW() + INTERVAL '${ACCESS_TOKEN_TTL_HOURS} hours'`,
    ),
  });
  const accessToken = jsonwebtoken.sign(
    { session_id: session.id },
    env.JWT_SIGNING_SECRET,
    { algorithm: 'HS512' },
  );
  const customerAccessToken = jsonwebtoken.sign(
    { customer_id: customer.id },
    customer.sharedSecret,
    {
      algorithm: 'HS512',
    },
  );

  return {
    application,
    organization,
    andreiUser,
    accessToken,
    customer,
    customerAccessToken,
    otherOrganization,
  };
}
