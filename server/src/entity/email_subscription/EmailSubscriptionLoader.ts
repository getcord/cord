import type { UUID } from 'common/types/index.ts';
import type { Viewer } from 'server/src/auth/index.ts';
import { EmailSubscriptionEntity } from 'server/src/entity/email_subscription/EmailSubscriptionEntity.ts';

export class EmailSubscriptionLoader {
  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  async isUserSubscribedToThread(
    userID: UUID,
    threadID: UUID,
  ): Promise<boolean> {
    const result = await EmailSubscriptionEntity.findOne({
      where: { userID, threadID },
    });

    return result?.subscribed ?? true; // If no entry, the user hasn't opted-out of email subscription
  }
}
