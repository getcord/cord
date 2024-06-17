import { pubSubAsyncIterator } from 'server/src/pubsub/index.ts';
import { CustomerSubscriptionUpdatedTypeName } from 'common/types/index.ts';
import type { Resolvers } from 'server/src/console/resolverTypes.ts';

export const customerEventsSubscriptionResolver: Resolvers['Subscription']['customerEvents'] =
  {
    resolve: (payload) => payload,
    subscribe: (_root, { customerID }) =>
      pubSubAsyncIterator(
        // this must map to the CustomerEvents type definition in mapping.ts
        ['customer-subscription-updated', { customerID }],
      ),
  };

export const customerEventTypeResolver: Resolvers['CustomerEvent'] = {
  __resolveType: (event) => {
    switch (event.name) {
      // this must map to the CustomerEvents type definition in mapping.ts
      case 'customer-subscription-updated':
        return CustomerSubscriptionUpdatedTypeName;
    }
  },
};
