import type { UUID } from 'common/types/index.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';

// This function finds if there is a potential corresponding, as-yet-unlinked,
// Slack user for a platform user, based on whether they share an email.  This
// enables us to deduplicate the mention list (based on an educated guess)

// IMPORTANT:
// All DB reads in this function need to be dataloaderified since this function
// is being used in the userWithOrgDetails resolver and thus introducing a
// non-dataloaderified function here would be costly for large orgs 💥

export async function findSlackUserEmailMatch(
  context: RequestContext,
  org: OrgEntity, // also platform org
  targetUser: UserEntity, // i.e. the platform user
) {
  if (!targetUser.email) {
    // you need an email to email match...
    return null;
  }

  if (org.externalProvider !== 'platform') {
    // only users from platform orgs can have a matched slack user (otherwise
    // they are already a slack user!)
    return null;
  }

  const linkedOrgID =
    await context.loaders.linkedOrgsLoader.getConnectedSlackOrgID(org.id);

  if (!linkedOrgID) {
    // this platform org is not linked to a slack org, so there are no slack
    // users to match with
    return null;
  }

  const linkedUserID = (
    await context.loaders.linkedUsersLoader.loadLinkedUserFromSourceOrgScoped(
      targetUser.id,
      org.id,
    )
  )?.linkedUserID;

  if (linkedUserID) {
    // platform user is already linked to slack user - no need to use email matching
    return null;
  }

  const platformUsersWithSameEmail =
    await context.loaders.userLoader.loadUserForEmailInOrg(
      targetUser.email,
      org.id, // platform org
    );

  if (platformUsersWithSameEmail.length > 1) {
    // if there are other users with same email (sock puppets), don't try and match
    // as it is too misleading
    return null;
  }

  const slackProfileWithMatchingEmail =
    await context.loaders.userLoader.loadUserForEmailInOrg(
      targetUser.email,
      linkedOrgID, // slack org
    );

  if (slackProfileWithMatchingEmail.length === 0) {
    // no match
    return null;
  }

  if (slackProfileWithMatchingEmail.length > 1) {
    // unexpected item in the bagging area
    return null;
  }

  const isSlackUserAlreadyLinked =
    !!(await context.loaders.linkedUsersLoader.loadPlatformUserFromLinked({
      linkedUserID: slackProfileWithMatchingEmail[0].id,
      linkedOrgID,
      sourceOrgID: org.id,
    }));

  if (isSlackUserAlreadyLinked) {
    return null;
  }
  return slackProfileWithMatchingEmail[0];
}

// Starting with a Slack user, find if it is linked or email matched to a platform
// user (for a given platform org), and if so what is that platform user's id.
// This fn is sort of the opposite of the one above (Slack -> Platform not Platform->Slack),
// except it will also return the platform user if it finds an explicit linking, not
// just an email match
export async function getLinkedOrMatchedPlatformUser({
  context,
  slackUserID,
  slackOrgID,
  platformOrgID,
}: {
  context: RequestContext;
  slackUserID: UUID;
  slackOrgID: UUID;
  platformOrgID: UUID;
}): Promise<UUID | null> {
  const linkedPlatformUser =
    await context.loaders.linkedUsersLoader.loadPlatformUserFromLinked({
      linkedUserID: slackUserID,
      linkedOrgID: slackOrgID,
      sourceOrgID: platformOrgID,
    });

  // There is an explicitly linked platform user, return that
  if (linkedPlatformUser) {
    return linkedPlatformUser.id;
  }

  const slackUserEmail = (
    await context.loaders.userLoader.loadUser(slackUserID)
  )?.email;

  if (!slackUserEmail) {
    // No email, no email linked user
    return null;
  }

  // Look for a user in the platform org with the same email as the Slack user
  const emailMatchFromLinkedPlatformOrg =
    await context.loaders.userLoader.loadUserForEmailInOrg(
      slackUserEmail,
      platformOrgID,
    );

  if (emailMatchFromLinkedPlatformOrg.length !== 1) {
    // No match, or multiple matches, in which case don't try and deduplicate
    return null;
  }

  // Return the id of the platform user we've found with the same email as the
  // Slack user
  return emailMatchFromLinkedPlatformOrg[0].id;
}
