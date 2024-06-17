import type { CustomerEntity } from 'server/src/entity/customer/CustomerEntity.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { getSubscriptionData } from 'server/src/util/stripe.ts';

export const customerResolver: Resolvers['Customer'] = {
  billingStatus: (customer, _args, _context) => {
    return getGraphQLBillingStatusFromCustomer(customer.billingStatus);
  },
  addons: (customer: CustomerEntity, _args, _context) => {
    const { addons } = customer;
    return Object.keys(addons).map((addon) => {
      const value = addons[addon];
      if (typeof value !== 'boolean') {
        throw new Error(
          'only boolean values for addons are supported at the moment',
        );
      }
      return { key: addon, value: value };
    });
  },
  stripeSubscription: async (customer: CustomerEntity, _args, _context) => {
    const subscription = await getSubscriptionData(customer);
    if (!subscription) {
      return;
    }

    const amount =
      subscription.items.data
        .map((item) => item.price.unit_amount)
        .reduce((a, b) => (a ?? 0) + (b ?? 0), 0) ?? 0;

    return {
      id: subscription.id,
      status: subscription.status,
      url: subscription.livemode
        ? `https://dashboard.stripe.com/subscriptions/${subscription.id}`
        : `https://dashboard.stripe.com/test/subscriptions/${subscription.id}`,
      startDate: new Date(subscription.start_date * 1000),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      amount,
      recurrence:
        (subscription.current_period_end - subscription.current_period_start) /
          (24 * 60 * 60) <=
        31
          ? 'monthly'
          : 'yearly',
    };
  },
};

export function getGraphQLBillingStatusFromCustomer(billingStatus: string) {
  switch (billingStatus) {
    case 'active':
      return 'active';
    case 'past_due':
      return 'unpaid';
    case 'inactive':
    case 'canceled':
    case 'incomplete':
    case 'incomplete_expired':
    case 'paused':
    case 'trialing':
    case 'unpaid':
      return 'inactive';
  }

  throw new Error(`unknown billing status: ${billingStatus}`);
}
