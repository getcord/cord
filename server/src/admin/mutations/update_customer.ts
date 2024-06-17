import type { Maybe } from 'common/types/index.ts';
import { isDefined } from 'common/util/index.ts';
import type { Resolvers } from 'server/src/admin/resolverTypes.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { CustomerEntity } from 'server/src/entity/customer/CustomerEntity.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';

export const updateCustomerResolver: Resolvers['Mutation']['updateCustomer'] =
  async (_, args, _context) => {
    const {
      id,
      name,
      type,
      implementationStage,
      launchDate,
      slackChannel,
      pricingTier,
      billingStatus,
      billingType,
      stripeCustomerID,
      addons,
      renewalDate,
      planDescription,
    } = args;

    const billingStatusTranslated =
      billingStatus === 'unpaid' ? 'past_due' : billingStatus;

    try {
      let updated = 0;

      let stripeCustomerValue = stripeCustomerID;
      if (stripeCustomerID !== null && stripeCustomerID !== undefined) {
        if (stripeCustomerID.trim().length === 0) {
          stripeCustomerValue = null;
        } else {
          stripeCustomerValue = stripeCustomerID.trim();
        }
      }

      const transformedAddons =
        addons &&
        addons.reduce((obj: CustomerEntity['addons'], item) => {
          obj[item.key] = item.value;
          return obj;
        }, {});

      await getSequelize().transaction(async (transaction) => {
        [updated] = await CustomerEntity.update(
          {
            name,
            type,
            implementationStage,
            launchDate,
            slackChannel: normalizeSlackChannel(slackChannel),
            pricingTier,
            billingStatus: billingStatusTranslated,
            billingType,
            stripeCustomerID: stripeCustomerValue,
            addons: transformedAddons,
            renewalDate,
            planDescription,
          },
          { where: { id }, transaction },
        );

        // Explicitly mark applications as no longer `sample` if the customer is now verified
        if (type === 'verified') {
          await ApplicationEntity.update(
            { environment: 'production' },
            { where: { customerID: id, environment: 'sample' }, transaction },
          );
        }
      });
      return {
        success: updated === 1,
        failureDetails: null,
      };
    } catch (e) {
      return {
        success: false,
        failureDetails: null,
      };
    }
  };

function normalizeSlackChannel(
  slackChannel: Maybe<string>,
): string | null | undefined {
  if (slackChannel === undefined) {
    return undefined;
  }
  if (!isDefined(slackChannel)) {
    return null;
  }
  slackChannel = slackChannel.trim();
  if (slackChannel.startsWith('#')) {
    slackChannel = slackChannel.substring(1);
  }
  return slackChannel === '' ? null : slackChannel;
}
