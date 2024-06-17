import type { Resolvers } from 'server/src/console/resolverTypes.ts';
import { CustomerEntity } from 'server/src/entity/customer/CustomerEntity.ts';

export const updateCustomerNameResolver: Resolvers['Mutation']['updateCustomerName'] =
  async (_, args, context) => {
    const { name } = args;

    const userEmail = context.session.viewer.developerUserID!;
    const user = await context.loaders.consoleUserLoader.loadUser(userEmail);
    if (!user) {
      throw new Error('No user found. Please log in.');
    }
    if (!user.customerID) {
      throw new Error('Console user not associated with a customer');
    }

    if (name.length === 0) {
      return {
        success: false,
        failureDetails: {
          code: '400',
          message: 'Name must contain characters',
        },
      };
    }

    const [updated] = await CustomerEntity.update(
      {
        name,
      },
      { where: { id: user.customerID } },
    );

    return {
      success: updated === 1,
      failureDetails: null,
    };
  };
