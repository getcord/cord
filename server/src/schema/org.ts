import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { getRelevantContext } from 'server/src/RequestContext.ts';
import { isDefined } from 'common/util/index.ts';
import { MAX_NAME_FILTERED_AUTOCOMPLETE_ORG_USERS } from 'common/const/Api.ts';
import { deprecatedFunction } from 'server/src/logging/deprecate.ts';

export const orgResolver: Resolvers['Organization'] = {
  usersWithOrgDetails: async (org, args, context) => {
    // The nameQuery param is optional - if it's been passed, filter by name
    // If not (for BC), don't
    if (isDefined(args.nameQuery)) {
      const filteredUsers =
        await context.loaders.userLoader.loadNameFilteredUsersInOrg(
          org.id,
          args.nameQuery,
          org.platformApplicationID,
          MAX_NAME_FILTERED_AUTOCOMPLETE_ORG_USERS,
          args.sortUsersBy,
          args.sortUsersDirection,
        );
      return filteredUsers.map((user) => ({ user, org }));
    } else {
      // If name query is null, this is newer client code which intentionally
      // wants to load users for non-mention list purposes to show an empty state.
      // They show up to 4 faces, with preference for not the viewer, so send
      // them up to 5.
      const filteredUsers =
        await context.loaders.userLoader.loadNameFilteredUsersInOrg(
          org.id,
          null,
          org.platformApplicationID,
          5,
          args.sortUsersBy,
          args.sortUsersDirection,
        );
      return filteredUsers.map((user) => ({ user, org }));
    }
  },
  joinableSlackChannels: async (org, _args, originalContext) => {
    const context = await getRelevantContext(originalContext, org.id);
    const orgIDs = await context.loaders.linkedOrgsLoader.getOrgIDs();
    return await context.loaders.slackChannelLoader.loadJoinableSlackChannels(
      orgIDs,
    );
  },

  joinedSlackChannels: async (org, _args, originalContext) => {
    const context = await getRelevantContext(originalContext, org.id);
    const orgIDs = await context.loaders.linkedOrgsLoader.getOrgIDs();
    return await context.loaders.slackChannelLoader.loadJoinedSlackChannels(
      orgIDs,
    );
  },
  recentlyActiveThreads: async (org, _args, context) => {
    const ids = await context.loaders.threadLoader.loadRecentlyActiveThreads(
      org.id,
    );
    return await context.loaders.threadLoader.loadThreads(ids);
  },
  linkedOrganization: async (org) => await org.getLinkedOrg(),
  imageURL: deprecatedFunction(() => null, 'graphql: org.imageURL'),
};

export const linkedOrgResolver: Resolvers['LinkedOrganization'] = {
  usersWithOrgDetails: (org, args, context) =>
    orgResolver.usersWithOrgDetails(org, args, context),
};
