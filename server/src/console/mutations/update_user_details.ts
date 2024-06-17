import { ManagementClient } from 'auth0';
import { assertConsoleUser } from 'server/src/auth/index.ts';
import Env from 'server/src/config/Env.ts';
import type { Resolvers } from 'server/src/console/resolverTypes.ts';
import { ConsoleUserMutator } from 'server/src/entity/user/ConsoleUserMutator.ts';

export const updateUserDetailsMutationResolver: Resolvers['Mutation']['updateUserDetails'] =
  async (_root, args, context) => {
    const { id: auth0UserID, name } = args;
    const { email } = assertConsoleUser(context.session.viewer);

    // Auth0 IDs look like '<providername>|<randomchars>', e.g. auth0|64a82f1e8e08443abc12f5e3,
    // github|28454190 or google-oauth2|112486097714454717963.  Auth0 can't
    // update details of a user created via social connections - it will error
    // if you try
    if (auth0UserID.split('|')[0] !== 'auth0') {
      return {
        success: false,
        failureDetails: {
          code: '',
          message: 'Cannot update details of user created via socials profile',
        },
      };
    }

    try {
      const auth0 = new ManagementClient({
        clientId: Env.AUTH0_MTM_CLIENT_ID,
        domain: Env.AUTH0_GENERAL_DOMAIN,
        clientSecret: Env.AUTH0_MTM_CLIENT_SECRET,
        scope: 'update:users',
      });

      // Update name in Auth0
      await auth0.updateUser({ id: auth0UserID }, { name });

      const consoleMutator = await new ConsoleUserMutator(
        context.session.viewer,
        context.loaders.consoleUserLoader,
      );

      // Update name in our db
      await consoleMutator.upsertUser({
        email,
        name,
      });

      return { success: true, failureDetails: null };
    } catch (e: any) {
      let error = e;

      // Errors thrown by Auth0 client are quite overwhelming but boil down
      // to useful information in e.message
      try {
        if (e.message) {
          error = e.message;
        }
      } catch (_) {
        error = e;
      }

      context.logger.logException(
        'Error when updating Console user information',
        error,
      );
      return {
        success: false,
        failureDetails: {
          code: '',
          message:
            'An error occurred.  Please contact partner-support@cord.com for more information',
        },
      };
    }
  };
