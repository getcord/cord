import type { Resolvers } from 'server/src/admin/resolverTypes.ts';
import { ConsoleUserMutator } from 'server/src/entity/user/ConsoleUserMutator.ts';

export const removeConsoleUserFromCustomerMutationResolver: Resolvers['Mutation']['removeConsoleUserFromCustomer'] =
  async (_, args, context) => {
    const user = await context.loaders.consoleUserLoader.loadUser(args.email);
    if (!user) {
      context.logger.warn(
        'Tried to revoke user access to customer, but did not find user.',
        { userEmail: args.email, customerID: args.customerID },
      );

      return {
        success: false,
        failureDetails: {
          code: '404',
          message: 'No such user found.',
        },
      };
    }

    const mutator = new ConsoleUserMutator(
      context.session.viewer,
      context.loaders.consoleUserLoader,
    );

    try {
      const success = await mutator.removeCustomerAccess(user, args.customerID);
      return {
        success,
        failureDetails: null,
      };
    } catch (e) {
      context.logger.logException('Error while removing customer access.', e, {
        userEmail: args.email,
        customerID: args.customerID,
      });
      return { success: false, failureDetails: null };
    }
  };
