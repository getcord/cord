import { CORD_SELF_SERVE_SLACK_CHANNEL_ID } from 'common/const/Ids.ts';
import { ADMIN_ORIGIN } from 'common/const/Urls.ts';
import { LogLevel } from 'common/types/index.ts';
import type { Resolvers } from 'server/src/console/resolverTypes.ts';
import { sendAccessRequestToCustomerConsoleUsers } from 'server/src/email/index.ts';
import { logServerEvent } from 'server/src/entity/event/EventMutator.ts';
import { ConsoleUserMutator } from 'server/src/entity/user/ConsoleUserMutator.ts';
import { sendMessageToCord } from 'server/src/slack/util.ts';
import { findCustomerIDsWithSameDomainConsoleUsers } from 'server/src/util/selfServe.ts';

export const requestAccessToCustomerResolver: Resolvers['Mutation']['requestAccessToCustomer'] =
  async (_, args, context) => {
    const { developerUserID: userEmail } = context.session.viewer;
    const customerID = args.customerID;
    try {
      if (!userEmail) {
        throw new Error('Email not found');
      }

      const [user, customer, matchingCustomerIDs] = await Promise.all([
        context.loaders.consoleUserLoader.loadUser(userEmail),
        context.loaders.customerLoader.load(customerID),
        findCustomerIDsWithSameDomainConsoleUsers(userEmail),
      ]);

      if (!user) {
        throw new Error('User not found');
      }

      if (!customer) {
        throw new Error('Customer not found');
      }

      if (!matchingCustomerIDs) {
        throw new Error('Customer not found');
      }

      if (
        matchingCustomerIDs.length === 1 &&
        matchingCustomerIDs.includes(customer.id)
      ) {
        // We will add the new console user as 'pending' in the customer
        // so other console users who have access to the account can grant
        // access to them in the console
        const consoleUserMutator = new ConsoleUserMutator(
          context.session.viewer,
        );
        await consoleUserMutator.requestCustomerAccess(user, customer.id);

        // We will send an email to all the console users in this customer notifying
        // them a user has requested access and to sign into the console.
        await sendAccessRequestToCustomerConsoleUsers(
          context,
          userEmail,
          customer.id,
        );

        logServerEvent({
          session: context.session,
          type: 'console-user-request-access-customer',
          logLevel: LogLevel.DEBUG,
          payload: {
            pendingEmail: userEmail,
            customerID,
          },
        });

        await sendMessageToCord(
          `🗝️🙏 ${user.idForLogging} has requested access to ${ADMIN_ORIGIN}/customers/${customerID}`,
          CORD_SELF_SERVE_SLACK_CHANNEL_ID,
          'selfserve',
        );

        context.logger.log('info', 'Request access to customer account', {
          consoleUser: user.email,
          customerID: customer.id,
        });
        return { success: true, failureDetails: null };
      }
      throw new Error('Cannot request access when multple customers found');
    } catch (e) {
      let message = 'requestAccessToCustomerResolver: ';
      if (e instanceof Error) {
        message += e.message;
      }
      context.logger.error(message, {
        requestingEmail: userEmail,
        customerID,
      });

      return {
        success: false,
        failureDetails: { code: '400', message: 'Something went wrong' },
      };
    }
  };
