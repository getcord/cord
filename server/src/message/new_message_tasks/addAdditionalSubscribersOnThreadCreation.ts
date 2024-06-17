import type { UUID } from 'common/types/index.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import { assertViewerHasOrgs } from 'server/src/auth/index.ts';
import { ThreadParticipantMutator } from 'server/src/entity/thread_participant/ThreadParticipantMutator.ts';

export async function addAdditionalSubscribersOnThreadCreation(
  context: RequestContext,
  additionalSubscribers: string[],
  threadID: UUID,
) {
  const orgIDs = assertViewerHasOrgs(context.session.viewer);
  const users = await context.loaders.userLoader.loadUsersByExternalIDsInOrg(
    additionalSubscribers,
    orgIDs,
  );
  const userIDs = users.map((u) => u.id);
  if (userIDs.length === 0) {
    return;
  }
  return await new ThreadParticipantMutator(
    context.session.viewer,
    context.loaders,
  ).subscribeUsersToThread(threadID, userIDs);
}
