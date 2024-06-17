import freeEmailDomains from 'free-email-domains';
import type { Transaction } from 'sequelize';
import { QueryTypes } from 'sequelize';
import {
  CORD_CUSTOMER_ID,
  CORD_SELF_SERVE_SLACK_CHANNEL_ID,
} from 'common/const/Ids.ts';
import { ADMIN_ORIGIN } from 'common/const/Urls.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import Env from 'server/src/config/Env.ts';
import { makeCustomerName } from 'server/src/console/utils.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { CustomerEntity } from 'server/src/entity/customer/CustomerEntity.ts';
import { EventMutator } from 'server/src/entity/event/EventMutator.ts';
import { ConsoleUserEntity } from 'server/src/entity/user/ConsoleUserEntity.ts';
import type { ConsoleUserMutator } from 'server/src/entity/user/ConsoleUserMutator.ts';
import { sendMessageToCord } from 'server/src/slack/util.ts';
import {
  extractFromGACookies,
  sendEventToGoogleAnalytics,
} from 'server/src/util/google-analytics.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { parseEmailAddress } from 'server/src/email/utils.ts';
import type { FlagsUser } from 'server/src/featureflags/index.ts';
import {
  FeatureFlags,
  flagsUserFromContext,
  getTypedFeatureFlagValue,
} from 'server/src/featureflags/index.ts';
import {
  FREE_APP_LIMIT,
  FREE_SEATS_LIMIT,
  PRO_APP_LIMIT,
  PRO_SEATS_LIMIT,
} from 'common/const/Billing.ts';

export async function createNewCustomer({
  email,
  context,
  signupCoupon,
  consoleMutator,
  user,
  parentTransaction,
}: {
  email: string;
  context: RequestContext;
  signupCoupon?: string | null;
  consoleMutator: ConsoleUserMutator;
  user: ConsoleUserEntity;
  parentTransaction?: Transaction;
}) {
  await getSequelize().transaction(
    { transaction: parentTransaction },
    async (transaction) => {
      // Creating self serve customer
      const customer = await CustomerEntity.create(
        {
          name: makeCustomerName(email),
          type: 'sample', // Can only create sample customers from the console
          signupCoupon,
        },
        { transaction },
      );

      context.logger.info(`New customer created by: ${user.idForLogging}`);

      const flagUser = flagsUserFromContext(context);
      const billingEnabled = await getTypedFeatureFlagValue(
        FeatureFlags.SHOW_CONSOLE_LANDING_PAGE,
        flagUser,
      );

      if (!billingEnabled) {
        await ApplicationEntity.create(
          {
            name: 'sample-app-1',
            environment: 'sample',
            customerID: customer.id,
          },
          { transaction },
        );
      }

      await consoleMutator.grantCustomerAccess(user, customer.id, transaction);

      const eventMutator = new EventMutator(context.session);
      transaction.afterCommit(async () => {
        await eventMutator.createEvent({
          eventNumber: null,
          pageLoadID: null,
          clientTimestamp: new Date(Date.now()),
          installationID: null,
          type: 'new-customer-self-serve',
          payload: {
            email: user.email,
          },
          metadata: {},
          logLevel: 'info',
        });

        await sendMessageToCord(
          `🌵 New self serve customer ${ADMIN_ORIGIN}/customers/${customer.id} created by ${user.idForLogging}`,
          CORD_SELF_SERVE_SLACK_CHANNEL_ID,
          'selfserve',
        );
      });
    },
  );

  const gaData = extractFromGACookies(context.session.ga);

  if (gaData && Env.CORD_TIER === 'prod') {
    await sendEventToGoogleAnalytics(
      'customer_created_self_serve',
      gaData.gaClientID,
      gaData.gaSessionID,
    );
  }
}

export async function findCustomerIDsWithSameDomainConsoleUsers(
  userEmail: string,
): Promise<string[] | null> {
  const emailAddress = parseEmailAddress(userEmail);

  const emailDomain = emailAddress.domain;

  if (freeEmailDomains.includes(emailDomain)) {
    return null;
  }

  const customerIDsWithSameDomainConsoleUsers = await getSequelize().query<{
    customerID: string;
  }>(
    `
  SELECT DISTINCT "customerID"
    FROM cord.console_users
    WHERE SUBSTRING(email from '@(.*)$') = $1
    AND "customerID" IS NOT NULL;
  `,
    {
      bind: [emailDomain],
      type: QueryTypes.SELECT,
    },
  );

  return customerIDsWithSameDomainConsoleUsers.map(
    ({ customerID }) => customerID,
  );
}

export async function logCustomerActionLimit({
  customerID,
  action,
}: {
  customerID: string;
  action: 'create_application' | 'add_member';
}) {
  const flagsUser: FlagsUser = {
    userID: 'anonymous',
    platformApplicationID: 'console',
    version: null,
    customerID,
  };
  const billing_enabled_in_console = await getTypedFeatureFlagValue(
    FeatureFlags.BILLING_ENABLED_IN_CONSOLE,
    flagsUser,
  );
  if (!billing_enabled_in_console) {
    return;
  }

  const customer = await CustomerEntity.findByPk(customerID);
  // if they are on scale we'll have to customise this per user, so for now they won't
  // have any restrictions
  if (
    !customer ||
    customer.pricingTier === 'scale' ||
    customer.id === CORD_CUSTOMER_ID
  ) {
    return;
  }

  const customerPricingTier = customer.pricingTier;
  // we do not downgrade pricing tiers automatically, so we won't have to account for that
  // and all restrictions will be based on customer's original/current plan.
  if (action === 'create_application') {
    const applicationsCount = await ApplicationEntity.count({
      where: { customerID },
    });

    const appLimit =
      customerPricingTier === 'free' ? FREE_APP_LIMIT : PRO_APP_LIMIT;
    if (applicationsCount > appLimit) {
      await sendMessageToCord(
        `📈 Customer ${customer.name} ${ADMIN_ORIGIN}/customers/${customer.id} - has passed the maximum allowed applications (${applicationsCount}/${appLimit}) on their pricing tier (${customerPricingTier}).`,
        CORD_SELF_SERVE_SLACK_CHANNEL_ID,
        'selfserve',
      );
    }
  }
  if (action === 'add_member') {
    const consoleUsersCount = await ConsoleUserEntity.count({
      where: { customerID },
    });

    const consoleUsersLimit =
      customerPricingTier === 'free' ? FREE_SEATS_LIMIT : PRO_SEATS_LIMIT;
    if (consoleUsersCount > consoleUsersLimit) {
      await sendMessageToCord(
        `📈 Customer ${customer.name} ${ADMIN_ORIGIN}/customers/${customer.id} - has passed the maximum allowed members (${consoleUsersCount}/${consoleUsersLimit}) on their pricing tier (${customerPricingTier}).`,
        CORD_SELF_SERVE_SLACK_CHANNEL_ID,
        'selfserve',
      );
    }
  }
}
