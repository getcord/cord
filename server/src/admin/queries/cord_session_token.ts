import { getClientAuthToken } from '@cord-sdk/server';
import type { Resolvers } from 'server/src/admin/resolverTypes.ts';

export const ADMIN_APP_ID = 'de733bf4-63f7-4050-b384-10c95a9cc53e';
export const ADMIN_APP_SECRET = '6683cef35cd70e7fdca4160345c2deeb';

export const cordSessionTokenQueryResolver: Resolvers['Query']['cordSessionToken'] =
  async (
    _,
    args,
    {
      session: {
        viewer: { userID, orgID },
      },
      loaders: { orgLoader, userLoader },
    },
  ) => {
    if (!userID || !orgID) {
      return null;
    }

    const [user, org] = await Promise.all([
      userLoader.loadUserInAnyViewerOrg(userID),
      orgLoader.loadOrg(orgID),
    ]);

    if (!user || !org) {
      return null;
    }

    const orgName = org.name;

    return getClientAuthToken(ADMIN_APP_ID, ADMIN_APP_SECRET, {
      user_id: userID,
      organization_id: orgID,
      user_details: {
        name: user.name!,
        email: user.email!,
        profile_picture_url: user.profilePictureURL ?? undefined,
      },
      organization_details: {
        name: orgName,
      },
    });
  };
