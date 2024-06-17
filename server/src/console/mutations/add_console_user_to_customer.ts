import type { Resolvers } from 'server/src/console/resolverTypes.ts';
import { consoleUserToCustomerID } from 'server/src/console/utils.ts';
import { sendEmailInviteConsoleUser } from 'server/src/email/index.ts';
import { ConsoleUserEntity } from 'server/src/entity/user/ConsoleUserEntity.ts';
import { ConsoleUserMutator } from 'server/src/entity/user/ConsoleUserMutator.ts';
import { logCustomerActionLimit } from 'server/src/util/selfServe.ts';

export const addConsoleUserToCustomerMutationResolver: Resolvers['Mutation']['addConsoleUserToCustomer'] =
  async (_, args, context) => {
    const customerID = await consoleUserToCustomerID(
      context.session.viewer,
      context.loaders.consoleUserLoader,
    );
    if (!customerID) {
      return {
        success: false,
        failureDetails: null,
      };
    }

    const lowercaseEmail = args.email.toLowerCase();

    const [user] = await ConsoleUserEntity.findOrCreate({
      where: { email: lowercaseEmail },
      defaults: { name: lowercaseEmail },
    });

    if (user && user.customerID) {
      context.logger.warn('Email is assigned to an existing customer', {
        invitee: user.email,
        inviteeCustomer: user.customerID,
      });
      return {
        success: false,
        failureDetails: {
          code: '409',
          message:
            'This email is already associated with another Cord team. Please contact us (partner-support@cord.com) to have this user added to your team.',
        },
      };
    }

    const inviterEmail = context.session.viewer.developerUserID!;
    const inviter =
      await context.loaders.consoleUserLoader.loadUser(inviterEmail);

    void sendEmailInviteConsoleUser(
      context,
      lowercaseEmail,
      inviter?.name ?? 'your teammate',
      customerID,
    );

    const mutator = new ConsoleUserMutator(
      context.session.viewer,
      context.loaders.consoleUserLoader,
    );

    const success = await mutator.grantCustomerAccess(user, customerID);
    if (success) {
      await logCustomerActionLimit({ customerID, action: 'add_member' });
    }

    return {
      success,
      failureDetails: null,
    };
  };
