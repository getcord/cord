import type { Transaction } from 'sequelize';
import type { UUID } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { ThreadParticipantMutator } from 'server/src/entity/thread_participant/ThreadParticipantMutator.ts';

export async function markThreadSeenForViewer(
  viewer: Viewer,
  threadID: UUID,
  transaction?: Transaction,
) {
  const threadParticipantMutator = new ThreadParticipantMutator(viewer, null);
  await threadParticipantMutator.markThreadSeen({
    threadID,
    setSubscribed: true,
    transaction,
  });
}
