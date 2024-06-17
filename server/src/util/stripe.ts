import Stripe from 'stripe';

import type { PricingTier } from 'server/src/entity/customer/CustomerEntity.ts';
import { CustomerEntity } from 'server/src/entity/customer/CustomerEntity.ts';
import env from 'server/src/config/Env.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';
import { sendMessageToCord } from 'server/src/slack/util.ts';
import { CORD_SELF_SERVE_SLACK_CHANNEL_ID } from 'common/const/Ids.ts';
import { ADMIN_ORIGIN } from 'common/const/Urls.ts';

enum StripePricingTier {
  PRO = 'pro',
  SCALE = 'scale',
}

export async function getStripeCustomerID(
  customerID: string,
): Promise<string | null> {
  const customer = await CustomerEntity.findOne({ where: { id: customerID } });
  if (!customer) {
    throw new Error('could not load customer');
  }
  return customer.stripeCustomerID;
}

export async function getOrCreateStripeCustomer({
  stripe,
  customerID,
  email,
  country,
  postcode,
}: {
  stripe: Stripe;
  customerID: string;
  email: string;
  country?: string;
  postcode?: string;
}): Promise<Stripe.Customer> {
  const stripeCustomerID = await getStripeCustomerID(customerID);

  if (stripeCustomerID) {
    const stripeCustomer = await stripe.customers.retrieve(stripeCustomerID);
    if (!stripeCustomer) {
      throw new Error('could not load stripe customer');
    } else if (stripeCustomer.deleted) {
      throw new Error('stripe customer was deleted');
    }
    return stripeCustomer;
  }

  // We don't have an internal reference, but it might exist in Stripe
  const stripeCustomers = await stripe.customers.search({
    query: `metadata['customer_id']:'${customerID}'`,
  });

  if (stripeCustomers.data.length > 0) {
    const stripeCustomer = stripeCustomers.data[0];
    // Need to save it internally before we exit
    await saveStripeCustomerID(customerID, stripeCustomer.id);
    return stripeCustomer;
  }

  const customer = await CustomerEntity.findByPk(customerID);
  if (!customer) {
    throw new Error('could not load customer data');
  }

  // The Stripe customer doesn't exist yet
  const newStripeCustomer = await stripe.customers.create({
    name: customer.name,
    email: email,
    metadata: { customer_id: customerID, env: env.CORD_TIER },
    address: { country, postal_code: postcode },
  });

  await saveStripeCustomerID(customerID, newStripeCustomer.id);
  return newStripeCustomer;
}

async function saveStripeCustomerID(internalID: string, stripeID: string) {
  const [updated] = await CustomerEntity.update(
    {
      stripeCustomerID: stripeID,
    },
    { where: { id: internalID } },
  );

  if (updated === 0) {
    throw new Error('could not update');
  }
}

export async function getNotInactiveStripeSubscriptions(
  stripe: Stripe,
  customer: Stripe.Customer,
): Promise<Stripe.Subscription[]> {
  const [activeSubscriptions, pastDueSubscriptions] = await Promise.all([
    getStripeSubscriptionsWithState(stripe, customer, 'active'),
    getStripeSubscriptionsWithState(stripe, customer, 'past_due'),
  ]);

  return [...activeSubscriptions, ...pastDueSubscriptions];
}

async function getStripeSubscriptionsWithState(
  stripe: Stripe,
  customer: Stripe.Customer,
  status: Stripe.SubscriptionListParams.Status,
): Promise<Stripe.Subscription[]> {
  const subscriptions: Stripe.ApiList<Stripe.Subscription> =
    await stripe.subscriptions.list({
      customer: customer.id,
      status,
    });
  return subscriptions.data ?? [];
}

export function isStripeProductID(value: string): value is StripePricingTier {
  return Object.values(StripePricingTier).includes(value as StripePricingTier);
}

export async function getStripePriceID(
  stripe: Stripe,
  productKey: StripePricingTier,
): Promise<string> {
  const prices = await stripe.prices.list({
    lookup_keys: [productKey],
    expand: ['data.product'],
  });
  if (prices.data.length < 1) {
    throw new Error('prices list is empty');
  }
  return prices.data[0].id;
}

export async function updateSubscriptionData(
  subscription: Stripe.Subscription,
  eventType: string,
) {
  if (subscription.metadata.env !== env.CORD_TIER) {
    return;
  }

  const internalCustomer = await CustomerEntity.findOne({
    where: { stripeCustomerID: subscription.customer },
  });

  if (!internalCustomer) {
    throw new Error('unknown customer to update');
  }

  internalCustomer.pricingTier = await getBillingTierFromSubscription(
    subscription,
    internalCustomer,
  );
  internalCustomer.billingStatus = subscription.status;
  internalCustomer.billingType = 'stripe';
  internalCustomer.renewalDate = new Date(
    subscription.current_period_end * 1000,
  );
  const savedInternalCustomer = await internalCustomer.save();

  await Promise.all([
    publishPubSubEvent(
      'customer-subscription-updated',
      {
        customerID: internalCustomer.id,
      },
      { customerID: internalCustomer.id },
    ),
    sendSubscriptionUpdateToClack(eventType, savedInternalCustomer),
  ]);
}

async function getBillingTierFromSubscription(
  subscription: Stripe.Subscription,
  internalCustomer: CustomerEntity,
): Promise<PricingTier> {
  try {
    // Don't downgrade tiers automatically, we will keep customers in
    // their tier even if payment fails
    if (internalCustomer && internalCustomer.pricingTier !== 'free') {
      return internalCustomer.pricingTier;
    }

    const items = subscription.items.data;
    // We only support subscriptions with 1 item for now.
    // We might add addons in the future and this will change.
    if (items.length !== 1) {
      throw new Error('more than 1 item in subscription');
    }
    const product = items[0].plan.product;
    const productID = typeof product === 'string' ? product : product?.id;

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const stripeProduct = await stripe.products.retrieve(productID!);
    return getPricingPlanFromStripePricingTier(
      stripeProduct.metadata['pricing_tier'],
    );
  } catch (e: any) {
    anonymousLogger().logException('Problem getting billing tier', e, {
      subscriptionID: subscription.id,
    });
    throw e;
  }
}

function getPricingPlanFromStripePricingTier(
  stripePricingTier: string,
): PricingTier {
  switch (stripePricingTier) {
    case StripePricingTier.PRO:
      return 'pro';
    case StripePricingTier.SCALE:
      return 'scale';
  }

  throw new Error(`unknown stripe pricing tier: "${stripePricingTier}"`);
}

async function sendSubscriptionUpdateToClack(
  eventType: string,
  internalCustomer: CustomerEntity,
) {
  let message = null;

  const customerAddress = `${ADMIN_ORIGIN}/customers/${internalCustomer.id}`;
  const plan = internalCustomer.pricingTier;
  const status = internalCustomer.billingStatus;

  switch (eventType) {
    case 'customer.subscription.created':
      message = `💰➕ New Stripe subscription (${plan}, ${status}) - ${internalCustomer.name} - ${customerAddress}`;
      break;
    case 'customer.subscription.updated':
      message = `💰✏️ Stripe subscription updated (${plan}, ${status}) - ${internalCustomer.name} - ${customerAddress}`;
      break;
    case 'customer.subscription.deleted':
      message = `💰➖ Stripe subscription cancelled (${plan}, ${status}) - ${internalCustomer.name} - ${customerAddress}`;
      break;
  }

  if (message === null) {
    return;
  }

  await sendMessageToCord(
    message,
    CORD_SELF_SERVE_SLACK_CHANNEL_ID,
    'selfserve',
  );
}

export async function createSubscription({
  stripe,
  stripeCustomerID,
  stripePriceID,
}: {
  stripe: Stripe;
  stripeCustomerID: string;
  stripePriceID: string;
}): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.create({
    customer: stripeCustomerID,
    items: [
      {
        price: stripePriceID,
      },
    ],
    automatic_tax: {
      enabled: true,
    },
    collection_method: 'send_invoice',
    days_until_due: 0,
    metadata: { env: env.CORD_TIER },
  });

  return subscription;
}

export async function finalizeInvoice(stripe: Stripe, invoiceID: string) {
  await stripe.invoices.finalizeInvoice(invoiceID);
}

export async function getSubscriptionData(
  customer: CustomerEntity,
): Promise<Stripe.Subscription | null> {
  const stripeCustomerID = await getStripeCustomerID(customer.id);
  if (!stripeCustomerID) {
    return null;
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const [activeSubscriptions, pastDueSubscriptions] = await Promise.all([
    stripe.subscriptions.list({
      customer: stripeCustomerID,
      status: 'active',
    }),
    stripe.subscriptions.list({
      customer: stripeCustomerID,
      status: 'past_due',
    }),
  ]);

  if (activeSubscriptions.data.length + pastDueSubscriptions.data.length > 1) {
    throw new Error(
      `More than one subscription for the customer ${customer.id}`,
    );
  } else if (activeSubscriptions.data.length > 0) {
    return activeSubscriptions.data[0];
  } else if (pastDueSubscriptions.data.length > 0) {
    return pastDueSubscriptions.data[0];
  }
  return null;
}

export function getPlanName(pricingTier: PricingTier) {
  switch (pricingTier) {
    case 'free':
      return 'Starter';
    case 'pro':
      return 'Pro';
    case 'scale':
      return 'Premium';
  }
}
