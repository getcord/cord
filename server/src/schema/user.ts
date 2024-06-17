import {
  detailsForDisplay,
  loadLinkedSlackUserOrgScoped,
} from 'server/src/entity/user/util.ts';
import { deprecatedFunction } from 'server/src/logging/deprecate.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { findSlackUserEmailMatch } from 'server/src/util/findSlackUserEmailMatch.ts';

// use Required so that userWithOrgDetailsResolver can reuse field
// resolvers
export const userResolver: Required<Resolvers['User']> = {
  id: (user) => user.id,
  externalID: (user) => user.externalID,
  metadata: (user) => user.metadata,
  // In the case of platform users, names will come from the latest of a slack
  // linking, user updated name or platform api updated name
  displayName: async (user, _, context) =>
    (await detailsForDisplay(user, context)).displayName,
  fullName: async (user, _, context) =>
    (await detailsForDisplay(user, context)).fullName,
  name: (user) => user.name,
  shortName: (user) => user.screenName,
  // Like name, profilePictureURL will be the latest of a slack linking, user-
  // uploaded picture, or api update
  profilePictureURL: async (user, _, context) =>
    (await detailsForDisplay(user, context)).profilePictureURL,
  userType: deprecatedFunction(
    async (user) => user.userType,
    'graphql: user.userType',
  ),
};

export const userWithOrgDetailsResolver: Resolvers['UserWithOrgDetails'] = {
  // Shared fields with User
  id: ({ user }, args, context) => userResolver.id(user, args, context),
  metadata: ({ user }, args, context) =>
    userResolver.metadata(user, args, context),
  externalID: ({ user }, args, context) =>
    userResolver.externalID(user, args, context),
  displayName: ({ user }, args, context) =>
    userResolver.displayName(user, args, context),
  fullName: ({ user }, args, context) =>
    userResolver.fullName(user, args, context),
  name: ({ user }, args, context) => userResolver.name(user, args, context),
  shortName: ({ user }, args, context) =>
    userResolver.shortName(user, args, context),
  profilePictureURL: ({ user }, args, context) =>
    userResolver.profilePictureURL(user, args, context),
  userType: ({ user }, args, context) =>
    userResolver.userType(user, args, context),

  // This is org-scoped and only used for email-matching at the moment
  linkedUserID: async ({ user, org }, _, context) => {
    if (org.externalProvider !== 'platform') {
      // only users from platform orgs can have a linked (Slack) user
      return null;
    }

    return (
      await context.loaders.linkedUsersLoader.loadLinkedUserFromSourceOrgScoped(
        user.id,
        org.id,
      )
    )?.linkedUserID;
  },
  // Org-scoped because this is used in relation to notifications
  canBeNotifiedOnSlack: async ({ user, org }, _, context) =>
    !!(await loadLinkedSlackUserOrgScoped(user, context, org.id)),
  slackUserWithMatchingEmail: async ({ user, org }, _, context) =>
    (await findSlackUserEmailMatch(context, org, user))?.id,
};
