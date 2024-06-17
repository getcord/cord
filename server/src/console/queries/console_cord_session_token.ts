import env from 'server/src/config/Env.ts';
import { getClientAuthToken } from '@cord-sdk/server';
import type { Resolvers } from 'server/src/console/resolverTypes.ts';

export const DEV_CONSOLE_APP_ID = '91472459-aad0-452a-8442-f26c51bb8baa';

export const getConsoleCordSessionTokenResolver: Resolvers['Query']['consoleCordSessionToken'] =
  async (_, __, context) => {
    const { developerUserID: userEmail } = context.session.viewer;
    if (!userEmail) {
      return '';
    }
    const user = await context.loaders.consoleUserLoader.loadUser(userEmail);

    if (!user || !user.customerID) {
      return '';
    }
    const customer = await context.loaders.customerLoader.load(
      user?.customerID,
    );

    if (!customer) {
      return '';
    }

    return getClientAuthToken(
      DEV_CONSOLE_APP_ID,
      env.DEV_CONSOLE_CORD_APP_SECRET,
      {
        user_id: user.id,
        organization_id: user.customerID,
        user_details: {
          name: user.name ?? undefined,
          email: user.email,
          profile_picture_url: user.picture ?? undefined,
        },
        organization_details: {
          name: customer.name,
        },
      },
    );
  };
