import type { CustomerQueryResult } from 'external/src/entrypoints/admin/graphql/operations.ts';

export function StripeInvoiceInfo({
  customer,
}: {
  customer: CustomerQueryResult['customer'];
}) {
  if (!customer?.stripeSubscription) {
    throw new Error('customer should not be nullable here');
  }

  return (
    <div style={{ paddingBlockStart: 12 }}>
      <p>
        The customer already has an active plan. If you want to create a new
        subscription, please{' '}
        <a
          href={customer.stripeSubscription.url}
          target="_blank"
          rel="noreferrer"
        >
          cancel the current plan
        </a>{' '}
        first.
      </p>
      <p>Subscription status: {customer.stripeSubscription.status}</p>
      <p>
        Started on:{' '}
        {new Date(customer.stripeSubscription.startDate).toLocaleString(
          'en-US',
        )}
      </p>
      <p>
        Current cycle started{' '}
        {new Date(
          customer.stripeSubscription.currentPeriodStart,
        ).toLocaleString('en-US')}{' '}
        and ends{' '}
        {new Date(customer.stripeSubscription.currentPeriodEnd).toLocaleString(
          'en-US',
        )}
      </p>
      <p>
        Amount:{' '}
        {`$${customer.stripeSubscription.amount / 100} ${
          customer.stripeSubscription.recurrence
        }`}
      </p>
      <a
        href={customer.stripeSubscription.url}
        target="_blank"
        rel="noreferrer"
      >
        Go to subscription
      </a>
    </div>
  );
}
