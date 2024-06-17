import type { Resolvers } from 'server/src/console/resolverTypes.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { CustomerEntity } from 'server/src/entity/customer/CustomerEntity.ts';
import { ConsoleUserMutator } from 'server/src/entity/user/ConsoleUserMutator.ts';

export const createCustomerResolver: Resolvers['Mutation']['createCustomer'] =
  async (_, args, context) => {
    const { name } = args;

    const userEmail = context.session.viewer.developerUserID!;
    const user = await context.loaders.consoleUserLoader.loadUser(userEmail);
    if (!user) {
      context.logger.error('No console user found.');
      throw new Error('No user found. Please log in.');
    }

    if (user.customerID) {
      context.logger.error(
        'User belongs to an existing customer - cannot create a new one.',
      );
      throw new Error(
        'You belong to an existing customer - cannot create a new one.',
      );
    }

    const customer = await CustomerEntity.create({
      name,
      type: 'sample', //Can only create sample customers from the console
    });

    await ApplicationEntity.create({
      name: 'sample-app-1',
      environment: 'sample',
      customerID: customer.id,
    });

    const mutator = new ConsoleUserMutator(
      context.session.viewer,
      context.loaders.consoleUserLoader,
    );

    await mutator.grantCustomerAccess(user, customer.id);

    return customer;
  };
