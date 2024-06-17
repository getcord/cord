import { assertConsoleUser } from 'server/src/auth/index.ts';
import type { Resolvers } from 'server/src/console/resolverTypes.ts';
import { CustomerEntity } from 'server/src/entity/customer/CustomerEntity.ts';

export const customerSubscriptionUpdatedResolver: Resolvers['CustomerSubscriptionUpdated'] =
  {
    customer: async ({ payload: { customerID } }, _, context) => {
      assertConsoleUser(context.session.viewer);

      const customerEntity = await CustomerEntity.findByPk(customerID);

      if (!customerEntity) {
        throw new Error(
          `Customer not found despite receiving customer event ${customerID}`,
        );
      }

      return customerEntity;
    },
  };
