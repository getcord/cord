import type { RequestContext } from 'server/src/RequestContext.ts';
import type { Logger } from 'server/src/logging/Logger.ts';
import type { DisplayableUser } from 'common/util/index.ts';
import type { UUID } from 'common/types/index.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';

// Returns the Slack profile linked to the user but also from the workspace
// linked to the viewer org (old, non-unified profile approach)
export async function loadLinkedSlackUserOrgScoped(
  user: UserEntity,
  context: RequestContext,
  orgID: UUID,
): Promise<UserEntity | null> {
  if (user.externalProvider === 'slack') {
    return user;
  }

  const linkedUser =
    await context.loaders.linkedUsersLoader.loadLinkedUserFromSourceOrgScoped(
      user.id,
      orgID,
    );
  if (!linkedUser) {
    return null;
  }
  return await context.loaders.userLoader.loadUser(linkedUser.linkedUserID);
}

// When choosing which profile name/picture we should display for a platform user,
// we consider:
// 1) Slack linked user details - across ANY org the user is linked in
// 2) Information set via the platform API
// And we choose the pieces of information with the most recent timestamps,
// i.e. last write wins
export async function detailsForDisplay(
  user: UserEntity,
  context: RequestContext,
): Promise<
  DisplayableUser & { name: string | null; screenName: string | null }
> {
  async function determineUser() {
    let platformUser: UserEntity | null =
      user.externalProvider === 'platform' ? user : null;

    // The user could be a Slack user if it's an extension user, in which case it's
    // easy to choose the profile - just use the Slack info
    // In the platform world, it could be a Slack user if we are dealing with profiles
    // for the mention list, or for a message which was a reply from Slack (in a
    // mirrored thread or a reply to a Cordbot notification).  In this case, we
    // should check to see if there is a linked platform user, and if so we need to
    // find the right profile based on that platform user's profile plus the profile
    // of the Slack user they are MOST RECENTLY linked to - which might not actually
    // be the one we started with (in the case that the platform user has linked
    // to multiple different Slack users across different platform orgs)
    if (user.externalProvider === 'slack') {
      if (!context.session.viewer.platformApplicationID) {
        return {
          id: user.id,
          ...getUnifiedProfile(null, user, undefined),
        };
      }

      // Look to see if there is a platform user in the viewer org which is linked
      // to this slack user
      // Todo: how do we know which platform org we are looking in the context of,
      // if we are taking orgs out of viewer?  We don't need to know for org members
      // context list/mention list because we only load Slack IDs that are NOT already
      // linked (or email matched).  But we will need to know for imported message
      // authors.

      let linking = null;
      if (context.session.viewer.orgID) {
        linking =
          await context.loaders.linkedUsersLoader.loadPlatformUserFromLinkedUserID(
            {
              linkedUserID: user.id,
              sourceOrgID: context.session.viewer.orgID,
            },
          );
      }

      // If there is, this platform user will be the basis of the next steps
      // (as if we'd started with this platform user in the first place)
      // If not, we will return the vanilla Slack profile
      platformUser = linking
        ? await context.loaders.userLoader.loadUser(linking.sourceUserID)
        : null;

      // But if the linked user is deleted, pretend there's nobody linked
      if (platformUser?.state === 'deleted') {
        platformUser = null;
      }
    }

    // This is a Slack user and we didn't find a platform user connected to it,
    // so just return the Slack user profile
    if (!platformUser) {
      return {
        id: user.id,
        ...getUnifiedProfile(null, user, undefined),
      };
    }

    // Find the most recently linked slack user to the platform user - this may
    // or may not be the one this resolver has been called for ('this')
    const mostRecentLinking =
      await context.loaders.linkedUsersLoader.loadLatestLinkedUserFromSourceAllOrgs(
        platformUser.id,
      );

    const mostRecentLinkedProfile = mostRecentLinking
      ? await context.loaders.userLoader.loadUser(
          mostRecentLinking.linkedUserID,
        )
      : null;

    const displayDetails = getUnifiedProfile(
      platformUser,
      mostRecentLinkedProfile,
      mostRecentLinking?.linkedTimestamp,
    );

    return {
      id: user.id,
      name:
        displayDetails.name ??
        emailUsername(user.email, context.logger) ??
        'Unknown',
      screenName: displayDetails.screenName,
      profilePictureURL: displayDetails.profilePictureURL ?? null,
    };
  }

  const consolidatedUser = await determineUser();
  return {
    ...consolidatedUser,
    displayName: userDisplayName(consolidatedUser),
    fullName: userFullName(consolidatedUser),
  };
}

// This function is a hack to improve UX for users for which we don't have
// any name-related information (ie. no name, {first,last,screen}Name). For
// such users, we pretend that their name is the username they use in their
// email. At the moment this only affects platform users.
function emailUsername(email: string | null, logger: Logger) {
  if (!email) {
    return null;
  }

  const atIndex = email.lastIndexOf('@');
  if (atIndex === -1) {
    // an email without @ sign. How strange.
    // this should never happen, if it does I would like to know about
    // this so that we can update the logic here.
    logger.error('profile with strange email - @ missing', {
      email,
    });

    return email;
  }
  return email.substring(0, atIndex);
}

function getUnifiedProfile(
  platformUser: UserEntity | null,
  slackUser: UserEntity | null,
  linkedTimestamp: Date | undefined,
) {
  if (!platformUser && !slackUser) {
    throw new Error('Must have at least one profile');
  }

  // If we're just dealing with a Slack profile, return the Slack profile info
  if (!platformUser) {
    return {
      name: slackUser!.name,
      screenName: slackUser!.screenName,
      profilePictureURL: slackUser!.profilePictureURL,
    };
  }

  // If we have a platform profile (and maybe a Slack profile), let's assemble
  // the various possible options their names and profile picture could be
  const nameOptions = [
    {
      // Api uploaded via platform api
      timestamp: platformUser.nameUpdatedTimestamp,
      fields: {
        name: platformUser.name,
        // in practice screenName can only be set via Slack
        screenName: platformUser.screenName,
      },
    },
    // Linked info: a platform user linked to a Slack user
    {
      timestamp: linkedTimestamp,
      fields: {
        name: slackUser?.name ?? null,
        screenName: slackUser?.screenName ?? null,
      },
    },
  ];

  const profilePictureOptions = [
    // Api uploaded: via slack for extension user, or platform api for sdk user
    {
      timestamp: platformUser.profilePictureURLUpdatedTimestamp,
      fields: {
        profilePictureURL: platformUser.profilePictureURL,
      },
    },
    // Linked info: a platform user linked to a Slack user
    {
      timestamp: linkedTimestamp,
      fields: {
        profilePictureURL: slackUser?.profilePictureURL ?? null,
      },
    },
  ];

  // Find the most recent names
  const mostRecentNames = nameOptions.reduce((acc, el) =>
    !acc.timestamp || (el.timestamp && el.timestamp > acc.timestamp) ? el : acc,
  );

  // And the most recent profile picture
  const mostRecentProfilePictureURL = profilePictureOptions.reduce((acc, el) =>
    !acc.timestamp || (el.timestamp && el.timestamp > acc.timestamp) ? el : acc,
  );

  return { ...mostRecentNames.fields, ...mostRecentProfilePictureURL.fields };
}

export const userDisplayName = (user: {
  name: string | null | undefined;
  screenName: string | null | undefined;
}) => user.screenName || user.name || 'unknown';

export const userFullName = (user: {
  name: string | null | undefined;
  screenName: string | null | undefined;
}) => user.name || user.screenName || 'Unknown';
