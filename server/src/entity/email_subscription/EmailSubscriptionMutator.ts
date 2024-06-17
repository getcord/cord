import type { Viewer } from 'server/src/auth/index.ts';
import { assertViewerHasUser } from 'server/src/auth/index.ts';
import { EmailSubscriptionEntity } from 'server/src/entity/email_subscription/EmailSubscriptionEntity.ts';
import type { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { ThreadParticipantMutator } from 'server/src/entity/thread_participant/ThreadParticipantMutator.ts';

export class EmailSubscriptionMutator {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  async setEmailUnsubscribed(thread: ThreadEntity): Promise<void> {
    const userID = assertViewerHasUser(this.viewer);

    // Updating ThreadParticipant too, as that's what drives the UI.
    await new ThreadParticipantMutator(this.viewer, null).setViewerSubscribed(
      thread,
      false,
    );
    await EmailSubscriptionEntity.upsert({
      userID,
      threadID: thread.id,
      subscribe: false,
    });
  }
}
