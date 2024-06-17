import type { Transaction } from 'sequelize';
import type { Location } from '@cord-sdk/types';
import type { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { publishPubSubEvent } from 'server/src/pubsub/index.ts';

export async function publishNewThreadEvents(
  location: Location,
  thread: ThreadEntity,
  transaction?: Transaction,
) {
  const notify = async () => {
    await publishPubSubEvent(
      'page-thread-added-with-location',
      { orgID: thread.orgID },
      { threadID: thread.id, location },
    );

    await publishPubSubEvent(
      'thread-created',
      { threadID: thread.id },
      { threadID: thread.id },
    );
  };

  if (transaction) {
    transaction.afterCommit(notify);
  } else {
    await notify();
  }
}
