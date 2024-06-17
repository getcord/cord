import { pubSubAsyncIterator } from 'server/src/pubsub/index.ts';
import { ConsoleGettingStartedUpdatedTypeName } from 'common/types/index.ts';
import type { Resolvers } from 'server/src/console/resolverTypes.ts';

export const applicationEventSubscriptionResolver: Resolvers['Subscription']['applicationEvents'] =
  {
    resolve: (payload) => payload,
    subscribe: (_root, { applicationID }) =>
      pubSubAsyncIterator(
        // this must map to the ApplicationEvents type definition in mapping.ts
        ['console-getting-started-updated', { applicationID }],
      ),
  };

export const applicationEventTypeResolver: Resolvers['ApplicationEvent'] = {
  __resolveType: (event) => {
    switch (event.name) {
      // this must map to the ApplicationEvents type definition in mapping.ts
      case 'console-getting-started-updated':
        return ConsoleGettingStartedUpdatedTypeName;
    }
  },
};
