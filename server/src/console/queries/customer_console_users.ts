import type { Resolvers } from 'server/src/console/resolverTypes.ts';
import { consoleUserToCustomerID } from 'server/src/console/utils.ts';

export const customerConsoleUsersQueryResolver: Resolvers['Query']['customerConsoleUsers'] =
  async (_, _args, context) => {
    const customerID = await consoleUserToCustomerID(
      context.session.viewer,
      context.loaders.consoleUserLoader,
    );
    if (!customerID) {
      return [];
    }
    return await context.loaders.consoleUserLoader.loadConsoleUsersForCustomer(
      customerID,
      true,
    );
  };
