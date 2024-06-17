import Stripe from 'stripe';

import { ADMIN_ORIGIN, CONSOLE_ORIGIN } from 'common/const/Urls.ts';
import type { Resolvers } from 'server/src/console/resolverTypes.ts';
import { consoleUserToCustomerID } from 'server/src/console/utils.ts';
import {
  getNotInactiveStripeSubscriptions,
  getOrCreateStripeCustomer,
  getStripePriceID,
  isStripeProductID,
} from 'server/src/util/stripe.ts';
import env from 'server/src/config/Env.ts';
import { CORD_SELF_SERVE_SLACK_CHANNEL_ID } from 'common/const/Ids.ts';
import { sendMessageToCord } from 'server/src/slack/util.ts';
import { CustomerEntity } from 'server/src/entity/customer/CustomerEntity.ts';

export const startCheckoutResolver: Resolvers['Mutation']['startCheckout'] =
  async (_, args, context) => {
    try {
      const { productKey } = args;

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

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

      if (!isStripeProductID(productKey)) {
        throw new Error('invalid stripe product ID');
      }

      const [stripePriceID, customer, internalCustomer] = await Promise.all([
        getStripePriceID(stripe, productKey),
        getOrCreateStripeCustomer({
          stripe,
          customerID,
          email: context.session.viewer.developerUserID!,
        }),
        CustomerEntity.findOne({ where: { id: customerID } }),
      ]);

      const activeSubscriptions = await getNotInactiveStripeSubscriptions(
        stripe,
        customer,
      );
      if (activeSubscriptions.length > 0) {
        return {
          success: false,
          failureDetails: {
            code: 'customer already has active subscriptions',
            message: null,
          },
          redirectURL: null,
        };
      }

      const customerAddress = `${ADMIN_ORIGIN}/customers/${customerID}`;
      void sendMessageToCord(
        `🛒 started subscription checkout (${productKey}) - ${internalCustomer?.name} - ${customerAddress}`,
        CORD_SELF_SERVE_SLACK_CHANNEL_ID,
        'selfserve',
      );

      const session = await stripe.checkout.sessions.create({
        billing_address_collection: 'required',
        tax_id_collection: {
          enabled: true,
        },
        customer_update: {
          name: 'auto',
          address: 'auto',
        },
        line_items: [
          {
            price: stripePriceID,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${CONSOLE_ORIGIN}/billing/?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${CONSOLE_ORIGIN}/billing/?cancel=true`,
        customer: customer.id,
        subscription_data: {
          metadata: { env: env.CORD_TIER },
        },
        automatic_tax: { enabled: true },
      });

      return {
        success: true,
        failureDetails: null,
        redirectURL: session.url!,
      };
    } catch (e) {
      context.logger.logException('Error starting Stripe checkout', e);
      throw e;
    }
  };
