import type { UUID } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { OrgMembersLoader } from 'server/src/entity/org_members/OrgMembersLoader.ts';
import { ThreadParticipantMutator } from 'server/src/entity/thread_participant/ThreadParticipantMutator.ts';
import { getFeatureFlagValue } from 'server/src/featureflags/index.ts';
import type { FlagsUser } from 'server/src/featureflags/index.ts';

export async function maybeAddEveryOrgMemberAsThreadParticipants(
  viewer: Viewer,
  flagsUser: FlagsUser,
  threadID: UUID,
) {
  // Some customers would like their users to be subscribed to all threads in
  // their org - they want to see ALL activity in their inbox notifications
  if (await getFeatureFlagValue('subscribe_all_org_members', flagsUser)) {
    await addEveryOrgMemberToThreadParticipants(viewer, threadID);
  }
}

// Note this does NOT add linked org members, only the original org
async function addEveryOrgMemberToThreadParticipants(
  viewer: Viewer,
  threadID: UUID,
) {
  const orgMembersLoader = new OrgMembersLoader(viewer);
  const orgMembers = await orgMembersLoader.loadNotifiableOrgMembers(undefined);

  const userIDs = orgMembers.map((u) => u.userID);

  return await new ThreadParticipantMutator(
    viewer,
    null,
  ).subscribeUsersToThread(threadID, userIDs);
}
