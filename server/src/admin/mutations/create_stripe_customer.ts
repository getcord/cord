import Stripe from 'stripe';
import type { Resolvers } from 'server/src/admin/resolverTypes.ts';
import { getOrCreateStripeCustomer } from 'server/src/util/stripe.ts';

export const createStripeCustomerResolver: Resolvers['Mutation']['createStripeCustomer'] =
  async (_, args, _context) => {
    const { id: customerID, email, country, postcode } = args;

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    try {
      await getOrCreateStripeCustomer({
        stripe,
        customerID,
        email,
        country,
        postcode,
      });

      return {
        success: true,
        failureDetails: null,
      };
    } catch (e: any) {
      return {
        success: false,
        failureDetails: { code: '400', message: e.message },
      };
    }
  };
