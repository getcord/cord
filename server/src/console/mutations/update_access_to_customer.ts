import { CORD_SELF_SERVE_SLACK_CHANNEL_ID } from 'common/const/Ids.ts';
import { ADMIN_ORIGIN } from 'common/const/Urls.ts';
import { LogLevel } from 'common/types/index.ts';
import type { Resolvers } from 'server/src/console/resolverTypes.ts';
import {
  sendAccessDeniedEmailToConsoleUser,
  sendAccessGrantedEmailToConsoleUser,
} from 'server/src/email/index.ts';
import { CustomerEntity } from 'server/src/entity/customer/CustomerEntity.ts';
import { logServerEvent } from 'server/src/entity/event/EventMutator.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { ConsoleUserMutator } from 'server/src/entity/user/ConsoleUserMutator.ts';
import { sendMessageToCord } from 'server/src/slack/util.ts';

export const updateAccessToCustomerResolver: Resolvers['Mutation']['updateAccessToCustomer'] =
  async (_, args, context) => {
    const { developerUserID: consoleUserEmail } = context.session.viewer;
    const pendingUserEmail = args.email;
    const approveAccess = args.approveAccess;

    try {
      return await getSequelize().transaction(async (transaction) => {
        if (!consoleUserEmail) {
          throw new Error('Email not found');
        }

        const consoleUser = await context.loaders.consoleUserLoader.loadUser(
          consoleUserEmail,
          transaction,
        );

        if (!consoleUser || !consoleUser.customerID) {
          throw new Error('User not found');
        }

        const [customer, pendingUser] = await Promise.all([
          CustomerEntity.findByPk(consoleUser.customerID, { transaction }),
          context.loaders.consoleUserLoader.loadPendingUserInCustomer(
            pendingUserEmail,
            consoleUser.customerID,
            transaction,
          ),
        ]);

        if (!customer) {
          throw new Error('Customer not found');
        }

        if (!pendingUser) {
          throw new Error('Pending user not found');
        }

        const consoleUserMutator = new ConsoleUserMutator(
          context.session.viewer,
        );

        if (approveAccess) {
          const success =
            await consoleUserMutator.grantPendingUserCustomerAccess(
              pendingUser,
              customer.id,
              transaction,
            );

          if (success) {
            logServerEvent({
              session: context.session,
              type: 'console-user-granted-access',
              logLevel: LogLevel.DEBUG,
              payload: {
                requestingUserEmail: pendingUser.email,
                grantedBy: consoleUser.email,
                customerID: customer.id,
              },
            });
            await sendAccessGrantedEmailToConsoleUser(
              context,
              pendingUser.email,
              customer,
            );

            await sendMessageToCord(
              `🫴🗝️ ${pendingUser.idForLogging} was granted access to ${ADMIN_ORIGIN}/customers/${customer.id} by ${consoleUser.idForLogging}`,
              CORD_SELF_SERVE_SLACK_CHANNEL_ID,
              'selfserve',
            );

            return {
              success: true,
              failureDetails: null,
            };
          }
        } else {
          const success =
            await consoleUserMutator.denyPendingUserCustomerAccess(
              pendingUser,
              customer.id,
              transaction,
            );

          if (success) {
            logServerEvent({
              session: context.session,
              type: 'console-user-denied-access',
              logLevel: LogLevel.DEBUG,
              payload: {
                requestingUserEmail: pendingUser.email,
                deniedBy: consoleUser.email,
                customerID: customer.id,
              },
            });

            await sendAccessDeniedEmailToConsoleUser(
              context,
              pendingUser.email,
              customer,
            );

            await sendMessageToCord(
              `❌🗝️ ${pendingUser.idForLogging} was denied access to ${ADMIN_ORIGIN}/customers/${customer.id} by ${consoleUser.idForLogging}`,
              CORD_SELF_SERVE_SLACK_CHANNEL_ID,
              'selfserve',
            );

            return {
              success: true,
              failureDetails: null,
            };
          }
        }
        throw new Error('Update console user access failed');
      });
    } catch (e) {
      let message = 'updateAccessToCustomerResolver: ';
      if (e instanceof Error) {
        message += e.message;
      }
      context.logger.error(message, {
        consoleUserEmail,
        pendingUserEmail,
      });

      return {
        success: false,
        failureDetails: { code: '400', message: 'Something went wrong' },
      };
    }
  };
