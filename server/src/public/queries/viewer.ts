import {
  assertViewerHasUser,
  viewerHasIdentity,
} from 'server/src/auth/index.ts';
import { encodeSessionToJWT } from 'server/src/auth/encodeSessionToJWT.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { getDeepLinkThreadMessageID } from 'server/src/deep_link_threads/index.ts';
import { deprecated } from 'server/src/logging/deprecate.ts';
import { CLIENT_VERSION_MAX_DAYS_OLD } from 'common/const/Timing.ts';

// all its fields are dynamically resolved
export const viewerQueryResolver: Resolvers['Query']['viewer'] = () => ({});

export const viewerResolver: Resolvers['Viewer'] = {
  accessToken: async (_, args, context) => {
    // This path using groupID is deprecated now but incase we have people still
    // on this. Kept this separate so we can just remove it later.
    if (args.groupID !== undefined) {
      deprecated(
        'Viewer:AccessToken:groupID',
        context.session.viewer.platformApplicationID,
      );
    }

    // This token is used for reconnect, so it needs to be relatively
    // long-lived. However, we force a full refresh after this long anyway, so
    // we know we don't need it any more than this.
    const expiresInSeconds = CLIENT_VERSION_MAX_DAYS_OLD * 24 * 60 * 60;

    if (args.groupID) {
      const viwerCanAccessOrg =
        await context.loaders.orgMembersLoader.viewerCanAccessOrg(args.groupID);

      if (!viwerCanAccessOrg) {
        throw new Error('Viewer not part of org');
      }

      const org = await context.loaders.orgLoader.loadOrg(args.groupID);

      if (!org) {
        throw new Error('Group not found');
      }

      const viewer = context.session.viewer;
      const viewerWithOrg = viewer.viewerInOtherOrg(
        args.groupID,
        org.externalID,
      );

      return encodeSessionToJWT(
        { ...context.session, viewer: viewerWithOrg },
        expiresInSeconds,
      );
    }

    // Assume there is an orgID signed in the session already, including when
    // we pass the variable _externalOrgID
    return encodeSessionToJWT(context.session, expiresInSeconds);
  },

  user: async (_, _args, context) => {
    const userID = assertViewerHasUser(context.session.viewer);
    const user =
      await context.loaders.userLoader.loadUserInAnyViewerOrg(userID);
    if (!user) {
      throw new Error('Could not load user');
    }
    return user;
  },

  organization: async (_, _args, context) => {
    const { orgID } = context.session.viewer;
    if (!orgID) {
      return null;
    }

    const org = await context.loaders.orgLoader.loadOrg(orgID);
    if (!org) {
      throw new Error('Could not load org');
    }
    return org;
  },

  inbox: async (_, _args, context) => {
    assertViewerHasUser(context.session.viewer);
    return {};
  },

  email: async (_, _args, context) => {
    const userID = assertViewerHasUser(context.session.viewer);

    const user =
      await context.loaders.userLoader.loadUserInAnyViewerOrg(userID);

    if (user === null) {
      context.logger.error('Failed to load profile from DB', {
        userID,
      });

      return null;
    }
    return user.email;
  },

  isSlackConnected: async (_, _args, context) => {
    if (!viewerHasIdentity(context.session.viewer)) {
      return false;
    }

    const userID = assertViewerHasUser(context.session.viewer);

    const user = await context.loaders.userLoader.loadSlackUserForUserOrgScoped(
      context,
      userID,
    );

    return !!user;
  },

  thirdPartyConnection: (_, args) => args,

  deepLinkInfo: async (_, _args, context) => {
    if (!viewerHasIdentity(context.session.viewer)) {
      return null;
    }
    const userID = assertViewerHasUser(context.session.viewer);
    return await getDeepLinkThreadMessageID(userID);
  },
};

export const viewerIdentityResolver: Resolvers['ViewerIdentity'] = {
  user: viewerResolver.user,
  organization: viewerResolver.organization,
  email: viewerResolver.email,
  isSlackConnected: viewerResolver.isSlackConnected,
  organizations: async (_, _args, context) => {
    assertViewerHasUser(context.session.viewer);
    const result =
      await context.loaders.orgMembersLoader.loadAllImmediateOrgsForUser();
    return result;
  },
};
