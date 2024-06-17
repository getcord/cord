import type { Resolvers } from 'server/src/admin/resolverTypes.ts';
import { sendEmailInviteConsoleUser } from 'server/src/email/index.ts';
import { ConsoleUserEntity } from 'server/src/entity/user/ConsoleUserEntity.ts';
import { ConsoleUserMutator } from 'server/src/entity/user/ConsoleUserMutator.ts';

export const addConsoleUserToCustomerMutationResolver: Resolvers['Mutation']['addConsoleUserToCustomer'] =
  async (_, args, context) => {
    // We accept multiple emails separated by commas
    const lowercaseEmails = args.email
      .toLowerCase()
      .split(',')
      .map((email) => email.trim());

    const success = await context.sequelize.transaction(async (transaction) => {
      const users = await Promise.all(
        lowercaseEmails.map((lowercaseEmail) => {
          return (async () => {
            const [user] = await ConsoleUserEntity.findOrCreate({
              where: { email: lowercaseEmail },
              defaults: {
                name: lowercaseEmail,
              },
              transaction,
            });
            return user;
          })();
        }),
      );

      users.forEach((user) => {
        if (user && user.customerID) {
          throw new Error(
            `Email ${user.email} is assigned to an existing customer`,
          );
        }
      });

      const mutator = new ConsoleUserMutator(
        context.session.viewer,
        context.loaders.consoleUserLoader,
      );

      return (
        await Promise.all(
          users.map(async (user) => {
            const result = await mutator.grantCustomerAccess(
              user,
              args.customerID,
              transaction,
            );

            if (result && args.sendEmailInvites) {
              const lowercaseEmail = user.email.toLowerCase();
              void sendEmailInviteConsoleUser(
                context,
                lowercaseEmail,
                'Cord',
                args.customerID,
              );
            }
            return result;
          }),
        )
      ).every((x) => x);
    });

    return {
      success,
      failureDetails: null,
    };
  };
