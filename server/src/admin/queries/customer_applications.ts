import type { Resolvers } from 'server/src/admin/resolverTypes.ts';

export const customerApplicationsResolver: Resolvers['Query']['customerApplications'] =
  (_, args, context) =>
    context.loaders.applicationLoader.loadApplicationsForConsoleUser(
      args.customerID,
    );
