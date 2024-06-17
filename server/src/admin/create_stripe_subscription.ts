import Stripe from 'stripe';
import env from 'server/src/config/Env.ts';
import type { Resolvers } from 'server/src/admin/resolverTypes.ts';
import {
  createSubscription,
  getPlanName,
  finalizeInvoice,
  getStripeCustomerID,
} from 'server/src/util/stripe.ts';

export const createStripeSubscriptionResolver: Resolvers['Mutation']['createStripeSubscription'] =
  async (_, args, _context) => {
    try {
      const { id: customerID, price, recurrence, pricingTier } = args;

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

      const stripeCustomerID = await getStripeCustomerID(customerID);
      if (!stripeCustomerID) {
        throw new Error(
          'the customer does not have a stripe customer attached yet',
        );
      }

      const product = await stripe.products.create({
        name: `Cord - ${getPlanName(pricingTier)} plan`,
        default_price_data: {
          currency: 'USD',
          recurring: { interval: recurrence === 'monthly' ? 'month' : 'year' },
          unit_amount: price,
        },
        metadata: {
          env: env.CORD_TIER,
          customer_id: customerID,
          pricing_tier: pricingTier,
        },
      });

      let stripePriceID = product.default_price;
      if (stripePriceID && typeof stripePriceID === 'object') {
        stripePriceID = stripePriceID.id;
      }

      if (!stripePriceID) {
        throw new Error('could not get the stripe price ID');
      }

      const subscription = await createSubscription({
        stripe,
        stripeCustomerID,
        stripePriceID,
      });

      const invoice = subscription.latest_invoice;
      if (!invoice) {
        throw new Error('could not get invoice from the subscription');
      } else if (typeof invoice === 'string') {
        await finalizeInvoice(stripe, invoice);
      } else {
        await finalizeInvoice(stripe, invoice.id);
      }

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
