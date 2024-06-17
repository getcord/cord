import type { Resolvers } from 'server/src/admin/resolverTypes.ts';

export const customerConsoleUsersQueryResolver: Resolvers['Query']['customerConsoleUsers'] =
  (_, args, context) =>
    context.loaders.consoleUserLoader.loadConsoleUsersForCustomer(
      args.customerID,
      true,
    );
