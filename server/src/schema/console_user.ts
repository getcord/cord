import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const consoleUserResolver: Resolvers['ConsoleUser'] = {
  customer: (consoleUser, _args, context) => {
    const customerID = consoleUser.customerID;
    if (!customerID) {
      return null;
    }
    return context.loaders.customerLoader.load(customerID);
  },
};
