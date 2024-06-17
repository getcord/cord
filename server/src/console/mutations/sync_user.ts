import { ManagementClient } from 'auth0';
import { CORD_SELF_SERVE_SLACK_CHANNEL_ID } from 'common/const/Ids.ts';
import { LogLevel } from 'common/types/index.ts';
import { assertConsoleUser } from 'server/src/auth/index.ts';
import type { Resolvers } from 'server/src/console/resolverTypes.ts';
import { logServerEvent } from 'server/src/entity/event/EventMutator.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { ConsoleUserMutator } from 'server/src/entity/user/ConsoleUserMutator.ts';
import { getFeatureFlagValue } from 'server/src/featureflags/index.ts';
import { sendMessageToCord } from 'server/src/slack/util.ts';
import {
  createNewCustomer as createNewCustomerEntity,
  findCustomerIDsWithSameDomainConsoleUsers,
} from 'server/src/util/selfServe.ts';
import { addNewConsoleUserToLoops } from 'server/src/util/loops.ts';
import Env from 'server/src/config/Env.ts';

export const syncUserMutationResolver: Resolvers['Mutation']['syncUser'] =
  async (_, args, context) => {
    const { name, picture, signupCoupon, createNewCustomer } = args;
    const { email } = assertConsoleUser(context.session.viewer);
    try {
      const consoleMutator = await new ConsoleUserMutator(
        context.session.viewer,
        context.loaders.consoleUserLoader,
      );

      const user = await consoleMutator.upsertUser({
        email,
        name: name ?? undefined,
        picture: picture ?? undefined,
        verified: context.session?.console?.email_verified,
      });
      const auth0 = new ManagementClient({
        clientId: Env.AUTH0_MTM_CLIENT_ID,
        domain: Env.AUTH0_GENERAL_DOMAIN,
        clientSecret: Env.AUTH0_MTM_CLIENT_SECRET,
        scope: 'read:users',
      });

      if (!user.loopsUserID) {
        let firstName: string | undefined = undefined;
        let lastName: string | undefined = undefined;
        if (user.auth0UserID) {
          const auth0User = await auth0.getUser({ id: user.auth0UserID });
          firstName = auth0User.given_name;
          lastName = auth0User.family_name;
        }

        await addNewConsoleUserToLoops({
          email,
          consoleUserId: user.id,
          firstName: firstName,
          lastName: lastName,
          context,
        });
      }

      const featureFlagUser = {
        userID: user.id,
        platformApplicationID: 'console',
        version: context.clientVersion,
      };

      const enableHandlingDuplicateSignUps = await getFeatureFlagValue(
        'enable_handling_duplicate_domain_console_sign_ups',
        featureFlagUser,
      );

      if (!user.customerID) {
        if (enableHandlingDuplicateSignUps && !createNewCustomer) {
          // Check if a user should be linked to an existing customer
          const customerIDs = await findCustomerIDsWithSameDomainConsoleUsers(
            user.email,
          );

          if (customerIDs && customerIDs.length > 0) {
            let customerName: string | null = null;
            if (customerIDs.length === 1) {
              // We have one match! We send over name and ID
              const customer = await context.loaders.customerLoader.load(
                customerIDs[0],
              );

              if (!customer) {
                throw new Error('Customer does not exist');
              }

              customerName = customer?.name;
            }

            return {
              success: true,
              customerIDs,
              customerName,
              failureDetails: null,
            };
          }
        }

        const pendingCustomerID = user.pendingCustomerID;
        // A console user has request access to an existing customer and no
        // longer wants to join this customer, they can still create a separate
        // account. We just have to remove the pendingCustomerID
        if (
          enableHandlingDuplicateSignUps &&
          createNewCustomer &&
          pendingCustomerID
        ) {
          await getSequelize().transaction(async (transaction) => {
            await consoleMutator.revokeRequestCustomerAccess(
              user,
              pendingCustomerID,
              transaction,
            );
            await createNewCustomerEntity({
              email,
              signupCoupon,
              consoleMutator,
              context,
              user,
              parentTransaction: transaction,
            });
            transaction.afterCommit(async () => {
              logServerEvent({
                session: context.session,
                type: 'console-user-revoke-request-access-customer',
                logLevel: LogLevel.DEBUG,
                payload: {
                  pendingEmail: email,
                  revokeRequestCustomerID: pendingCustomerID,
                },
              });
              await sendMessageToCord(
                `🗝️🗑️ ${user.idForLogging} has revoked the requested access to customer: ${pendingCustomerID}`,
                CORD_SELF_SERVE_SLACK_CHANNEL_ID,
                'selfserve',
              );
            });
          });
        } else {
          // Create a new customer
          await createNewCustomerEntity({
            email,
            signupCoupon,
            consoleMutator,
            context,
            user,
          });
        }

        return {
          success: true,
          customerIDs: null,
          customerName: null,
          failureDetails: null,
        };
      }

      return {
        success: true,
        customerIDs: null,
        customerName: null,
        failureDetails: null,
      };
    } catch (error: any) {
      return {
        success: false,
        customerIDs: null,
        customerName: null,
        failureDetails: { code: '', message: error.message },
      };
    }
  };
