import Stripe from 'stripe';

import { CONSOLE_ORIGIN } from 'common/const/Urls.ts';
import type { Resolvers } from 'server/src/console/resolverTypes.ts';
import { consoleUserToCustomerID } from 'server/src/console/utils.ts';
import { CustomerEntity } from 'server/src/entity/customer/CustomerEntity.ts';

export const redirectToStripeCustomerPortalResolver: Resolvers['Mutation']['redirectToStripeCustomerPortal'] =
  async (_, __, context) => {
    const customerID = await consoleUserToCustomerID(
      context.session.viewer,
      context.loaders.consoleUserLoader,
    );
    if (!customerID) {
      return {
        success: false,
        failureDetails: { code: 'no_customer_id', message: null },
        redirectURL: null,
      };
    }
    const customer = await CustomerEntity.findByPk(customerID);
    if (!customer || !customer.stripeCustomerID) {
      throw new Error('Could not find customer or stripe customer id');
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const session = await stripe.billingPortal.sessions.create({
      customer: customer?.stripeCustomerID,
      return_url: `${CONSOLE_ORIGIN}/billing/`,
    });

    return {
      success: true,
      failureDetails: null,
      redirectURL: session.url,
    };
  };
