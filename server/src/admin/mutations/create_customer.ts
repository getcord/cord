import type { Resolvers } from 'server/src/admin/resolverTypes.ts';
import { CustomerEntity } from 'server/src/entity/customer/CustomerEntity.ts';

export const createCustomerResolver: Resolvers['Mutation']['createCustomer'] =
  async (_, args, _context) => {
    const { name } = args;

    const customer = await CustomerEntity.create({
      name,
    });

    return customer.id;
  };
