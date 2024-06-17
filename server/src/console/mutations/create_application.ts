import type { Resolvers } from 'server/src/console/resolverTypes.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { CustomerEntity } from 'server/src/entity/customer/CustomerEntity.ts';
import { EventMutator } from 'server/src/entity/event/EventMutator.ts';
import { ConsoleUserMutator } from 'server/src/entity/user/ConsoleUserMutator.ts';
import { logCustomerActionLimit } from 'server/src/util/selfServe.ts';

export const createApplicationResolver: Resolvers['Mutation']['createApplication'] =
  async (_, args, context) => {
    const { name } = args;

    const userEmail = context.session.viewer.developerUserID!;
    const user = await context.loaders.consoleUserLoader.loadUser(userEmail);
    if (!user) {
      context.logger.error('No console user found.');
      throw new Error('No user found. Please log in.');
    }

    if (!user.customerID) {
      context.logger.error(
        'Cannot create an application without belonging to a customer first',
      );
      throw new Error('Cannot create app without belonging to a customer');
    }

    const isSampleCustomer =
      (await CustomerEntity.findByPk(user?.customerID).then(
        (customer) => customer?.type,
      )) === 'sample';

    const application = await ApplicationEntity.create({
      name,
      environment: isSampleCustomer ? 'sample' : 'production',
      customerID: user.customerID,
    });

    const eventMutator = new EventMutator(context.session);
    await eventMutator.createEvent({
      eventNumber: null,
      pageLoadID: null,
      clientTimestamp: new Date(Date.now()),
      installationID: null,
      type: 'console-application-created',
      payload: {
        email: user.email,
        platformApplicationID: application.id,
        customerID: user.customerID,
      },
      metadata: {},
      logLevel: 'info',
    });
    await logCustomerActionLimit({
      customerID: user?.customerID,
      action: 'create_application',
    });

    const mutator = new ConsoleUserMutator(
      context.session.viewer,
      context.loaders.consoleUserLoader,
    );

    await mutator.grantCustomerAccess(user, user.customerID);

    return application.id;
  };
